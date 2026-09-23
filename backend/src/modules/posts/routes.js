const express = require('express');
const { wallTimeToUtc } = require('../../lib/datetime');
const { snapshotRevision, hasContentChange } = require('../../lib/revisionSnapshot');

// 文章（posts）CRUD。注意 PUT 的 COALESCE 部分更新语义与 publish_date 的单独特判，
// 这些都是冒烟测试守住的回归点，搬迁时保持逻辑逐字不变。
module.exports = function createPostsRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, bindable, uuidv4, dbHelpers, ok, fail, requireAccess, ROLE_CONTENT } = deps;
  const router = express.Router();

  /** 每页条数上限。 */
  const MAX_PER_PAGE = 100;
  /** 全量模式的条数上限：再大就不该用这个模式，而该翻页。 */
  const ALL_POSTS_LIMIT = 1000;

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

  router.get('/posts', requireAccess('posts:read', { roles: ROLE_CONTENT, anonymous: true }), (req, res) => {
    try {
      const db = getDb();
      const params = [];
      const conditions = [];

      // 匿名访客（以及角色不够的登录用户）只能看到已发布内容。
      // 这里刻意**忽略** status 参数而不是去校验它 —— 允许传就等于给了一条
      // 「?status=draft 直接读草稿」的绕过路径。
      if (req.auth.level === 'public') {
        conditions.push("status = 'published'");
      } else if (req.query.status) {
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

      const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

      // ---------------------------------------------------------- 全量模式
      //
      // 后台列表页用 ?all=1：不带分页字段，形状与改造前的 /api/posts 完全一致。
      // 为什么用显式参数而不是「没传 page 就不分页」—— 同一个 URL 出现两种响应
      // 形状对外部客户端是契约毒药，而且 page=1 这种无意义参数会改变语义。
      if (req.query.all === '1') {
        if (req.auth.level === 'public') {
          return fail(res, 403, '匿名调用不能使用全量模式');
        }
        const posts = execQuery(
          db,
          `SELECT * FROM posts${where} ORDER BY created_at DESC LIMIT ?`,
          [...params, ALL_POSTS_LIMIT]
        );
        return ok(res, { data: posts, count: posts.length });
      }

      // ---------------------------------------------------------- 分页模式
      const settings = dbHelpers.getSettings();
      const page = Math.max(Number(req.query.page) || 1, 1);
      const perPage = Math.min(
        Math.max(Number(req.query.perPage) || Number(settings.postsPerPage) || 10, 1),
        MAX_PER_PAGE
      );

      const totalRow = getSingle(db, `SELECT COUNT(*) AS total FROM posts${where}`, params);
      const total = totalRow?.total || 0;

      const posts = execQuery(
        db,
        `SELECT * FROM posts${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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

  router.get('/posts/:id', requireAccess('posts:read', { roles: ROLE_CONTENT, anonymous: true }), (req, res) => {
    try {
      const db = getDb();
      // 公开层级只能读已发布的：草稿直接当作「不存在」，而不是 403 ——
      // 403 会暴露「这个 id 确实有一篇草稿」这一事实。
      const post =
        req.auth.level === 'public'
          ? getSingle(db, "SELECT * FROM posts WHERE id = ? AND status = 'published'", [req.params.id])
          : getSingle(db, 'SELECT * FROM posts WHERE id = ?', [req.params.id]);
      if (!post) {
        return fail(res, 404, '文章不存在');
      }
      ok(res, { data: post });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/posts', requireAccess('posts:write', { roles: ROLE_CONTENT }), (req, res) => {
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

  router.put('/posts/:id', requireAccess('posts:write', { roles: ROLE_CONTENT }), (req, res) => {
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

  router.delete('/posts/:id', requireAccess('posts:write', { roles: ROLE_CONTENT }), (req, res) => {
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