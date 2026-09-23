const express = require('express');
const { cdata, escapeXml, stripHtml, toRfc822, toW3CDate } = require('../../lib/xml');

/**
 * 订阅与索引：`/feed.xml`（RSS 2.0）与 `/sitemap.xml`。
 *
 * 刻意挂在根路径而不是 `/api` 下 —— 这两个是给爬虫和订阅器用的公开约定地址，
 * `/api/feed.xml` 既没人会去猜，也不符合惯例。
 *
 * 数据源与 `/api/public/posts` 保持一致：只输出 `status = 'published'` 的文章。
 * 定时文章由调度器到点后转正，所以这里不需要再判断 publish_date。
 */
module.exports = function createFeedRoutes(deps) {
  const { getDb, execQuery, dbHelpers, fail } = deps;
  const router = express.Router();

  const MAX_FEED_ITEMS = 20;

  /** 站点根地址。没配 siteUrl 时用请求自身的 host 兜底，避免产出相对链接。 */
  function siteBaseUrl(req) {
    const configured = String(dbHelpers.getSettings().siteUrl || '').trim();
    if (configured) return configured.replace(/\/+$/, '');
    return `${req.protocol}://${req.get('host')}`;
  }

  router.get('/feed.xml', (req, res) => {
    try {
      const db = getDb();
      const settings = dbHelpers.getSettings();
      const base = siteBaseUrl(req);

      const posts = execQuery(
        db,
        `SELECT id, title, excerpt, content, author, created_at
         FROM posts WHERE status = 'published'
         ORDER BY created_at DESC LIMIT ?`,
        [MAX_FEED_ITEMS]
      );

      const items = posts.map((post) => {
        const link = `${base}/posts/${post.id}`;
        const description = post.excerpt || stripHtml(post.content).slice(0, 300);

        return [
          '    <item>',
          `      <title>${escapeXml(post.title)}</title>`,
          `      <link>${escapeXml(link)}</link>`,
          `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
          `      <pubDate>${toRfc822(post.created_at)}</pubDate>`,
          `      <author>${escapeXml(post.author)}</author>`,
          `      <description>${cdata(description)}</description>`,
          '    </item>',
        ].join('\n');
      });

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        '  <channel>',
        `    <title>${escapeXml(settings.siteName || 'HappyHome')}</title>`,
        `    <link>${escapeXml(base)}</link>`,
        `    <description>${escapeXml(settings.siteDescription || '')}</description>`,
        '    <language>zh-cn</language>',
        `    <lastBuildDate>${toRfc822(new Date())}</lastBuildDate>`,
        `    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
        ...items,
        '  </channel>',
        '</rss>',
      ].join('\n');

      res.type('application/rss+xml; charset=utf-8').send(xml);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/sitemap.xml', (req, res) => {
    try {
      const db = getDb();
      const base = siteBaseUrl(req);

      const posts = execQuery(
        db,
        "SELECT id, updated_at FROM posts WHERE status = 'published' ORDER BY created_at DESC"
      );
      const pages = execQuery(
        db,
        "SELECT slug, updated_at FROM pages WHERE status = 'published' AND slug IS NOT NULL AND slug != ''"
      );

      const entries = [
        { loc: `${base}/`, lastmod: '' },
        { loc: `${base}/posts`, lastmod: '' },
        ...posts.map((post) => ({ loc: `${base}/posts/${post.id}`, lastmod: post.updated_at })),
        ...pages.map((page) => ({ loc: `${base}/page/${page.slug}`, lastmod: page.updated_at })),
      ];

      const urls = entries.map((entry) => {
        const lastmod = toW3CDate(entry.lastmod);
        return [
          '  <url>',
          `    <loc>${escapeXml(entry.loc)}</loc>`,
          lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
          '  </url>',
        ]
          .filter(Boolean)
          .join('\n');
      });

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls,
        '</urlset>',
      ].join('\n');

      res.type('application/xml; charset=utf-8').send(xml);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};
