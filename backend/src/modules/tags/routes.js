const express = require('express');

// 标签（tags）CRUD
module.exports = function createTagsRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, bindable, uuidv4, authenticateToken, ok, fail } = deps;
  const router = express.Router();

  router.get('/api/tags', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const tags = execQuery(db, 'SELECT * FROM tags ORDER BY created_at DESC');
      ok(res, { data: tags, count: tags.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api/tags', authenticateToken, (req, res) => {
    try {
      const { name, slug } = req.body;
      const db = getDb();

      if (!name) {
        return fail(res, 400, '请输入标签名称');
      }

      const newTagId = uuidv4();
      const tagSlug = slug || name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');

      db.run('INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)', [newTagId, name, tagSlug]);
      saveDatabase();

      const newTag = getSingle(db, 'SELECT * FROM tags WHERE id = ?', [newTagId]);
      ok(res, { message: '标签创建成功', data: newTag }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/api/tags/:id', authenticateToken, (req, res) => {
    try {
      const { name, slug } = req.body;
      const db = getDb();
      const tag = getSingle(db, 'SELECT * FROM tags WHERE id = ?', [req.params.id]);

      if (!tag) {
        return fail(res, 404, '标签不存在');
      }

      db.run('UPDATE tags SET name = COALESCE(?, name), slug = COALESCE(?, slug) WHERE id = ?', bindable([name, slug, req.params.id]));
      saveDatabase();

      const updatedTag = getSingle(db, 'SELECT * FROM tags WHERE id = ?', [req.params.id]);
      ok(res, { message: '标签更新成功', data: updatedTag });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/api/tags/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const tag = getSingle(db, 'SELECT * FROM tags WHERE id = ?', [req.params.id]);
      if (!tag) {
        return fail(res, 404, '标签不存在');
      }

      db.run('DELETE FROM tags WHERE id = ?', [req.params.id]);
      db.run('DELETE FROM post_tags WHERE tag_id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '标签删除成功', data: tag });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};