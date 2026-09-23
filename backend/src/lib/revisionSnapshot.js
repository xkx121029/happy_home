/**
 * 修订快照的写入与裁剪。
 *
 * 两个地方都要留档：文章保存前（保留改之前的样子）、以及回滚前（让回滚本身也可撤销）。
 * 各写一遍必然有一处忘记裁剪上限，所以收在这里。
 *
 * 这个模块不持有任何状态，db 与 id 生成器都由调用方传入，
 * 因此 posts 模块和 revisions 模块可以共用同一份实现。
 */

/**
 * 留一份快照，并把该文章的旧快照裁到 revisionLimit 条以内。
 *
 * @returns {boolean} 是否真的写入了一条
 */
function snapshotRevision({ db, post, settings, id, now = new Date() }) {
  // 「内容」页关掉「记录文章修订」后不再留档
  if (settings?.enableRevisions === false) return false;
  if (!post || !post.id) return false;

  db.run(
    'INSERT INTO revisions (id, post_id, title, content, excerpt, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      post.id,
      post.title || '',
      post.content || '',
      post.excerpt || '',
      post.author || '',
      // 存 UTC ISO 而不是 SQLite 的 datetime('now')：
      // 前者 new Date() 能直接解析，后者在部分浏览器里会被当本地时间。
      now.toISOString(),
    ]
  );

  const limit = Math.max(Number(settings?.revisionLimit) || 25, 1);
  db.run(
    `DELETE FROM revisions
     WHERE post_id = ?
       AND id NOT IN (
         SELECT id FROM revisions WHERE post_id = ? ORDER BY created_at DESC LIMIT ?
       )`,
    [post.id, post.id, limit]
  );

  return true;
}

/** 判断一次 PUT 是否真的改动了「值得留档」的字段。 */
function hasContentChange(before, incoming) {
  const fields = ['title', 'content', 'excerpt'];
  return fields.some((field) => {
    const next = incoming[field];
    if (next === undefined) return false;
    return String(next) !== String(before[field] ?? '');
  });
}

module.exports = { snapshotRevision, hasContentChange };
