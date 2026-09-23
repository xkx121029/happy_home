const express = require('express');

// 后台评论管理（含审核状态流转与删除）。访客提交评论在 public 模块里。
module.exports = function createCommentsRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, uuidv4, ok, fail, requireAccess, ROLE_CONTENT, ROLE_ANY } = deps;
  const router = express.Router();

  router.post('/comments', requireAccess('comments:write', { roles: ROLE_ANY }), (req, res) => {
    try {
      const db = getDb();
      const { postId, parentId, author, email, content } = req.body;

      if (!author || !email || !content) {
        return fail(res, 400, '请填写所有必填字段');
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

      ok(res, { data: newComment, message: '评论已添加' });
    } catch (error) {
      console.error(error);
      // 原来这里返回的是 HTTP 200 + success:false，前端会当成成功处理
      fail(res, 500, '添加评论失败');
    }
  });

  router.get('/comments', requireAccess('comments:read', { roles: ROLE_ANY }), (req, res) => {
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
      ok(res, { data: comments, count: comments.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/comments/:id/status', requireAccess('comments:moderate', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const { status } = req.body;
      const db = getDb();
      const comment = getSingle(db, 'SELECT * FROM comments WHERE id = ?', [req.params.id]);

      if (!comment) {
        return fail(res, 404, '评论不存在');
      }

      db.run('UPDATE comments SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, req.params.id]);
      saveDatabase();

      const updatedComment = getSingle(db, 'SELECT * FROM comments WHERE id = ?', [req.params.id]);
      ok(res, { message: '评论状态更新成功', data: updatedComment });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/comments/:id', requireAccess('comments:moderate', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const db = getDb();
      const comment = getSingle(db, 'SELECT * FROM comments WHERE id = ?', [req.params.id]);
      if (!comment) {
        return fail(res, 404, '评论不存在');
      }

      db.run('DELETE FROM comments WHERE id = ? OR parent_id = ?', [req.params.id, req.params.id]);
      saveDatabase();

      ok(res, { message: '评论删除成功', data: comment });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};