const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// 原来 .env 根本没有被加载（dotenv 未安装也未 require），文件形同虚设，
// 配置实际全部来自代码里的硬编码。这里在读取任何 process.env 之前先加载。
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { initDatabase, getDb, dbHelpers, saveDatabase } = require('./db');
const { sendVerificationCode, testConnection, testConnectionWithConfig, createTransporter } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3002;

// CORS 白名单：原来是 cors() 全开放（Access-Control-Allow-Origin: *），
// 任何站点都能带着用户凭证调这些接口。改为按配置放行。
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

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

const DEFAULT_JWT_SECRET = 'happyhome_jwt_secret_key';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (JWT_SECRET === DEFAULT_JWT_SECRET) {
  console.warn('[警告] JWT_SECRET 仍是默认值，请修改 backend/.env 中的 JWT_SECRET（见 .env.example）');
}

// 验证码存储（内存中，生产环境应使用 Redis）
const verificationCodes = new Map();

function execQuery(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const results = [];
  if (params.length > 0) {
    stmt.bind(params);
  }
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function getSingle(db, sql, params = []) {
  const results = execQuery(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

// sql.js 无法绑定 undefined（会抛 Wrong API use），会把整个请求打成 500。
// 统一规整为 null：配合 SQL 里的 COALESCE(NULL, col) 恰好等于「不修改该列」，
// 这正是部分更新的语义 —— 例如只传 { sticky: true } 时不应影响标题与正文。
function bindable(params = []) {
  return params.map((value) => (value === undefined ? null : value));
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '无效的令牌' });
    }
    req.user = user;
    next();
  });
}

// 只允许指定角色访问。
// 原实现是 `user.role !== role && user.role !== 'administrator'`：当调用方传入的
// role 恰好就是 'administrator' 时，第二个条件恒为假，导致整个表达式恒为假 ——
// 也就是任何已登录用户都能通过 requireRole('administrator')，管理员权限形同虚设。
// 现在改为严格匹配；若将来需要「管理员是任意角色的超集」，
// 必须由调用点显式声明多个角色，而不是靠隐式放行。
function requireRole(role) {
  return (req, res, next) => {
    const db = getDb();
    const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.role !== role) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
  };
}

