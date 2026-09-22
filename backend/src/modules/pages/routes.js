const express = require('express');

// 单页（pages）CRUD
module.exports = function createPagesRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, bindable, uuidv4, authenticateToken, ok, fail } = deps;
  const router = express.Router();

  router.get('/api/pages', authenticateToken, (req, res) => {
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
      ok(res, { data: pages, count: pages.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/api/pages/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const page = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [req.params.id]);
      if (!page) {
        return fail(res, 404, '页面不存在');
      }
      ok(res, { data: page });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api/pages', authenticateToken, (req, res) => {
    try {
      const { title, content, slug, status } = req.body;
      const db = getDb();

      if (!title || !content) {
        return fail(res, 400, '请填写标题和内容');
      }

      const newPageId = uuidv4();
      const pageSlug = slug || title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');

      db.run(
        'INSERT INTO pages (id, title, content, slug, status, author) VALUES (?, ?, ?, ?, ?, ?)',
        [newPageId, title, content, pageSlug, status || 'draft', req.user.username]
      );
      saveDatabase();

      const newPage = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [newPageId]);
      ok(res, { message: '页面创建成功', data: newPage }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/api/pages/:id', authenticateToken, (req, res) => {
    try {
      const { title, content, slug, status } = req.body;
      const db = getDb();
      const page = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [req.params.id]);

      if (!page) {
        return fail(res, 404, '页面不存在');
      }

      db.run(
        'UPDATE pages SET title = COALESCE(?, title), content = COALESCE(?, content), slug = COALESCE(?, slug), status = COALESCE(?, status), updated_at = datetime("now") WHERE id = ?',
        bindable([title, content, slug, status, req.params.id])
      );
      saveDatabase();

      const updatedPage = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [req.params.id]);
      ok(res, { message: '页面更新成功', data: updatedPage });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/api/pages/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const page = getSingle(db, 'SELECT * FROM pages WHERE id = ?', [req.params.id]);
      if (!page) {
        return fail(res, 404, '页面不存在');
      }

      db.run('DELETE FROM pages WHERE id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '页面删除成功', data: page });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};