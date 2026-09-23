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
const createAuth = require('./src/middleware/auth');
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

// 鉴权中间件由工厂创建，db 助手通过参数注入（见 src/middleware/auth.js）
const { authenticateToken, optionalAuth, requireRole } = createAuth({ getDb, getSingle });

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
  authenticateToken,
  optionalAuth,
  requireRole,
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
app.use(API_PREFIX, require('./src/modules/public/routes')(deps));
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
    console.log('Available endpoints:');
    console.log('  Auth:');
    console.log('    POST /api/auth/login');
    console.log('    POST /api/auth/register');
    console.log('    GET  /api/auth/me');
    console.log('  Posts:');
    console.log('    GET    /api/posts');
    console.log('    GET    /api/posts/:id');
    console.log('    POST   /api/posts');
    console.log('    PUT    /api/posts/:id');
    console.log('    DELETE /api/posts/:id');
    console.log('  Pages:');
    console.log('    GET    /api/pages');
    console.log('    GET    /api/pages/:id');
    console.log('    POST   /api/pages');
    console.log('    PUT    /api/pages/:id');
    console.log('    DELETE /api/pages/:id');
    console.log('  Categories:');
    console.log('    GET    /api/categories');
    console.log('    POST   /api/categories');
    console.log('    PUT    /api/categories/:id');
    console.log('    DELETE /api/categories/:id');
    console.log('  Tags:');
    console.log('    GET    /api/tags');
    console.log('    POST   /api/tags');
    console.log('    PUT    /api/tags/:id');
    console.log('    DELETE /api/tags/:id');
    console.log('  Public:');
    console.log('    GET    /api/public/posts');
    console.log('    GET    /api/public/posts/:id');
    console.log('    GET    /api/public/pages');
    console.log('    GET    /api/public/pages/:slug');
    console.log('    GET    /api/public/settings');
    console.log('  Analytics:');
    console.log('    GET    /api/analytics/stats');
    console.log('    POST   /api/analytics/track');
    console.log('  SMTP:');
    console.log('    POST   /api/auth/send-verification-code');
    console.log('    POST   /api/auth/verify-code');
    console.log('    POST   /api/auth/reset-password');
    console.log('    POST   /api/smtp/test');
    console.log('    POST   /api/smtp/refresh');
  });
}

startServer().catch(console.error);
