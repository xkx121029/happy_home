const express = require('express');

// 媒体库（media）：列表、登记、删除
module.exports = function createMediaRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, uuidv4, authenticateToken, ok, fail } = deps;
  const router = express.Router();

  router.get('/api/media', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const media = execQuery(db, 'SELECT * FROM media ORDER BY uploaded_at DESC');
      ok(res, { data: media, count: media.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api/media', authenticateToken, (req, res) => {
    try {
      const { name, url, size, type } = req.body;
      const db = getDb();

      if (!name || !url) {
        return fail(res, 400, '请提供文件名和URL');
      }

      const newMediaId = uuidv4();
      db.run(
        'INSERT INTO media (id, name, url, size, type) VALUES (?, ?, ?, ?, ?)',
        [newMediaId, name, url, size || '未知', type || 'image/jpeg']
      );
      saveDatabase();

      const newMedia = getSingle(db, 'SELECT * FROM media WHERE id = ?', [newMediaId]);
      ok(res, { message: '媒体文件上传成功', data: newMedia }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/api/media/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const media = getSingle(db, 'SELECT * FROM media WHERE id = ?', [req.params.id]);
      if (!media) {
        return fail(res, 404, '媒体文件不存在');
      }

      db.run('DELETE FROM media WHERE id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '媒体文件删除成功', data: media });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};