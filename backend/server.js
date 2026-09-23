const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// 集中读取环境变量（config 内部会先加载 backend/.env），必须在读取任何
// process.env 之前引入；jwt / response / 鉴权等公共能力也在这里接好。
const config = require('./src/config');
const { PORT, CORS_ORIGINS } = config;
const jwt = require('./src/lib/jwt');
const password = require('./src/lib/password');
const { ok, fail } = require('./src/lib/response');
const asyncHandler = require('./src/middleware/asyncHandler');
const createAuthenticate = require('./src/middleware/authenticate');
const {
  ROLE_ADMIN_ONLY,
  ROLE_CONTENT,
  ROLE_ANY,
} = require('./src/lib/permissions');
const {
  checkCommentRate,
  checkLoginRate,
  recordLoginFailure,
  clearLoginFailures,
} = require('./src/middleware/rateLimit');
const { notFound, errorHandler } = require('./src/middleware/errors');

const { initDatabase, getDb, dbHelpers, saveDatabase } = require('./db');
const mailer = require('./mailer');

const app = express();

// CORS 白名单来自 src/config（原来是 cors() 全开放，任何站点都能带凭证调这些接口）
app.use(cors({
  origin(origin, callback) {
    // 同源请求、curl、服务端调用没有 origin，放行
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.length === 0) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// 参数化查询助手统一由 src/db/repo.js 提供（execQuery / getSingle / bindable）
const { execQuery, getSingle, bindable } = require('./src/db/repo');

// 身份识别（匿名 / 登录用户 / API Key）与访问控制。db 助手通过参数注入，
// 本模块不反向依赖 db 层，避免循环引用。
const { authenticate, requireAccess } = createAuthenticate({
  getDb,
  getSingle,
  execQuery,
  saveDatabase,
  password,
});

// ------------------------------------------------------------ 定时发布调度
//
// 这段逻辑原来在前端（App.jsx 里的 setInterval）：依赖数组为空，闭包永远捕获
// 首次渲染时的 posts 列表，加上 posts 表当时根本没有 publish_date 列，
// 所以「定时发布」从头到尾没有生效过一次。移到后端用一条 SQL 完成，
// 既不依赖有没有人打开管理页面，也不需要在前端保存一份会过期的副本。
//
// 时区：publish_date 一律存 UTC ISO（写入时由 src/lib/datetime.js 按站点时区
// 换算），所以这里直接与 datetime('now') 比较即可。原来存的是没有时区的墙上
// 时间，被当成 UTC 解析，Asia/Shanghai 下会提前 8 小时触发。
function publishDuePosts() {
  try {
    const db = getDb();
    const due = execQuery(
      db,
      "SELECT id, title FROM posts WHERE status = 'future' AND publish_date IS NOT NULL AND datetime(publish_date) <= datetime('now')"
    );
    if (due.length === 0) return 0;

    db.run(
      "UPDATE posts SET status = 'published', publish_date = NULL, updated_at = datetime('now') WHERE status = 'future' AND publish_date IS NOT NULL AND datetime(publish_date) <= datetime('now')"
    );
    saveDatabase();
    console.log(`定时发布：${due.length} 篇文章已转为已发布（${due.map((p) => p.title).join('、')}）`);
    return due.length;
  } catch (error) {
    console.error('定时发布执行失败:', error);
    return 0;
  }
}

const PUBLISH_CHECK_INTERVAL = 60 * 1000;

function startScheduler() {
  publishDuePosts();
  setInterval(publishDuePosts, PUBLISH_CHECK_INTERVAL).unref();
}

// ------------------------------------------------------------------ 路由装配
//
// 各 domain 模块通过依赖注入拿到 db 助手、鉴权中间件、响应助手与配置，
// 模块之间不互相 require，也就不存在循环依赖。

const deps = {
  config,
  mailer,
  getDb,
  dbHelpers,
  saveDatabase,
  initDatabase,
  execQuery,
  getSingle,
  bindable,
  uuidv4,
  authenticate,
  requireAccess,
  // 角色集合集中定义在 lib/permissions，路由里不再写字符串字面量
  ROLE_ADMIN_ONLY,
  ROLE_CONTENT,
  ROLE_ANY,
  jwt,
  password,
  ok,
  fail,
  asyncHandler,
  checkCommentRate,
  checkLoginRate,
  recordLoginFailure,
  clearLoginFailures,
};

/**
 * API 版本前缀。
 *
 * 各模块的路由声明现在写的是相对路径（`/posts`、`/pages/:id` …），
 * 版本号只出现在这一处 —— 将来要开 /api/v2 不必再动十几个模块文件。
 *
 * 两个刻意不版本化的例外：
 *   /api/health            存活探针属于基础设施，版本化没有意义，且会打断已有的监控配置
 *   /feed.xml /sitemap.xml 挂在站点根路径，是给爬虫与订阅器用的公开约定地址
 */
const API_PREFIX = '/api/v1';

// 身份识别只挂这一次：各模块路由不必再逐个声明 authenticateToken，
// 需要授权的端点用 requireAccess(scope, { roles, anonymous }) 表达。
app.use(API_PREFIX, authenticate);

app.use(API_PREFIX, require('./src/modules/auth/routes')(deps));
app.use(API_PREFIX, require('./src/modules/posts/routes')(deps));
// 修订端点必须挂在 posts 之后：/posts/:id/revisions 与 /posts/:id 前缀相同，
// 顺序反了会被前面的路由先匹配走。
app.use(API_PREFIX, require('./src/modules/revisions/routes')(deps));
app.use(API_PREFIX, require('./src/modules/pages/routes')(deps));
app.use(API_PREFIX, require('./src/modules/categories/routes')(deps));
app.use(API_PREFIX, require('./src/modules/tags/routes')(deps));
app.use(API_PREFIX, require('./src/modules/comments/routes')(deps));
app.use(API_PREFIX, require('./src/modules/menus/routes')(deps));
app.use(API_PREFIX, require('./src/modules/widgets/routes')(deps));
app.use(API_PREFIX, require('./src/modules/media/routes')(deps));
app.use(API_PREFIX, require('./src/modules/settings/routes')(deps));
app.use(API_PREFIX, require('./src/modules/users/routes')(deps));
app.use(API_PREFIX, require('./src/modules/notifications/routes')(deps));
// 原 modules/public/routes.js 已合并进各资源模块：同一个资源不再有「公开」与
// 「后台」两套路径，差异由身份决定（匿名只看到已发布内容）。
app.use(API_PREFIX, require('./src/modules/analytics/routes')(deps));
app.use(API_PREFIX, require('./src/modules/smtp/routes')(deps));
app.use(API_PREFIX, require('./src/modules/backups/routes')(deps));

// 不版本化：探针与订阅源
app.use(require('./src/modules/health/routes')(deps));
app.use(require('./src/modules/feed/routes')(deps));

// 兜底：未匹配的路由返回统一 JSON 404，异常统一走错误响应
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  await initDatabase();

  // 原来每次启动都往 notifications 插一条「系统已启动」并全量写盘：
  // 重启几次就多几条垃圾通知，纯属污染数据，已移除。

  startScheduler();

  app.listen(PORT, () => {
    console.log(`HappyHome API Server running on http://localhost:${PORT}`);
    console.log('Database: happyhome.db');
    console.log('');
    console.log(`API 前缀：${API_PREFIX}（/api/health、/feed.xml、/sitemap.xml 不版本化）`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  Auth:');
    console.log(`    POST ${API_PREFIX}/auth/login`);
    console.log(`    POST ${API_PREFIX}/auth/register`);
    console.log(`    GET  ${API_PREFIX}/auth/me`);
    console.log('  Posts:');
    console.log(`    GET    ${API_PREFIX}/posts`);
    console.log(`    GET    ${API_PREFIX}/posts/:id`);
    console.log(`    POST   ${API_PREFIX}/posts`);
    console.log(`    PUT    ${API_PREFIX}/posts/:id`);
    console.log(`    DELETE ${API_PREFIX}/posts/:id`);
    console.log('  Pages:');
    console.log(`    GET    ${API_PREFIX}/pages`);
    console.log(`    GET    ${API_PREFIX}/pages/:id`);
    console.log(`    POST   ${API_PREFIX}/pages`);
    console.log(`    PUT    ${API_PREFIX}/pages/:id`);
    console.log(`    DELETE ${API_PREFIX}/pages/:id`);
    console.log('  Categories:');
    console.log(`    GET    ${API_PREFIX}/categories`);
    console.log(`    POST   ${API_PREFIX}/categories`);
    console.log(`    PUT    ${API_PREFIX}/categories/:id`);
    console.log(`    DELETE ${API_PREFIX}/categories/:id`);
    console.log('  Tags:');
    console.log(`    GET    ${API_PREFIX}/tags`);
    console.log(`    POST   ${API_PREFIX}/tags`);
    console.log(`    PUT    ${API_PREFIX}/tags/:id`);
    console.log(`    DELETE ${API_PREFIX}/tags/:id`);
    console.log('  Public:');
    console.log(`    GET    ${API_PREFIX}/public/posts`);
    console.log(`    GET    ${API_PREFIX}/public/posts/:id`);
    console.log(`    GET    ${API_PREFIX}/public/pages`);
    console.log(`    GET    ${API_PREFIX}/public/pages/:slug`);
    console.log(`    GET    ${API_PREFIX}/public/settings`);
    console.log('  Analytics:');
    console.log(`    GET    ${API_PREFIX}/analytics/stats`);
    console.log(`    POST   ${API_PREFIX}/analytics/track`);
    console.log('  SMTP:');
    console.log(`    POST   ${API_PREFIX}/auth/send-verification-code`);
    console.log(`    POST   ${API_PREFIX}/auth/verify-code`);
    console.log(`    POST   ${API_PREFIX}/auth/reset-password`);
    console.log(`    POST   ${API_PREFIX}/smtp/test`);
    console.log(`    POST   ${API_PREFIX}/smtp/refresh`);
    console.log('  Feed:');
    console.log('    GET    /feed.xml');
    console.log('    GET    /sitemap.xml');
    console.log('  Health:');
    console.log('    GET    /api/health');
  });
}

startServer().catch(console.error);
