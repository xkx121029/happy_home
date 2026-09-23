#!/usr/bin/env node
/**
 * 一次性脚本（用完即删）：把各模块路由的鉴权中间件换成 requireAccess。
 *
 * 映射表是显式写死的，不做推断 —— 79 条路由的权限归属属于设计决定，
 * 让脚本去猜「这个端点该要什么角色」迟早会猜错一个，那就是一个权限洞。
 *
 * 相对方案的一处偏离：方案把「只要求已登录」的约 60 处归为「什么都不加」。
 * 但那样 API Key 会无门槛通过所有写接口 —— scope 就形同虚设。
 * 所以每条路由都给一个显式 scope，「只要求已登录」表达为 roles: ROLE_ANY。
 */
import fs from 'node:fs';
import path from 'node:path';

const MODULES = path.resolve(process.cwd(), 'src/modules');

/** 'METHOD /path' → 新的中间件表达式（不含尾逗号）。 */
const RULES = {
  // ---- 内容读：匿名可读，但匿名只能看到已发布内容（由处理函数按 req.auth.level 过滤）
  'GET /posts': "requireAccess('posts:read', { roles: ROLE_CONTENT, anonymous: true })",
  'GET /posts/:id': "requireAccess('posts:read', { roles: ROLE_CONTENT, anonymous: true })",
  'GET /pages': "requireAccess('pages:read', { roles: ROLE_CONTENT, anonymous: true })",
  'GET /pages/:id': "requireAccess('pages:read', { roles: ROLE_CONTENT, anonymous: true })",
  'GET /categories': "requireAccess('categories:read', { roles: ROLE_CONTENT, anonymous: true })",
  'GET /tags': "requireAccess('tags:read', { roles: ROLE_CONTENT, anonymous: true })",
  'GET /menus': "requireAccess('menus:read', { roles: ROLE_CONTENT, anonymous: true })",
  'GET /widgets': "requireAccess('widgets:read', { roles: ROLE_CONTENT, anonymous: true })",
  'GET /settings': "requireAccess('settings:read', { roles: ROLE_ANY, anonymous: true })",

  // ---- 内容写
  'POST /posts': "requireAccess('posts:write', { roles: ROLE_CONTENT })",
  'PUT /posts/:id': "requireAccess('posts:write', { roles: ROLE_CONTENT })",
  'DELETE /posts/:id': "requireAccess('posts:write', { roles: ROLE_CONTENT })",
  'POST /pages': "requireAccess('pages:write', { roles: ROLE_CONTENT })",
  'PUT /pages/:id': "requireAccess('pages:write', { roles: ROLE_CONTENT })",
  'DELETE /pages/:id': "requireAccess('pages:write', { roles: ROLE_CONTENT })",
  'POST /categories': "requireAccess('categories:write', { roles: ROLE_CONTENT })",
  'PUT /categories/:id': "requireAccess('categories:write', { roles: ROLE_CONTENT })",
  'DELETE /categories/:id': "requireAccess('categories:write', { roles: ROLE_CONTENT })",
  'POST /tags': "requireAccess('tags:write', { roles: ROLE_CONTENT })",
  'PUT /tags/:id': "requireAccess('tags:write', { roles: ROLE_CONTENT })",
  'DELETE /tags/:id': "requireAccess('tags:write', { roles: ROLE_CONTENT })",
  'POST /menus': "requireAccess('menus:write', { roles: ROLE_CONTENT })",
  'PUT /menus/:id': "requireAccess('menus:write', { roles: ROLE_CONTENT })",
  'DELETE /menus/:id': "requireAccess('menus:write', { roles: ROLE_CONTENT })",
  'POST /widgets': "requireAccess('widgets:write', { roles: ROLE_CONTENT })",
  'PUT /widgets/:id': "requireAccess('widgets:write', { roles: ROLE_CONTENT })",
  'DELETE /widgets/:id': "requireAccess('widgets:write', { roles: ROLE_CONTENT })",
  'POST /media': "requireAccess('media:write', { roles: ROLE_CONTENT })",
  'DELETE /media/:id': "requireAccess('media:write', { roles: ROLE_CONTENT })",

  // ---- 媒体读：媒体库里是未发布的素材，不给匿名
  'GET /media': "requireAccess('media:read', { roles: ROLE_CONTENT })",

  // ---- 修订
  'GET /posts/:id/revisions': "requireAccess('revisions:read', { roles: ROLE_CONTENT })",
  'GET /revisions/:id': "requireAccess('revisions:read', { roles: ROLE_CONTENT })",
  'POST /revisions/:id/restore': "requireAccess('revisions:write', { roles: ROLE_CONTENT })",
  'DELETE /revisions/:id': "requireAccess('revisions:write', { roles: ROLE_CONTENT })",

  // ---- 评论
  'POST /comments': "requireAccess('comments:write', { roles: ROLE_ANY })",
  'GET /comments': "requireAccess('comments:read', { roles: ROLE_ANY })",
  'PUT /comments/:id/status': "requireAccess('comments:moderate', { roles: ROLE_CONTENT })",
  'DELETE /comments/:id': "requireAccess('comments:moderate', { roles: ROLE_CONTENT })",

  // ---- 通知：按 req.user.id 过滤，API Key 没有对应的用户身份，一律拒绝
  'GET /notifications': "requireAccess('notifications:read', { roles: ROLE_ANY, allowKey: false })",
  'GET /notifications/unread': "requireAccess('notifications:read', { roles: ROLE_ANY, allowKey: false })",
  'GET /notifications/count': "requireAccess('notifications:read', { roles: ROLE_ANY, allowKey: false })",
  'PUT /notifications/:id/read': "requireAccess('notifications:write', { roles: ROLE_ANY, allowKey: false })",
  'PUT /notifications/read-all': "requireAccess('notifications:write', { roles: ROLE_ANY, allowKey: false })",
  'DELETE /notifications/:id': "requireAccess('notifications:write', { roles: ROLE_ANY, allowKey: false })",
  'DELETE /notifications/clear': "requireAccess('notifications:write', { roles: ROLE_ANY, allowKey: false })",
  'POST /notifications/demo': "requireAccess('notifications:write', { roles: ROLE_ANY, allowKey: false })",

  // ---- 统计
  'GET /analytics/stats': "requireAccess('analytics:read', { roles: ROLE_ANY })",
  // 前台浏览量采集必须能匿名调，否则访客的浏览永远统计不到
  'POST /analytics/track': "requireAccess('analytics:write', { anonymous: true })",

  // ---- 用户
  'GET /users': "requireAccess('users:read', { roles: ROLE_ADMIN_ONLY })",
  'GET /users/:id': "requireAccess('users:read', { roles: ROLE_ANY })",
  'POST /users': "requireAccess('users:write', { roles: ROLE_ADMIN_ONLY })",
  'PUT /users/:id': "requireAccess('users:write', { roles: ROLE_ADMIN_ONLY })",
  'DELETE /users/:id': "requireAccess('users:write', { roles: ROLE_ADMIN_ONLY })",

  // ---- 设置
  'PUT /settings': "requireAccess('settings:write', { roles: ROLE_ADMIN_ONLY })",

  // ---- SMTP
  'POST /smtp/test': "requireAccess('smtp:write', { roles: ROLE_ADMIN_ONLY })",
  'POST /smtp/refresh': "requireAccess('smtp:write', { roles: ROLE_ADMIN_ONLY })",

  // ---- 备份
  'GET /backups': "requireAccess('backups:read', { roles: ROLE_ADMIN_ONLY })",
  // 下载拿到的是整库文件，原来只要求「已登录」，这里收紧到管理员
  'GET /backups/:id/download': "requireAccess('backups:read', { roles: ROLE_ADMIN_ONLY })",
  'POST /backups': "requireAccess('backups:write', { roles: ROLE_ADMIN_ONLY })",
  'DELETE /backups/:id': "requireAccess('backups:write', { roles: ROLE_ADMIN_ONLY })",
  'POST /backups/:id/restore': "requireAccess('backups:restore', { roles: ROLE_ADMIN_ONLY })",

  // ---- /auth/me 只给登录用户，不给密钥（密钥没有「自己」这个用户）
  'GET /auth/me': "requireAccess('users:read', { roles: ROLE_ANY, allowKey: false })",

  // ---- 公开评论提交：匿名可写，限流在处理器里
  'POST /public/comments': "requireAccess('comments:write', { anonymous: true })",
};

