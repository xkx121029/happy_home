const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// 集中读取环境变量（config 内部会先加载 backend/.env），必须在读取任何
// process.env 之前引入；jwt / response / 鉴权等公共能力也在这里接好。
const config = require('./src/config');
const { PORT, CORS_ORIGINS } = config;
const jwt = require('./src/lib/jwt');
const password = require('./src/lib/password');
const { ok, fail } = require('./src/lib/response');
const asyncHandler = require('./src/middleware/asyncHandler');
const createAuth = require('./src/middleware/auth');
const { checkCommentRate } = require('./src/middleware/rateLimit');

const { initDatabase, getDb, dbHelpers, saveDatabase } = require('./db');
const mailer = require('./mailer');
const { sendVerificationCode, testConnection, testConnectionWithConfig, createTransporter } = require('./mailer');

const app = express();

// CORS 白名单来自 src/config（原来是 cors() 全开放，任何站点都能带凭证调这些接口）
app.use(cors({
  origin(origin, callback) {
    // 同源请求、curl、服务端调用没有 origin，放行
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.length === 0) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// 验证码存储（内存中，生产环境应使用 Redis）
const verificationCodes = new Map();

// 参数化查询助手统一由 src/db/repo.js 提供（execQuery / getSingle / bindable）
const { execQuery, getSingle, bindable } = require('./src/db/repo');

// 鉴权中间件由工厂创建，db 助手通过参数注入（见 src/middleware/auth.js）
const { authenticateToken, optionalAuth, requireRole } = createAuth({ getDb, getSingle });

app.post('/api/comments', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const { postId, parentId, author, email, content } = req.body;
    
    if (!author || !email || !content) {
      return res.status(400).json({ success: false, message: '请填写所有必填字段' });
    }

    const newComment = {
      id: uuidv4(),
      post_id: postId || null,
      parent_id: parentId || null,
      author,
      email,
      content,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.run(
      'INSERT INTO comments (id, post_id, parent_id, author, email, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newComment.id, newComment.post_id, newComment.parent_id, newComment.author, newComment.email, newComment.content, newComment.status, newComment.created_at, newComment.updated_at]
    );
    saveDatabase();

    db.run(
      'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), null, 'comment', '新评论', `用户 ${author} 发表了新评论`, '/admin/comments']
    );
    saveDatabase();

    res.json({ success: true, data: newComment, message: '评论已添加' });
  } catch (error) {
    console.error(error);
    // 原来这里返回的是 HTTP 200 + success:false，前端会当成成功处理
    res.status(500).json({ success: false, message: '添加评论失败' });
  }
});

app.get('/api/comments', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM comments';
    const params = [];
    const conditions = [];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }

    if (req.query.postId) {
      conditions.push('post_id = ?');
      params.push(req.query.postId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const comments = execQuery(db, sql, params);
    res.json({ success: true, data: comments, count: comments.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/comments/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    const db = getDb();
    const comment = getSingle(db, 'SELECT * FROM comments WHERE id = ?', [req.params.id]);

    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    db.run('UPDATE comments SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, req.params.id]);
    saveDatabase();

    const updatedComment = getSingle(db, 'SELECT * FROM comments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '评论状态更新成功', data: updatedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/comments/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const comment = getSingle(db, 'SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    db.run('DELETE FROM comments WHERE id = ? OR parent_id = ?', [req.params.id, req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '评论删除成功', data: comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/menus', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const menus = execQuery(db, 'SELECT * FROM menus ORDER BY created_at DESC').map(menu => ({
      ...menu,
      items: menu.items ? JSON.parse(menu.items) : []
    }));
    res.json({ success: true, data: menus, count: menus.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/menus', authenticateToken, (req, res) => {
  try {
    const { title, location, items } = req.body;
    const db = getDb();

    if (!title) {
      return res.status(400).json({ success: false, message: '请输入菜单标题' });
    }

    const newMenuId = uuidv4();
    db.run(
      'INSERT INTO menus (id, title, location, items) VALUES (?, ?, ?, ?)',
      [newMenuId, title, location || 'header', JSON.stringify(items || [])]
    );
    saveDatabase();

    const newMenu = getSingle(db, 'SELECT * FROM menus WHERE id = ?', [newMenuId]);
    res.status(201).json({ success: true, message: '菜单创建成功', data: { ...newMenu, items: JSON.parse(newMenu.items || '[]') } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/menus/:id', authenticateToken, (req, res) => {
  try {
    const { title, location, items } = req.body;
    const db = getDb();
    const menu = getSingle(db, 'SELECT * FROM menus WHERE id = ?', [req.params.id]);

    if (!menu) {
      return res.status(404).json({ success: false, message: '菜单不存在' });
    }

    db.run(
      // items 原本是 `items = ?` + `JSON.stringify(items || [])`：只要请求里没带 items
      // （例如只想改标题），就会把整个菜单项列表清空成 []。改为 COALESCE 后跳过未传字段。
      'UPDATE menus SET title = COALESCE(?, title), location = COALESCE(?, location), items = COALESCE(?, items), updated_at = datetime("now") WHERE id = ?',
      bindable([title, location, items === undefined ? undefined : JSON.stringify(items), req.params.id])
    );
    saveDatabase();

    const updatedMenu = getSingle(db, 'SELECT * FROM menus WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '菜单更新成功', data: { ...updatedMenu, items: JSON.parse(updatedMenu.items || '[]') } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/menus/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const menu = getSingle(db, 'SELECT * FROM menus WHERE id = ?', [req.params.id]);
    if (!menu) {
      return res.status(404).json({ success: false, message: '菜单不存在' });
    }

    db.run('DELETE FROM menus WHERE id = ?', [req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '菜单删除成功', data: { ...menu, items: JSON.parse(menu.items || '[]') } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/widgets', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM widgets';
    const params = [];

    if (req.query.location) {
      sql += ' WHERE location = ?';
      params.push(req.query.location);
    }

    sql += ' ORDER BY order_num ASC';

    const widgets = execQuery(db, sql, params).map(w => ({
      ...w,
      enabled: w.enabled === 1,
      config: w.config ? JSON.parse(w.config) : {}
    }));

    res.json({ success: true, data: widgets, count: widgets.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/widgets', authenticateToken, (req, res) => {
  try {
    const { name, type, location, config } = req.body;
    const db = getDb();

    if (!type) {
      return res.status(400).json({ success: false, message: '请选择部件类型' });
    }

    const newWidgetId = uuidv4();
    // location 未传时原样绑定 undefined 会让 sql.js 抛错，必须回退到默认值再查询
    const widgetLocation = location || 'sidebar';
    const maxOrder = execQuery(db, 'SELECT MAX(order_num) as max_order FROM widgets WHERE location = ?', [widgetLocation])[0]?.max_order || 0;

    db.run(
      'INSERT INTO widgets (id, name, type, location, order_num, config) VALUES (?, ?, ?, ?, ?, ?)',
      [newWidgetId, name || type, type, widgetLocation, maxOrder + 1, JSON.stringify(config || {})]
    );
    saveDatabase();

    const newWidget = getSingle(db, 'SELECT * FROM widgets WHERE id = ?', [newWidgetId]);
    res.status(201).json({
      success: true,
      message: '部件创建成功',
      data: { ...newWidget, enabled: newWidget.enabled === 1, config: JSON.parse(newWidget.config || '{}') }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/widgets/:id', authenticateToken, (req, res) => {
  try {
    const { name, enabled, config, location, order_num } = req.body;
    const db = getDb();
    const widget = getSingle(db, 'SELECT * FROM widgets WHERE id = ?', [req.params.id]);

    if (!widget) {
      return res.status(404).json({ success: false, message: '部件不存在' });
    }

    db.run(
      // config 原本是 `config = ?` + `JSON.stringify(config || widget.config)`：widget.config
      // 已是 JSON 字符串，会被二次编码。改为未传时跳过（COALESCE 保持原值）。
      // enabled 原本在未传时绑定 undefined，正是 toggleEnabled 类调用 500 的原因。
      'UPDATE widgets SET name = COALESCE(?, name), enabled = COALESCE(?, enabled), config = COALESCE(?, config), location = COALESCE(?, location), order_num = COALESCE(?, order_num) WHERE id = ?',
      bindable([name, enabled === undefined ? undefined : (enabled ? 1 : 0), config === undefined ? undefined : JSON.stringify(config), location, order_num, req.params.id])
    );
    saveDatabase();

    const updatedWidget = getSingle(db, 'SELECT * FROM widgets WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: '部件更新成功',
      data: { ...updatedWidget, enabled: updatedWidget.enabled === 1, config: JSON.parse(updatedWidget.config || '{}') }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/widgets/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const widget = getSingle(db, 'SELECT * FROM widgets WHERE id = ?', [req.params.id]);
    if (!widget) {
      return res.status(404).json({ success: false, message: '部件不存在' });
    }

    db.run('DELETE FROM widgets WHERE id = ?', [req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '部件删除成功', data: widget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/media', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const media = execQuery(db, 'SELECT * FROM media ORDER BY uploaded_at DESC');
    res.json({ success: true, data: media, count: media.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/media', authenticateToken, (req, res) => {
  try {
    const { name, url, size, type } = req.body;
    const db = getDb();

    if (!name || !url) {
      return res.status(400).json({ success: false, message: '请提供文件名和URL' });
    }

    const newMediaId = uuidv4();
    db.run(
      'INSERT INTO media (id, name, url, size, type) VALUES (?, ?, ?, ?, ?)',
      [newMediaId, name, url, size || '未知', type || 'image/jpeg']
    );
    saveDatabase();

    const newMedia = getSingle(db, 'SELECT * FROM media WHERE id = ?', [newMediaId]);
    res.status(201).json({ success: true, message: '媒体文件上传成功', data: newMedia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/media/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const media = getSingle(db, 'SELECT * FROM media WHERE id = ?', [req.params.id]);
    if (!media) {
      return res.status(404).json({ success: false, message: '媒体文件不存在' });
    }

    db.run('DELETE FROM media WHERE id = ?', [req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '媒体文件删除成功', data: media });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/settings', authenticateToken, (req, res) => {
  try {
    const settings = dbHelpers.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/settings', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    dbHelpers.updateSettings(req.body);
    const settings = dbHelpers.getSettings();
    res.json({ success: true, message: '设置更新成功', data: settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/users', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    const db = getDb();
    const users = execQuery(db, 'SELECT id, username, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    // 原来只校验了登录，任何用户都能用 id 遍历出他人的资料。
    // 这里限制为「本人或管理员」，管理员判定直接查库而不信 token 里的角色。
    const requester = getSingle(db, 'SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (req.user.id !== req.params.id && requester?.role !== 'administrator') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    const user = getSingle(db, 'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/users', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    const { username, email, password, role, status } = req.body;
    const db = getDb();

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写用户名、邮箱和密码' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    const existingUser = getSingle(db, 'SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    const newUserId = uuidv4();
    db.run(
      'INSERT INTO users (id, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [newUserId, username, email, bcrypt.hashSync(password, 10), role || 'author', status || 'active']
    );
    saveDatabase();

    const newUser = getSingle(db, 'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?', [newUserId]);
    res.status(201).json({ success: true, message: '用户创建成功', data: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    const { username, email, password, role, status } = req.body;
    const db = getDb();
    const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [req.params.id]);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    const updates = [username || user.username, email || user.email, role || user.role, status || user.status];
    let sql = 'UPDATE users SET username = ?, email = ?, role = ?, status = ?, updated_at = datetime("now")';

    if (password) {
      sql += ', password = ?';
      updates.push(bcrypt.hashSync(password, 10));
    }

    sql += ' WHERE id = ?';
    updates.push(req.params.id);

    db.run(sql, updates);
    saveDatabase();

    const updatedUser = getSingle(db, 'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '用户更新成功', data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    const db = getDb();
    const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (user.role === 'administrator') {
      return res.status(400).json({ success: false, message: '不能删除管理员账户' });
    }

    db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '用户删除成功', data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/posts', (req, res) => {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM posts WHERE status = ?';
    const params = ['published'];

    if (req.query.search) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const posts = execQuery(db, sql, params);
    res.json({ success: true, data: posts, count: posts.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/posts/:id', (req, res) => {
  try {
    const db = getDb();
    const post = getSingle(db, 'SELECT * FROM posts WHERE id = ? AND status = ?', [req.params.id, 'published']);
    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/pages', (req, res) => {
  try {
    const db = getDb();
    const pages = execQuery(db, 'SELECT * FROM pages WHERE status = ? ORDER BY created_at DESC', ['published']);
    res.json({ success: true, data: pages, count: pages.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/pages/:slug', (req, res) => {
  try {
    const db = getDb();
    const page = getSingle(db, 'SELECT * FROM pages WHERE slug = ? AND status = ?', [req.params.slug, 'published']);
    if (!page) {
      return res.status(404).json({ success: false, message: '页面不存在' });
    }
    res.json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/settings', (req, res) => {
  try {
    const allSettings = dbHelpers.getSettings();
    const publicSettings = {
      siteName: allSettings.siteName,
      siteDescription: allSettings.siteDescription,
      siteUrl: allSettings.siteUrl,
      enableDarkMode: allSettings.enableDarkMode
    };
    res.json({ success: true, data: publicSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ------------------------------------------------------- 公开评论（访客可用）
//
// 原来前台提交评论走的是 POST /api/comments，而那个端点挂了 authenticateToken：
// 访客没有 token，永远拿到 401，评论功能实际上从未对公众开放。
// 这里为前台单独开一组端点，并做好滥用防护。

// 可选鉴权：有合法 token 就带上用户信息，没有也放行（统一走 src/middleware/auth.js，见文件顶部）

// 访客评论限流已抽到 src/middleware/rateLimit.js（由 checkCommentRate 注入使用）

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/public/comments', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const { postId, parentId, author, email, content } = req.body || {};

    if (!author || !email || !content) {
      return res.status(400).json({ success: false, message: '请填写昵称、邮箱和评论内容' });
    }
    if (!EMAIL_PATTERN.test(String(email))) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }
    // 长度上限：不加限制的话单条评论可以塞进任意大的内容
    if (String(author).length > 50) {
      return res.status(400).json({ success: false, message: '昵称不能超过 50 个字符' });
    }
    if (String(content).length > 5000) {
      return res.status(400).json({ success: false, message: '评论内容不能超过 5000 个字符' });
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const ipCheck = checkCommentRate(`ip:${ip}`);
    if (!ipCheck.allowed) {
      return res.status(429).json({ success: false, message: '提交过于频繁，请稍后再试' });
    }
    const emailCheck = checkCommentRate(`email:${String(email).toLowerCase()}`);
    if (!emailCheck.allowed) {
      return res.status(429).json({ success: false, message: '提交过于频繁，请稍后再试' });
    }

    if (!postId) {
      return res.status(400).json({ success: false, message: '缺少文章标识' });
    }
    const post = getSingle(db, 'SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    // 访客评论一律先审核，绝不直接公开
    const id = uuidv4();
    db.run(
      'INSERT INTO comments (id, post_id, parent_id, author, email, content, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, postId, parentId || null, String(author).trim(), String(email).trim(), String(content).trim(), 'pending']
    );
    db.run(
      'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), null, 'comment', '新评论', `访客 ${author} 发表了新评论，待审核`, '/admin/comments']
    );
    saveDatabase();

    const created = getSingle(db, 'SELECT * FROM comments WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: created, message: '评论已提交，审核通过后显示' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 前台读取某篇文章的已审核评论（含回复，便于一次性渲染嵌套结构）
app.get('/api/public/posts/:id/comments', (req, res) => {
  try {
    const db = getDb();
    const comments = execQuery(
      db,
      'SELECT id, post_id, parent_id, author, content, created_at FROM comments WHERE post_id = ? AND status = ? ORDER BY created_at ASC',
      [req.params.id, 'approved']
    );
    res.json({ success: true, data: comments, count: comments.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 前台侧栏「最新评论」用。原来那个部件靠 DataContext 里一份只有管理员才会加载的
// 全量评论列表（含待审核），访客看到的一直是空的。这里提供公开的已审核评论流，
// 并只取已发布文章下的评论，避免把草稿文章的标题泄露出去。
app.get('/api/public/comments/recent', (req, res) => {
  try {
    const db = getDb();
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
    const comments = execQuery(
      db,
      `SELECT c.id, c.post_id, c.author, c.content, c.created_at, p.title AS post_title
       FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE c.status = 'approved' AND c.parent_id IS NULL AND p.status = 'published'
       ORDER BY c.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ success: true, data: comments, count: comments.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// Analytics 相关端点
app.get('/api/analytics/stats', authenticateToken, (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dailyData.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 200) + 50,
      });
    }

    const todayCount = dailyData[dailyData.length - 1]?.count || 0;
    const weekCount = dailyData.reduce((sum, day) => sum + day.count, 0);
    const monthCount = weekCount * 4;
    const trend = Math.floor((Math.random() - 0.5) * 20);

    res.json({
      success: true,
      data: {
        today: todayCount,
        week: weekCount,
        month: monthCount,
        total: Math.floor(weekCount * 15),
        trend,
        dailyData,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/analytics/track', authenticateToken, (req, res) => {
  try {
    const { type, data } = req.body;
    console.log('Analytics track:', type, data);
    res.json({ success: true, message: '数据已记录' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// SMTP 相关端点
app.post('/api/auth/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: '请输入邮箱地址' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
    }

    const db = getDb();
    const user = getSingle(db, 'SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '该邮箱未注册' });
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 保存验证码，有效期10分钟
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const result = await sendVerificationCode(email, code);
    
    if (result.success) {
      res.json({ success: true, message: '验证码已发送' });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ success: false, message: '请输入邮箱和验证码' });
    }

    const storedCode = verificationCodes.get(email);
    
    if (!storedCode) {
      return res.status(400).json({ success: false, message: '请先获取验证码' });
    }

    if (Date.now() > storedCode.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ success: false, message: '验证码已过期' });
    }

    if (storedCode.code !== code) {
      return res.status(400).json({ success: false, message: '验证码不正确' });
    }

    // 验证成功，删除验证码
    verificationCodes.delete(email);
    
    res.json({ success: true, message: '验证成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: '请填写所有字段' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    const storedCode = verificationCodes.get(email);
    
    if (!storedCode) {
      return res.status(400).json({ success: false, message: '请先获取验证码' });
    }

    if (Date.now() > storedCode.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ success: false, message: '验证码已过期' });
    }

    if (storedCode.code !== code) {
      return res.status(400).json({ success: false, message: '验证码不正确' });
    }

    const db = getDb();
    db.run(
      'UPDATE users SET password = ?, updated_at = datetime("now") WHERE email = ?',
      [bcrypt.hashSync(newPassword, 10), email]
    );
    saveDatabase();

    verificationCodes.delete(email);
    
    res.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/smtp/test', authenticateToken, requireRole('administrator'), async (req, res) => {
  try {
    const { useSavedConfig = true, testConfig } = req.body;
    
    let result;
    if (useSavedConfig || !testConfig) {
      result = await testConnection();
    } else {
      result = await testConnectionWithConfig(testConfig);
    }
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/smtp/refresh', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    createTransporter();
    res.json({ success: true, message: 'SMTP 配置已刷新' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 通知 API
app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const notifications = execQuery(
      db,
      'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unreadCount = getSingle(
      db,
      'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0',
      [req.user.id]
    );
    res.json({
      success: true,
      notifications: notifications.map(n => ({ ...n, isRead: n.is_read === 1 })),
      unreadCount: unreadCount?.count || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '获取通知失败' });
  }
});

app.get('/api/notifications/unread', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const notifications = execQuery(
      db,
      'SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, notifications: notifications.map(n => ({ ...n, isRead: false })) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '获取未读通知失败' });
  }
});

app.get('/api/notifications/count', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const result = getSingle(
      db,
      'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0',
      [req.user.id]
    );
    res.json({ success: true, count: result?.count || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '获取未读数失败' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ success: true, message: '通知已标记为已读' });
  } catch (error) {
    console.error(error);
    // 原来这里返回 HTTP 200 + success:true，操作明明失败了前端却当成成功，
    // 用户点「标记已读」不会有任何提示，问题也被完全掩盖。
    res.status(500).json({ success: false, message: '通知操作失败' });
  }
});

app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL', [req.user.id]);
    saveDatabase();
    res.json({ success: true, message: '所有通知已标记为已读' });
  } catch (error) {
    console.error(error);
    // 原来这里返回 HTTP 200 + success:true，操作明明失败了前端却当成成功，
    // 用户点「标记已读」不会有任何提示，问题也被完全掩盖。
    res.status(500).json({ success: false, message: '通知操作失败' });
  }
});

app.delete('/api/notifications/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ success: true, message: '通知已删除' });
  } catch (error) {
    console.error(error);
    // 原来这里返回 HTTP 200 + success:true，操作明明失败了前端却当成成功，
    // 用户点「标记已读」不会有任何提示，问题也被完全掩盖。
    res.status(500).json({ success: false, message: '通知操作失败' });
  }
});

app.delete('/api/notifications/clear', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    db.run('DELETE FROM notifications');
    saveDatabase();
    res.json({ success: true, message: '所有通知已清空' });
  } catch (error) {
    console.error(error);
    // 原来这里返回 HTTP 200 + success:true，操作明明失败了前端却当成成功，
    // 用户点「标记已读」不会有任何提示，问题也被完全掩盖。
    res.status(500).json({ success: false, message: '通知操作失败' });
  }
});

// 创建通知的辅助函数
function createNotification(userId, type, title, message, link = null) {
  try {
    const db = getDb();
    const id = uuidv4();
    db.run(
      'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, type, title, message, link]
    );
    saveDatabase();
    return { success: true, id };
  } catch (error) {
    console.error('创建通知失败:', error);
    return { success: false, error: error.message };
  }
}

// 创建示例通知（用于演示）
app.post('/api/notifications/demo', authenticateToken, (req, res) => {
  try {
    const demoNotifications = [
      { type: 'success', title: '系统启动成功', message: 'HappyHome 系统已成功启动并运行' },
      { type: 'post', title: '新文章发布', message: '文章《欢迎使用 HappyHome》已发布' },
      { type: 'comment', title: '新评论', message: '用户发表了新评论：非常棒的系统！' },
      { type: 'error', title: 'SMTP 配置提醒', message: '请配置 SMTP 以启用邮件发送功能' },
      { type: 'info', title: '数据库已更新', message: '数据库表结构已更新到最新版本' },
    ];

    const db = getDb();
    demoNotifications.forEach(notif => {
      const id = uuidv4();
      db.run(
        'INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, notif.type, notif.title, notif.message]
      );
    });
    saveDatabase();

    res.json({ success: true, message: '示例通知已创建' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '示例通知创建失败' });
  }
});

// ---------------------------------------------------------------- 备份管理
//
// 原来 /api/backups 一组接口完全不存在，前端 Backup 页的 10 个操作全是
// 「暂未实现」的提示。这里做真实的文件级备份。
//
// 设计取舍：备份文件放在 backend/backups/ 目录，而不是写进数据库的 backups 表。
// 备份的意义就是在数据库本身损坏时还能救回来，把它存进同一个库
// 是自我循环 —— 库没了，备份跟着一起没。所以以文件系统为唯一真源，
// 列表直接读目录，不依赖任何数据库表。

const BACKUP_DIR = path.join(__dirname, 'backups');
const DB_FILE = path.join(__dirname, 'happyhome.db');
const BACKUP_FILE_PATTERN = /^happyhome-[\dT\-Z]+-(manual|auto)\.db$/;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function backupFileName(type) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `happyhome-${stamp}-${type}.db`;
}

function describeBackup(fileName) {
  const stat = fs.statSync(path.join(BACKUP_DIR, fileName));
  const match = fileName.match(/-(manual|auto)\.db$/);
  return {
    id: fileName,
    name: fileName,
    type: match ? match[1] : 'unknown',
    size: stat.size,
    createdAt: stat.mtime.toISOString(),
  };
}

function listBackups() {
  ensureBackupDir();
  return fs.readdirSync(BACKUP_DIR)
    .filter((name) => BACKUP_FILE_PATTERN.test(name))
    .map(describeBackup)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 备份 id 来自 URL，必须挡住 ../ 之类的路径穿越
function resolveBackupPath(id) {
  if (!BACKUP_FILE_PATTERN.test(id)) return null;
  const full = path.join(BACKUP_DIR, id);
  if (path.dirname(full) !== BACKUP_DIR) return null;
  return fs.existsSync(full) ? full : null;
}

app.get('/api/backups', authenticateToken, (req, res) => {
  try {
    const backups = listBackups();
    res.json({ success: true, data: backups, count: backups.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/backups', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return res.status(400).json({ success: false, message: '数据库文件不存在，无法备份' });
    }
    ensureBackupDir();
    const fileName = backupFileName('manual');
    // 先写临时文件再改名，避免列表里出现半截文件
    const target = path.join(BACKUP_DIR, fileName);
    fs.copyFileSync(DB_FILE, `${target}.tmp`);
    fs.renameSync(`${target}.tmp`, target);
    res.status(201).json({ success: true, message: '备份创建成功', data: describeBackup(fileName) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/backups/:id/download', authenticateToken, (req, res) => {
  const filePath = resolveBackupPath(req.params.id);
  if (!filePath) {
    return res.status(404).json({ success: false, message: '备份不存在' });
  }
  res.download(filePath, req.params.id);
});

app.delete('/api/backups/:id', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    const filePath = resolveBackupPath(req.params.id);
    if (!filePath) {
      return res.status(404).json({ success: false, message: '备份不存在' });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true, message: '备份已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/backups/:id/restore', authenticateToken, requireRole('administrator'), async (req, res) => {
  try {
    const filePath = resolveBackupPath(req.params.id);
    if (!filePath) {
      return res.status(404).json({ success: false, message: '备份不存在' });
    }

    // 恢复前先把当前状态存一份，误操作还有回头路
    const safetyName = backupFileName('auto');
    ensureBackupDir();
    const safetyPath = path.join(BACKUP_DIR, safetyName);
    fs.copyFileSync(DB_FILE, safetyPath);

    fs.copyFileSync(filePath, DB_FILE);

    // 内存里的 sql.js 实例还持有旧数据，必须重新加载，否则接口返回的仍是恢复前的内容
    await initDatabase();

    res.json({
      success: true,
      message: `已从备份恢复，恢复前的数据已自动保存为 ${safetyName}`,
      data: { safetyBackup: safetyName },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '恢复失败：' + error.message });
  }
});

// ------------------------------------------------------------ 定时发布调度
//
// 这段逻辑原来在前端（App.jsx 里的 setInterval）：依赖数组为空，闭包永远捕获
// 首次渲染时的 posts 列表，加上 posts 表当时根本没有 publish_date 列，
// 所以「定时发布」从头到尾没有生效过一次。移到后端用一条 SQL 完成，
// 既不依赖有没有人打开管理页面，也不需要在前端保存一份会过期的副本。
function publishDuePosts() {
  try {
    const db = getDb();
    const due = execQuery(
      db,
      "SELECT id, title FROM posts WHERE status = 'future' AND publish_date IS NOT NULL AND datetime(publish_date) <= datetime('now')"
    );
    if (due.length === 0) return 0;

    db.run(
      "UPDATE posts SET status = 'published', publish_date = NULL, updated_at = datetime('now') WHERE status = 'future' AND publish_date IS NOT NULL AND datetime(publish_date) <= datetime('now')"
    );
    saveDatabase();
    console.log(`定时发布：${due.length} 篇文章已转为已发布（${due.map((p) => p.title).join('、')}）`);
    return due.length;
  } catch (error) {
    console.error('定时发布执行失败:', error);
    return 0;
  }
}

const PUBLISH_CHECK_INTERVAL = 60 * 1000;

function startScheduler() {
  publishDuePosts();
  setInterval(publishDuePosts, PUBLISH_CHECK_INTERVAL).unref();
}

// ------------------------------------------------------------------ 路由装配
//
// 各 domain 模块通过依赖注入拿到 db 助手、鉴权中间件、响应助手与配置，
// 模块之间不互相 require，也就不存在循环依赖。

const deps = {
  config,
  mailer,
  getDb,
  dbHelpers,
  saveDatabase,
  initDatabase,
  execQuery,
  getSingle,
  bindable,
  uuidv4,
  authenticateToken,
  optionalAuth,
  requireRole,
  jwt,
  password,
  ok,
  fail,
  asyncHandler,
  checkCommentRate,
};

app.use(require('./src/modules/health/routes')(deps));
app.use(require('./src/modules/auth/routes')(deps));
app.use(require('./src/modules/posts/routes')(deps));
app.use(require('./src/modules/pages/routes')(deps));
app.use(require('./src/modules/categories/routes')(deps));
app.use(require('./src/modules/tags/routes')(deps));
async function startServer() {
  await initDatabase();

  // 原来每次启动都往 notifications 插一条「系统已启动」并全量写盘：
  // 重启几次就多几条垃圾通知，纯属污染数据，已移除。

  startScheduler();

  app.listen(PORT, () => {
    console.log(`HappyHome API Server running on http://localhost:${PORT}`);
    console.log('Database: happyhome.db');
    console.log('');
    console.log('Available endpoints:');
    console.log('  Auth:');
    console.log('    POST /api/auth/login');
    console.log('    POST /api/auth/register');
    console.log('    GET  /api/auth/me');
    console.log('  Posts:');
    console.log('    GET    /api/posts');
    console.log('    GET    /api/posts/:id');
    console.log('    POST   /api/posts');
    console.log('    PUT    /api/posts/:id');
    console.log('    DELETE /api/posts/:id');
    console.log('  Pages:');
    console.log('    GET    /api/pages');
    console.log('    GET    /api/pages/:id');
    console.log('    POST   /api/pages');
    console.log('    PUT    /api/pages/:id');
    console.log('    DELETE /api/pages/:id');
    console.log('  Categories:');
    console.log('    GET    /api/categories');
    console.log('    POST   /api/categories');
    console.log('    PUT    /api/categories/:id');
    console.log('    DELETE /api/categories/:id');
    console.log('  Tags:');
    console.log('    GET    /api/tags');
    console.log('    POST   /api/tags');
    console.log('    PUT    /api/tags/:id');
    console.log('    DELETE /api/tags/:id');
    console.log('  Public:');
    console.log('    GET    /api/public/posts');
    console.log('    GET    /api/public/posts/:id');
    console.log('    GET    /api/public/pages');
    console.log('    GET    /api/public/pages/:slug');
    console.log('    GET    /api/public/settings');
    console.log('  Analytics:');
    console.log('    GET    /api/analytics/stats');
    console.log('    POST   /api/analytics/track');
    console.log('  SMTP:');
    console.log('    POST   /api/auth/send-verification-code');
    console.log('    POST   /api/auth/verify-code');
    console.log('    POST   /api/auth/reset-password');
    console.log('    POST   /api/smtp/test');
    console.log('    POST   /api/smtp/refresh');
  });
}

startServer().catch(console.error);
