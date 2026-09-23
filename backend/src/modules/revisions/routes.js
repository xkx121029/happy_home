const express = require('express');
const { snapshotRevision } = require('../../lib/revisionSnapshot');

/**
 * 文章修订：列表、详情、回滚、删除。
 *
 * 写入不在这里 —— 快照是在 posts 模块保存文章前留的（记「改之前的样子」）。
 * 这个模块只负责读取与操作，以及回滚前的自我保护性留档。
 *
 * 在此之前 revisions 表建了却没有任何代码写入过，前端 Revisions 页里是
 * `const postRevisions = []` 加一句 `alert('修订功能暂未实现')`。
 */
module.exports = function createRevisionsRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, uuidv4, dbHelpers, authenticateToken, ok, fail } = deps;
  const router = express.Router();

  // 列表刻意不带 content：一篇文章可能存了几十个版本，
  // 每个版本带上完整正文会让这个响应膨胀到几百 KB，而列表根本用不到。
  router.get('/api/posts/:id/revisions', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const post = getSingle(db, 'SELECT id FROM posts WHERE id = ?', [req.params.id]);
      if (!post) {
        return fail(res, 404, '文章不存在');
      }

      const revisions = execQuery(
        db,
        `SELECT id, post_id, title, excerpt, author, created_at,
                length(content) AS content_length
         FROM revisions WHERE post_id = ?
         ORDER BY created_at DESC`,
        [req.params.id]
      );

      ok(res, { data: revisions, count: revisions.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/api/revisions/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const revision = getSingle(db, 'SELECT * FROM revisions WHERE id = ?', [req.params.id]);
      if (!revision) {
        return fail(res, 404, '修订版本不存在');
      }

      // 一并带上当前版本，前端对比视图就不必再发一次请求
      const current = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [revision.post_id]);

      ok(res, { data: revision, current: current || null });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api/revisions/:id/restore', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const revision = getSingle(db, 'SELECT * FROM revisions WHERE id = ?', [req.params.id]);
      if (!revision) {
        return fail(res, 404, '修订版本不存在');
      }

      const post = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [revision.post_id]);
      if (!post) {
        return fail(res, 404, '原文章已不存在，无法回滚');
      }

      // 回滚前先把当前版本留档，否则「回滚」这个动作本身不可撤销 ——
      // 点错一次就再也回不到刚才的样子了。
      snapshotRevision({
        db,
        post,
        settings: dbHelpers.getSettings(),
        id: uuidv4(),
      });

      db.run(
        'UPDATE posts SET title = ?, content = ?, excerpt = ?, updated_at = datetime("now") WHERE id = ?',
        [revision.title, revision.content, revision.excerpt, post.id]
      );
      saveDatabase();

      const restored = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [post.id]);
      ok(res, { message: '已回滚到该版本', data: restored });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/api/revisions/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const revision = getSingle(db, 'SELECT * FROM revisions WHERE id = ?', [req.params.id]);
      if (!revision) {
        return fail(res, 404, '修订版本不存在');
      }

      db.run('DELETE FROM revisions WHERE id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '修订版本已删除', data: revision });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};
