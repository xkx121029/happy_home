/**
 * 权限模型。
 *
 * 这套系统里有两种调用者，授权方式不同：
 *
 *   登录用户（JWT）  按**角色**授权。路由声明「哪些角色可以用」，
 *                    与改造前的 requireRole 语义一致，行为不变。
 *   API Key          按**scope** 授权。密钥是一串长期凭据，不该等于某个人的
 *                    全部身份，所以它只带一组明确的能力标签。
 *   匿名             只有一张很短的只读白名单，且必须由路由**显式**声明
 *                    anonymous: true 才生效 —— 默认放行是这类改造最容易出洞的地方。
 *
 * 角色集合在这里集中定义，避免各路由里散落 ['administrator','editor','author'] 这种字面量，
 * 将来加角色时漏改一处就是一个权限洞。
 */

/** 只有管理员。 */
const ROLE_ADMIN_ONLY = ['administrator'];

/** 内容域：文章、页面、分类、标签、菜单、小工具、媒体。 */
const ROLE_CONTENT = ['administrator', 'editor', 'author'];

/** 任何已登录用户。 */
const ROLE_ANY = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];

/**
 * scope 目录，按业务域分组。
 * 后台的新建密钥页直接按这个结构渲染复选框，所以这里既是白名单也是界面数据源。
 */
const SCOPE_GROUPS = [
  {
    id: 'content',
    label: '内容',
    scopes: [
      { id: 'posts:read', label: '读取文章' },
      { id: 'posts:write', label: '创建/修改/删除文章' },
      { id: 'pages:read', label: '读取页面' },
      { id: 'pages:write', label: '创建/修改/删除页面' },
      { id: 'categories:read', label: '读取分类' },
      { id: 'categories:write', label: '管理分类' },
      { id: 'tags:read', label: '读取标签' },
      { id: 'tags:write', label: '管理标签' },
      { id: 'media:read', label: '读取媒体库' },
      { id: 'media:write', label: '上传/删除媒体' },
      { id: 'revisions:read', label: '读取修订' },
      { id: 'revisions:write', label: '回滚/删除修订' },
    ],
  },
  {
    id: 'structure',
    label: '站点结构',
    scopes: [
      { id: 'menus:read', label: '读取菜单' },
      { id: 'menus:write', label: '管理菜单' },
      { id: 'widgets:read', label: '读取小工具' },
      { id: 'widgets:write', label: '管理小工具' },
    ],
  },
  {
    id: 'community',
    label: '互动',
    scopes: [
      { id: 'comments:read', label: '读取评论' },
      { id: 'comments:write', label: '发表评论' },
      { id: 'comments:moderate', label: '审核/删除评论' },
      { id: 'notifications:read', label: '读取通知' },
      { id: 'notifications:write', label: '标记/删除通知' },
      { id: 'analytics:read', label: '读取统计数据' },
      { id: 'analytics:write', label: '上报访问量' },
    ],
  },
  {
    id: 'system',
    label: '系统（高危）',
    highRisk: true,
    scopes: [
      { id: 'users:read', label: '读取用户' },
      { id: 'users:write', label: '创建/修改/删除用户' },
      { id: 'settings:read', label: '读取站点设置' },
      { id: 'settings:write', label: '修改站点设置' },
      { id: 'smtp:write', label: '测试/刷新 SMTP 配置' },
      { id: 'backups:read', label: '下载备份' },
      { id: 'backups:write', label: '创建/删除备份' },
      { id: 'backups:restore', label: '从备份恢复数据库' },
      { id: 'apikeys:read', label: '读取 API 密钥' },
      { id: 'apikeys:write', label: '创建/撤销 API 密钥' },
    ],
  },
];

/** 全部合法 scope 的扁平集合。 */
const ALL_SCOPES = new Set(SCOPE_GROUPS.flatMap((group) => group.scopes.map((s) => s.id)));

/** 通配 scope：等价于全部权限。 */
const WILDCARD_SCOPE = 'admin';

/**
 * 默认勾选的 scope —— 「只读全集」。
 *
 * 新建密钥默认给只读而不是完全访问：密钥是长期凭据，泄露的代价与它的权限成正比，
 * 而绝大多数外部集成本来就只需要读。写权限要有人主动勾。
 */
const READONLY_SCOPES = [...ALL_SCOPES].filter((scope) => scope.endsWith(':read'));

/**
 * 高危 scope。后台新建密钥时勾到这些要额外提示后果。
 * 这几个的共同点是：拿到就能改管理员凭据、拿走整库数据、或直接控制发信通道。
 */
const HIGH_RISK_SCOPES = new Set([
  'users:write',
  'settings:write',
  'smtp:write',
  'backups:read',
  'backups:write',
  'backups:restore',
  'apikeys:read',
  'apikeys:write',
]);

/**
 * 匿名调用者可以使用的 scope。
 *
 * 只有这一张表里的 scope 才允许路由声明 anonymous: true —— requireAccess 会校验，
 * 写错一个 anonymous 不会把写接口也放开。
 */
const ANONYMOUS_SCOPES = new Set([
  'posts:read',
  'pages:read',
  'categories:read',
  'tags:read',
  'menus:read',
  'widgets:read',
  'comments:read',
  'comments:write',
  'settings:read',
  'analytics:write',
]);

/** 过滤掉不认识的 scope，避免把拼错的标签存进库。 */
function sanitizeScopes(input) {
  if (!Array.isArray(input)) return [];
  const out = new Set();
  for (const raw of input) {
    const scope = String(raw || '').trim();
    if (scope === WILDCARD_SCOPE || ALL_SCOPES.has(scope)) out.add(scope);
  }
  return [...out];
}

/** 某个 scope 是否被这组 scope 覆盖（含通配）。 */
function scopesInclude(granted, scope) {
  if (!Array.isArray(granted)) return false;
  return granted.includes(WILDCARD_SCOPE) || granted.includes(scope);
}

function isHighRiskScope(scope) {
  return HIGH_RISK_SCOPES.has(scope) || scope === WILDCARD_SCOPE;
}

function isAnonymousAllowed(scope) {
  return ANONYMOUS_SCOPES.has(scope);
}

module.exports = {
  ROLE_ADMIN_ONLY,
  ROLE_CONTENT,
  ROLE_ANY,
  SCOPE_GROUPS,
  ALL_SCOPES,
  WILDCARD_SCOPE,
  READONLY_SCOPES,
  HIGH_RISK_SCOPES,
  ANONYMOUS_SCOPES,
  sanitizeScopes,
  scopesInclude,
  isHighRiskScope,
  isAnonymousAllowed,
};