app.post('/api/auth/send-register-code', async (req, res) => {
  try {
    const { email } = req.body;
    const db = getDb();

    if (!email) {
      return res.status(400).json({ success: false, message: '请提供邮箱地址' });
    }

    const existingUser = getSingle(db, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该邮箱已被注册' });
    }

    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.run(
      'INSERT OR REPLACE INTO register_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, verificationCode, expiresAt]
    );
    saveDatabase();

    const mailer = require('./mailer');
    let mailSent = false;
    
    try {
      const result = await mailer.sendVerificationEmail(email, '用户', verificationCode);
      if (result.success) {
        mailSent = true;
        console.log(`注册验证码已发送到 ${email}`);
      } else {
        console.warn('发送验证邮件失败:', result.message);
      }
    } catch (mailError) {
      console.warn('发送验证邮件失败:', mailError.message);
    }

    db.run(
      'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), null, 'register_request', '新用户注册请求', `用户请求注册，邮箱：${email}，邮件发送：${mailSent ? '成功' : '失败'}`, '/admin/users']
    );
    saveDatabase();

    if (!mailSent) {
      return res.status(500).json({ 
        success: false, 
        message: '邮件发送失败，请稍后重试或联系管理员' 
      });
    }

    res.json({
      success: true,
      message: '验证码已发送到您的邮箱，请在10分钟内完成注册',
      email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDb();

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    }

    const user = getSingle(db, 'SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ success: false, message: '账户未激活' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, code } = req.body;
    const db = getDb();

    if (!username || !email || !password || !code) {
      return res.status(400).json({ success: false, message: '请填写所有字段，包括验证码' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    const existingUser = getSingle(db, 'SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    const registerCode = getSingle(db, 'SELECT * FROM register_codes WHERE email = ?', [email]);
    if (!registerCode) {
      return res.status(400).json({ success: false, message: '请先获取验证码' });
    }

    if (registerCode.code !== code.toUpperCase()) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }

    if (new Date(registerCode.expires_at) < new Date()) {
      db.run('DELETE FROM register_codes WHERE email = ?', [email]);
      saveDatabase();
      return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
    }

    const newUserId = uuidv4();

    db.run(
      'INSERT INTO users (id, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [newUserId, username, email, bcrypt.hashSync(password, 10), 'author', 'active']
    );
    
    db.run('DELETE FROM register_codes WHERE email = ?', [email]);
    saveDatabase();

    const token = jwt.sign(
      { id: newUserId, username, role: 'author' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '注册成功！',
      token,
      user: { id: newUserId, username, email, role: 'author', status: 'active' }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const { userId, code } = req.body;
    const db = getDb();

    if (!userId || !code) {
      return res.status(400).json({ success: false, message: '请提供用户ID和验证码' });
    }

    const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ success: false, message: '用户已验证' });
    }

    if (user.verification_code !== code.toUpperCase()) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }

    if (new Date(user.verification_expires) < new Date()) {
      return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
    }

    db.run('UPDATE users SET status = ?, verification_code = NULL, verification_expires = NULL WHERE id = ?', ['active', userId]);
    saveDatabase();

    const token = jwt.sign(
      { id: userId, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '邮箱验证成功！',
      token,
      user: { id: userId, username: user.username, email: user.email, role: user.role, status: 'active' }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { userId } = req.body;
    const db = getDb();

    if (!userId) {
      return res.status(400).json({ success: false, message: '请提供用户ID' });
    }

    const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ success: false, message: '用户已验证' });
    }

    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.run('UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?', [verificationCode, expiresAt, userId]);
    saveDatabase();

    const mailer = require('./mailer');
    
    try {
      await mailer.sendVerificationEmail(user.email, user.username, verificationCode);
      console.log(`验证邮件已重新发送到 ${user.email}`);
    } catch (mailError) {
      console.warn('发送验证邮件失败:', mailError.message);
    }

    res.json({
      success: true,
      message: '验证邮件已重新发送，请查收邮箱'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/posts', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM posts';
    const params = [];
    const conditions = [];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }

    if (req.query.category) {
      conditions.push('category = ?');
      params.push(req.query.category);
    }

    if (req.query.search) {
      conditions.push('(title LIKE ? OR content LIKE ?)');
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const posts = execQuery(db, sql, params);
    res.json({ success: true, data: posts, count: posts.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/posts/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const post = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/posts', authenticateToken, (req, res) => {
  try {
    const { title, content, excerpt, category, status, sticky } = req.body;
    const db = getDb();

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '请填写标题和内容' });
    }

    const newPostId = uuidv4();
    const postExcerpt = excerpt || content.substring(0, 100).replace(/<[^>]*>/g, '') + '...';

    db.run(
      'INSERT INTO posts (id, title, content, excerpt, category, status, author, sticky) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newPostId, title, content, postExcerpt, category || '未分类', status || 'draft', req.user.username, sticky ? 1 : 0]
    );
    saveDatabase();

    const newPost = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [newPostId]);
    res.status(201).json({ success: true, message: '文章创建成功', data: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/posts/:id', authenticateToken, (req, res) => {
  try {
    const { title, content, excerpt, category, status, sticky } = req.body;
    const db = getDb();
    const post = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);

    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    db.run(
      'UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content), excerpt = COALESCE(?, excerpt), category = COALESCE(?, category), status = COALESCE(?, status), sticky = COALESCE(?, sticky), updated_at = datetime("now") WHERE id = ?',
      bindable([title, content, excerpt, category, status, sticky === undefined ? undefined : (sticky ? 1 : 0), req.params.id])
    );
    saveDatabase();

    const updatedPost = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '文章更新成功', data: updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const post = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    db.run('DELETE FROM posts WHERE id = ?', [req.params.id]);
    db.run('DELETE FROM post_tags WHERE post_id = ?', [req.params.id]);
    db.run('DELETE FROM post_categories WHERE post_id = ?', [req.params.id]);
    db.run('DELETE FROM comments WHERE post_id = ?', [req.params.id]);
    db.run('DELETE FROM revisions WHERE post_id = ?', [req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '文章删除成功', data: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/pages', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    let sql = 'SELECT * FROM pages';
    const params = [];
    const conditions = [];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }

    if (req.query.search) {
      conditions.push('(title LIKE ? OR slug LIKE ?)');
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const pages = execQuery(db, sql, params);
    res.json({ success: true, data: pages, count: pages.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/pages/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const page = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [req.params.id]);
    if (!page) {
      return res.status(404).json({ success: false, message: '页面不存在' });
    }
    res.json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/pages', authenticateToken, (req, res) => {
  try {
    const { title, content, slug, status } = req.body;
    const db = getDb();

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '请填写标题和内容' });
    }

    const newPageId = uuidv4();
    const pageSlug = slug || title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');

    db.run(
      'INSERT INTO pages (id, title, content, slug, status, author) VALUES (?, ?, ?, ?, ?, ?)',
      [newPageId, title, content, pageSlug, status || 'draft', req.user.username]
    );
    saveDatabase();

    const newPage = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [newPageId]);
    res.status(201).json({ success: true, message: '页面创建成功', data: newPage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/pages/:id', authenticateToken, (req, res) => {
  try {
    const { title, content, slug, status } = req.body;
    const db = getDb();
    const page = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [req.params.id]);

    if (!page) {
      return res.status(404).json({ success: false, message: '页面不存在' });
    }

    db.run(
      'UPDATE pages SET title = COALESCE(?, title), content = COALESCE(?, content), slug = COALESCE(?, slug), status = COALESCE(?, status), updated_at = datetime("now") WHERE id = ?',
      bindable([title, content, slug, status, req.params.id])
    );
    saveDatabase();

    const updatedPage = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '页面更新成功', data: updatedPage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/pages/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const page = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [req.params.id]);
    if (!page) {
      return res.status(404).json({ success: false, message: '页面不存在' });
    }

    db.run('DELETE FROM pages WHERE id = ?', [req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '页面删除成功', data: page });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/categories', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const categories = execQuery(db, 'SELECT * FROM categories ORDER BY created_at DESC');
    res.json({ success: true, data: categories, count: categories.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/categories', authenticateToken, (req, res) => {
  try {
    const { name, slug, description, parent } = req.body;
    const db = getDb();

    if (!name) {
      return res.status(400).json({ success: false, message: '请输入分类名称' });
    }

    const newCategoryId = uuidv4();
    const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');

    db.run(
      'INSERT INTO categories (id, name, slug, description, parent) VALUES (?, ?, ?, ?, ?)',
      [newCategoryId, name, categorySlug, description || '', parent || null]
    );
    saveDatabase();

    const newCategory = getSingle(db, 'SELECT * FROM categories WHERE id = ?', [newCategoryId]);
    res.status(201).json({ success: true, message: '分类创建成功', data: newCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/categories/:id', authenticateToken, (req, res) => {
  try {
    const { name, slug, description, parent } = req.body;
    const db = getDb();
    const category = getSingle(db, 'SELECT * FROM categories WHERE id = ?', [req.params.id]);

    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    db.run(
      'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), parent = ? WHERE id = ?',
      bindable([name, slug, description, parent || null, req.params.id])
    );
    saveDatabase();

    const updatedCategory = getSingle(db, 'SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '分类更新成功', data: updatedCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const category = getSingle(db, 'SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    const hasChildren = getSingle(db, 'SELECT id FROM categories WHERE parent = ?', [req.params.id]);
    if (hasChildren) {
      return res.status(400).json({ success: false, message: '请先删除子分类' });
    }

    db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    db.run('DELETE FROM post_categories WHERE category_id = ?', [req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '分类删除成功', data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/tags', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const tags = execQuery(db, 'SELECT * FROM tags ORDER BY created_at DESC');
    res.json({ success: true, data: tags, count: tags.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/tags', authenticateToken, (req, res) => {
  try {
    const { name, slug } = req.body;
    const db = getDb();

    if (!name) {
      return res.status(400).json({ success: false, message: '请输入标签名称' });
    }

    const newTagId = uuidv4();
    const tagSlug = slug || name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');

    db.run('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)', [newTagId, name, tagSlug]);
    saveDatabase();

    const newTag = getSingle(db, 'SELECT * FROM tags WHERE id = ?', [newTagId]);
    res.status(201).json({ success: true, message: '标签创建成功', data: newTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/tags/:id', authenticateToken, (req, res) => {
  try {
    const { name, slug } = req.body;
    const db = getDb();
    const tag = getSingle(db, 'SELECT * FROM tags WHERE id = ?', [req.params.id]);

    if (!tag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }

    db.run('UPDATE tags SET name = COALESCE(?, name), slug = COALESCE(?, slug) WHERE id = ?', bindable([name, slug, req.params.id]));
    saveDatabase();

    const updatedTag = getSingle(db, 'SELECT * FROM tags WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '标签更新成功', data: updatedTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/tags/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    const tag = getSingle(db, 'SELECT * FROM tags WHERE id = ?', [req.params.id]);
    if (!tag) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }

    db.run('DELETE FROM tags WHERE id = ?', [req.params.id]);
    db.run('DELETE FROM post_tags WHERE tag_id = ?', [req.params.id]);
    saveDatabase();

    res.json({ success: true, message: '标签删除成功', data: tag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

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
    res.json({ success: false, message: '添加评论失败' });
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

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API 运行正常', timestamp: new Date().toISOString() });
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
    res.json({ success: true, notifications: [], unreadCount: 0 });
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
    res.json({ success: true, notifications: [] });
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
    res.json({ success: true, count: 0 });
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
    res.json({ success: true, message: '通知表不存在' });
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
    res.json({ success: true, message: '通知表不存在' });
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
    res.json({ success: true, message: '通知表不存在' });
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
    res.json({ success: true, message: '通知表不存在' });
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
    res.json({ success: false, message: '通知表不存在，请重新初始化数据库' });
  }
});

async function startServer() {
  await initDatabase();
  
  // 创建系统启动通知（如果 notifications 表存在）
  try {
    const db = getDb();
    const admins = execQuery(db, "SELECT id FROM users WHERE role = 'administrator'");
    if (admins.length > 0) {
      const id = uuidv4();
      db.run(
        'INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
        [id, admins[0].id, 'success', '系统已启动', `HappyHome 管理面板已成功启动于 ${new Date().toLocaleString('zh-CN')}`]
      );
      saveDatabase();
    }
  } catch (error) {
    console.log('通知表不存在，跳过创建系统通知');
  }
  
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