/** 需要保留、但映射表里没有的路由（登录/注册/验证码这类前置端点）。 */
const NO_GUARD = new Set([
  'POST /auth/login',
  'POST /auth/register',
  'POST /auth/verify',
  'POST /auth/send-register-code',
  'POST /auth/resend-verification',
  'POST /auth/send-verification-code',
  'POST /auth/verify-code',
  'POST /auth/reset-password',
  // public 模块的只读端点在批次 3 会被合并掉，这里先只换掉 optionalAuth
  'GET /public/posts',
  'GET /public/posts/:id',
  'GET /public/pages',
  'GET /public/pages/:slug',
  'GET /public/categories',
  'GET /public/settings',
  'GET /public/posts/:id/comments',
  'GET /public/comments/recent',
]);

const ROUTE_RE =
  /router\.(get|post|put|delete|patch)\(\s*'([^']+)'\s*,\s*((?:authenticateToken|optionalAuth|requireRole\([^)]*\))(?:\s*,\s*requireRole\([^)]*\))?)\s*,\s*/g;

let changedFiles = 0;
let changedRoutes = 0;
const unmapped = [];

for (const dir of fs.readdirSync(MODULES)) {
  const file = path.join(MODULES, dir, 'routes.js');
  if (!fs.existsSync(file)) continue;

  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  src = src.replace(ROUTE_RE, (full, method, routePath, guards) => {
    const key = `${method.toUpperCase()} ${routePath}`;

    if (NO_GUARD.has(key)) {
      changedRoutes += 1;
      return `router.${method}('${routePath}', `;
    }

    const rule = RULES[key];
    if (!rule) {
      unmapped.push(`${path.relative(process.cwd(), file)}  ${key}`);
      return full;
    }
    changedRoutes += 1;
    return `router.${method}('${routePath}', ${rule}, `;
  });

  // deps 解构里补上新名字、去掉不再用的旧名字
  src = src.replace(/const \{([\s\S]*?)\} = deps;/g, (full, inner) => {
    let names = inner
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((n) => !['authenticateToken', 'requireRole', 'optionalAuth'].includes(n));

    for (const need of ['requireAccess', 'ROLE_CONTENT', 'ROLE_ADMIN_ONLY', 'ROLE_ANY']) {
      if (new RegExp(`\\b${need}\\b`).test(src) && !names.includes(need)) names.push(need);
    }
    return `const { ${names.join(', ')} } = deps;`;
  });

  if (src !== before) {
    fs.writeFileSync(file, src, 'utf8');
    changedFiles += 1;
  }
}

console.log(`改了 ${changedRoutes} 条路由，涉及 ${changedFiles} 个文件`);
if (unmapped.length) {
  console.log('\n映射表里没有、需要人工确认：');
  unmapped.forEach((u) => console.log('  ' + u));
}
