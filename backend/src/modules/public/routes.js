const express = require('express');

// 前台（无需登录）公开只读端点 + 访客评论提交。
//
// 原来前台提交评论走的是 POST /api/comments，而那个端点挂了 authenticateToken：
// 访客没有 token，永远拿到 401，评论功能实际上从未对公众开放。
// 这里为前台单独开一组端点，并做好滥用防护（公开写接口没有限流等于开放刷库通道，
// 所以限流与端点必须同时存在，见 src/middleware/rateLimit.js）。
const { pickSettings } = require('../../lib/settingKeys');

module.exports = function createPublicRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, uuidv4, checkCommentRate, dbHelpers, ok, fail, requireAccess } = deps;
  const router = express.Router();

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  router.get('/public/posts', (req, res) => {
    try {
      const db = getDb();
      const settings = dbHelpers.getSettings();

      let where = 'WHERE status = ?';
      const params = ['published'];

      if (req.query.search) {
        where += ' AND (title LIKE ? OR content LIKE ?)';
        params.push(`%${req.query.search}%`, `%${req.query.search}%`);
      }

      if (req.query.category) {
        where += ' AND category = ?';
        params.push(req.query.category);
      }

      // 每页条数来自「内容」页的 postsPerPage。原来这里没有分页，
      // 文章一多前台就会把整张表一次性拉下来。
      const page = Math.max(Number(req.query.page) || 1, 1);
      const perPage = Math.min(
        Math.max(Number(req.query.perPage) || Number(settings.postsPerPage) || 10, 1),
        100
      );

      const totalRow = getSingle(db, `SELECT COUNT(*) AS total FROM posts ${where}`, params);
      const total = totalRow?.total || 0;

      const posts = execQuery(
        db,
        `SELECT * FROM posts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, perPage, (page - 1) * perPage]
      );

      ok(res, {
        data: posts,
        count: posts.length,
        total,
        page,
        perPage,
        totalPages: Math.max(Math.ceil(total / perPage), 1),
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/public/posts/:id', (req, res) => {
    try {
      const db = getDb();
      const post = getSingle(db, 'SELECT * FROM posts WHERE id = ? AND status = ?', [req.params.id, 'published']);
      if (!post) {
        return fail(res, 404, '文章不存在');
      }
      ok(res, { data: post });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  // 前台列表的分类下拉用。只返回已发布文章实际用到的分类，
  // 不暴露后台分类表（那张表可能含未启用的分类）。
  router.get('/public/categories', (req, res) => {
    try {
      const db = getDb();
      const rows = execQuery(
        db,
        "SELECT DISTINCT category FROM posts WHERE status = 'published' AND category IS NOT NULL AND category != '' ORDER BY category"
      );
      ok(res, { data: rows.map((row) => row.category) });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/public/pages', (req, res) => {
    try {
      const db = getDb();
      const pages = execQuery(db, 'SELECT * FROM pages WHERE status = ? ORDER BY created_at DESC', ['published']);
      ok(res, { data: pages, count: pages.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/public/pages/:slug', (req, res) => {
    try {
      const db = getDb();
      const page = getSingle(db, 'SELECT * FROM pages WHERE slug = ? AND status = ?', [req.params.slug, 'published']);
      if (!page) {
        return fail(res, 404, '页面不存在');
      }
      ok(res, { data: page });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  // 访客能看到的设置白名单。
  //
  // 原来是手写的四个键，结果前台拿不到主题 —— SiteSettingsContext 对访客走这个
  // 端点，`settings.theme` 是 undefined，于是访客永远看到默认配色，
  // 管理员精心选的主题只有登录后自己能看到。自定义代码与统计 ID 同理，
  // 它们本来就是给前台用的，却从来没下发过。
  //
  // 这里只列前台确实需要的键，SMTP 凭据之类的敏感项绝不包含在内。
  const PUBLIC_SETTING_KEYS = [
    'siteName', 'siteDescription', 'siteUrl', 'timezone',
    'theme', 'seo', 'socialShare',
    'customCSS', 'customJS', 'headCode', 'footerCode',
    'enableComments', 'postsPerPage', 'excerptLength',
  ];

  router.get('/public/settings', (req, res) => {
    try {
      // 白名单已收敛到 lib/settingKeys.js，与 /settings 端点共用同一份定义，
      // 避免两处各写一遍、改了一处忘了另一处。
      ok(res, { data: pickSettings(dbHelpers.getSettings(), { isPublic: true }) });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/public/comments', requireAccess('comments:write', { anonymous: true }), (req, res) => {
    try {
      const db = getDb();
      const { postId, parentId, author, email, content } = req.body || {};
      const settings = dbHelpers.getSettings();

      // 「评论」页的启用开关。原来这个键没有任何读者，关掉它前台照样能提交。
      if (settings.enableComments === false) {
        return fail(res, 403, '本站已关闭评论');
      }

      if (!author || !email || !content) {
        return fail(res, 400, '请填写昵称、邮箱和评论内容');
      }
      if (!EMAIL_PATTERN.test(String(email))) {
        return fail(res, 400, '邮箱格式不正确');
      }
      // 长度上限：不加限制的话单条评论可以塞进任意大的内容
      if (String(author).length > 50) {
        return fail(res, 400, '昵称不能超过 50 个字符');
      }
      if (String(content).length > 5000) {
        return fail(res, 400, '评论内容不能超过 5000 个字符');
      }

      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const ipCheck = checkCommentRate(`ip:${ip}`);
      if (!ipCheck.allowed) {
        return fail(res, 429, '提交过于频繁，请稍后再试');
      }
      const emailCheck = checkCommentRate(`email:${String(email).toLowerCase()}`);
      if (!emailCheck.allowed) {
        return fail(res, 429, '提交过于频繁，请稍后再试');
      }

      if (!postId) {
        return fail(res, 400, '缺少文章标识');
      }
      const post = getSingle(db, 'SELECT id FROM posts WHERE id = ?', [postId]);
      if (!post) {
        return fail(res, 404, '文章不存在');
      }

      // 访客评论默认先审核，绝不直接公开；「评论」页关掉「需要审核」后才直接放行。
      const status = settings.commentsModeration === false ? 'approved' : 'pending';
      const id = uuidv4();
      db.run(
        'INSERT INTO comments (id, post_id, parent_id, author, email, content, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, postId, parentId || null, String(author).trim(), String(email).trim(), String(content).trim(), status]
      );
      db.run(
        'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          null,
          'comment',
          '新评论',
          status === 'approved'
            ? `访客 ${author} 发表了新评论`
            : `访客 ${author} 发表了新评论，待审核`,
          '/admin/comments',
        ]
      );
      saveDatabase();

      const created = getSingle(db, 'SELECT * FROM comments WHERE id = ?', [id]);
      ok(
        res,
        {
          data: created,
          message: status === 'approved' ? '评论已提交' : '评论已提交，审核通过后显示',
        },
        201
      );
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  // 前台读取某篇文章的已审核评论（含回复，便于一次性渲染嵌套结构）
  router.get('/public/posts/:id/comments', (req, res) => {
    try {
      const db = getDb();
      const comments = execQuery(
        db,
        'SELECT id, post_id, parent_id, author, content, created_at FROM comments WHERE post_id = ? AND status = ? ORDER BY created_at ASC',
        [req.params.id, 'approved']
      );
      ok(res, { data: comments, count: comments.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  // 前台侧栏「最新评论」用。原来那个部件靠 DataContext 里一份只有管理员才会加载的
  // 全量评论列表（含待审核），访客看到的一直是空的。这里提供公开的已审核评论流，
  // 并只取已发布文章下的评论，避免把草稿文章的标题泄露出去。
  router.get('/public/comments/recent', (req, res) => {
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
      ok(res, { data: comments, count: comments.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};