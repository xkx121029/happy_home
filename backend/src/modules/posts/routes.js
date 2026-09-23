const express = require('express');
const { wallTimeToUtc } = require('../../lib/datetime');
const { snapshotRevision, hasContentChange } = require('../../lib/revisionSnapshot');

// 文章（posts）CRUD。注意 PUT 的 COALESCE 部分更新语义与 publish_date 的单独特判，
// 这些都是冒烟测试守住的回归点，搬迁时保持逻辑逐字不变。
module.exports = function createPostsRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, bindable, uuidv4, dbHelpers, authenticateToken, ok, fail } = deps;
  const router = express.Router();

  /**
   * 把 publishDate 规整成 UTC ISO。
   *
   * 前端 `datetime-local` 提交的是没有时区的墙上时间，SQLite 会把它当 UTC 解析，
   * 于是定时发布在 Asia/Shanghai 下提前 8 小时触发。这里在写入时就换算成 UTC，
   * 此后「是否到点」的比较全是同一基准，不需要在读的时候再做时区运算。
   */
  function normalizePublishDate(value) {
    if (!value) return value;
    const timeZone = dbHelpers.getSettings().timezone || 'Asia/Shanghai';
    const converted = wallTimeToUtc(value, timeZone);
    // 解析不了就原样存下去（保持旧行为），总比丢数据好
    return converted || value;
  }

  router.get('/api/posts', authenticateToken, (req, res) => {
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
      ok(res, { data: posts, count: posts.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/api/posts/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const post = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);
      if (!post) {
        return fail(res, 404, '文章不存在');
      }
      ok(res, { data: post });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api/posts', authenticateToken, (req, res) => {
    try {
      const { title, content, excerpt, category, status, sticky, publishDate } = req.body;
      const db = getDb();

      if (!title || !content) {
        return fail(res, 400, '请填写标题和内容');
      }

      const newPostId = uuidv4();
      const postExcerpt = excerpt || content.substring(0, 100).replace(/<[^>]*>/g, '') + '...';

      db.run(
        'INSERT INTO posts (id, title, content, excerpt, category, status, author, sticky, publish_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newPostId, title, content, postExcerpt, category || '未分类', status || 'draft', req.user.username, sticky ? 1 : 0, normalizePublishDate(publishDate) || null]
      );
      saveDatabase();

      const newPost = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [newPostId]);
      ok(res, { message: '文章创建成功', data: newPost }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/api/posts/:id', authenticateToken, (req, res) => {
    try {
      const { title, content, excerpt, category, status, sticky, publishDate } = req.body;
      const db = getDb();
      const post = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);

      if (!post) {
        return fail(res, 404, '文章不存在');
      }

      // 留档要在覆盖之前：记的是「改之前长什么样」。
      // 只在正文真的变了时才记 —— 每次保存都存的话，改一个错别字和改一整段
      // 会产生同样多的记录，历史很快就没用了。
      if (hasContentChange(post, { title, content, excerpt })) {
        snapshotRevision({
          db,
          post,
          settings: dbHelpers.getSettings(),
          id: uuidv4(),
        });
      }

      db.run(
        'UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content), excerpt = COALESCE(?, excerpt), category = COALESCE(?, category), status = COALESCE(?, status), sticky = COALESCE(?, sticky), publish_date = COALESCE(?, publish_date), updated_at = datetime("now") WHERE id = ?',
        bindable([title, content, excerpt, category, status, sticky === undefined ? undefined : (sticky ? 1 : 0), normalizePublishDate(publishDate) || undefined, req.params.id])
      );
      // COALESCE 的语义是「没传就保持原值」，因此无法把列改回 NULL。
      // 「取消定时发布」需要真的清空 publish_date，这里单独处理。
      if ('publishDate' in req.body && !publishDate) {
        db.run('UPDATE posts SET publish_date = NULL WHERE id = ?', [req.params.id]);
      }
      saveDatabase();

      const updatedPost = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);
      ok(res, { message: '文章更新成功', data: updatedPost });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/api/posts/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const post = getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);
      if (!post) {
        return fail(res, 404, '文章不存在');
      }

      db.run('DELETE FROM posts WHERE id = ?', [req.params.id]);
      db.run('DELETE FROM post_tags WHERE post_id = ?', [req.params.id]);
      db.run('DELETE FROM post_categories WHERE post_id = ?', [req.params.id]);
      db.run('DELETE FROM comments WHERE post_id = ?', [req.params.id]);
      db.run('DELETE FROM revisions WHERE post_id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '文章删除成功', data: post });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};