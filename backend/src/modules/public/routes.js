const express = require('express');

// 前台（无需登录）公开只读端点 + 访客评论提交。
//
// 原来前台提交评论走的是 POST /api/comments，而那个端点挂了 authenticateToken：
// 访客没有 token，永远拿到 401，评论功能实际上从未对公众开放。
// 这里为前台单独开一组端点，并做好滥用防护（公开写接口没有限流等于开放刷库通道，
// 所以限流与端点必须同时存在，见 src/middleware/rateLimit.js）。
module.exports = function createPublicRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, uuidv4, optionalAuth, checkCommentRate, dbHelpers, ok, fail } = deps;
  const router = express.Router();

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  router.get('/api/public/posts', (req, res) => {
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
      ok(res, { data: posts, count: posts.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/api/public/posts/:id', (req, res) => {
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

  router.get('/api/public/pages', (req, res) => {
    try {
      const db = getDb();
      const pages = execQuery(db, 'SELECT * FROM pages WHERE status = ? ORDER BY created_at DESC', ['published']);
      ok(res, { data: pages, count: pages.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/api/public/pages/:slug', (req, res) => {
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

  router.get('/api/public/settings', (req, res) => {
    try {
      const allSettings = dbHelpers.getSettings();
      const publicSettings = {
        siteName: allSettings.siteName,
        siteDescription: allSettings.siteDescription,
        siteUrl: allSettings.siteUrl,
        enableDarkMode: allSettings.enableDarkMode
      };
      ok(res, { data: publicSettings });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api/public/comments', optionalAuth, (req, res) => {
    try {
      const db = getDb();
      const { postId, parentId, author, email, content } = req.body || {};

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
      ok(res, { data: created, message: '评论已提交，审核通过后显示' }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  // 前台读取某篇文章的已审核评论（含回复，便于一次性渲染嵌套结构）
  router.get('/api/public/posts/:id/comments', (req, res) => {
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
  router.get('/api/public/comments/recent', (req, res) => {
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