const express = require('express');

/**
 * 评论：提交、列表、审核流转、删除。
 *
 * 提交端点原来有两个，形状与校验规则都不一样：
 *   POST /comments         需登录、不校验邮箱格式、不限流、不检查文章是否存在
 *   POST /public/comments  匿名、校验格式与长度、按 IP+邮箱限流、校验文章存在
 * 对外开放 API 之后同一个资源不该有两套路径，合并成一个：
 * 保留公开端点那套更严的校验，身份差异只体现在限流键上。
 */
module.exports = function createCommentsRoutes(deps) {
  const {
    getDb, saveDatabase, execQuery, getSingle, uuidv4,
    checkCommentRate, dbHelpers,
    ok, fail, requireAccess, ROLE_CONTENT, ROLE_ANY,
  } = deps;
  const router = express.Router();

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  router.post('/comments', requireAccess('comments:write', { roles: ROLE_ANY, anonymous: true }), (req, res) => {
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

      // 限流：登录用户按账号计数，匿名按 IP + 邮箱双维度。
      // 公开写接口没有限流等于开放刷库通道，所以限流与端点必须同时存在。
      const rateKeys =
        req.auth.type === 'user'
          ? [`user:${req.user.id}`]
          : [
              `ip:${req.ip || req.connection?.remoteAddress || 'unknown'}`,
              `email:${String(email).toLowerCase()}`,
            ];
      for (const key of rateKeys) {
        if (!checkCommentRate(key).allowed) {
          return fail(res, 429, '提交过于频繁，请稍后再试');
        }
      }

      if (!postId) {
        return fail(res, 400, '缺少文章标识');
      }
      const post = getSingle(db, 'SELECT id FROM posts WHERE id = ?', [postId]);
      if (!post) {
        return fail(res, 404, '文章不存在');
      }

      // 默认先审核，绝不直接公开；「评论」页关掉「需要审核」后才直接放行。
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
            ? `${author} 发表了新评论`
            : `${author} 发表了新评论，待审核`,
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
      fail(res, 500, '添加评论失败');
    }
  });

  // 某篇文章的已审核评论（含回复，便于一次性渲染嵌套结构）。
  // 刻意只选子集列：email 不该出现在任何公开响应里。
  router.get('/posts/:id/comments', (req, res) => {
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

  // 前台侧栏「最新评论」用。只取已发布文章下的已审核评论，
  // 避免把草稿文章的标题泄露出去。
  router.get('/comments/recent', (req, res) => {
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