const jwtLib = require('../lib/jwt');
const { fail } = require('../lib/response');
const permissions = require('../lib/permissions');

/**
 * 身份识别与访问控制。
 *
 * 与改造前的 auth.js 的区别：
 *
 *   原来  authenticateToken  只认 JWT，且「无 token → 401、验签失败 → 403」，
 *         鉴权与授权混在同一个中间件里，所以每个路由都得自己挂一遍。
 *   现在  authenticate  只做**身份识别**，永不直接拒绝；由 requireAccess 决定放不放行。
 *         识别一次挂在版本前缀上，各模块路由不必再重复声明。
 *
 * 为什么要拆开：对外开放 API 之后，同一个端点会同时面对三种调用者
 * （匿名访客 / 登录用户 / API Key），而「有没有带凭据」与「能不能做这件事」
 * 是两件事。混在一起写，每个路由都要重写一遍三分支判断。
 */

/** 密钥明文的前缀标记，用来与 JWT 区分（两者都走 Authorization: Bearer）。 */
const KEY_PREFIX_MARK = 'hhk_';

/** last_used_at / request_count 的写回节流窗口。 */
const TOUCH_INTERVAL_MS = 60 * 1000;

module.exports = function createAuthenticate({ getDb, getSingle, execQuery, saveDatabase, password }) {
  /** keyId → 上次写回时间。避免每个请求都 saveDatabase() 全量落盘。 */
  const touchedAt = new Map();

  function touchKey(keyRow) {
    const now = Date.now();
    const last = touchedAt.get(keyRow.id) || 0;
    if (now - last < TOUCH_INTERVAL_MS) return;
    touchedAt.set(keyRow.id, now);
    try {
      const db = getDb();
      db.run(
        "UPDATE api_keys SET last_used_at = datetime('now'), request_count = request_count + 1 WHERE id = ?",
        [keyRow.id]
      );
      saveDatabase();
    } catch (error) {
      // 统计写失败不该影响这次请求本身
      console.error('更新密钥使用统计失败:', error);
    }
  }

  /** 从 X-API-Key 或 Authorization: Bearer hhk_… 里取出密钥明文。 */
  function extractRawKey(req) {
    const direct = req.headers['x-api-key'];
    if (direct) return String(direct).trim();

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token && token.startsWith(KEY_PREFIX_MARK)) return token.trim();
    return null;
  }

  /**
   * 身份识别。结果放在 req.auth，永不直接返回 401/403。
   *
   *   { type: 'key',       keyId, scopes }  API Key
   *   { type: 'user' }                      合法 JWT，用户信息在 req.user
   *   { type: 'anonymous' }                 没带凭据
   *   { type: 'invalid' }                   带了凭据但无效（过期 / 已撤销 / 验签失败）
   *
   * 密钥优先于 JWT：两者同时出现时只看密钥，且密钥校验失败**不回退**到 JWT ——
   * 否则「拿错钥匙」会静默变成「用另一把钥匙进门」，出问题时无从排查。
   */
  function authenticate(req, res, next) {
    const rawKey = extractRawKey(req);

    if (rawKey) {
      const prefix = rawKey.split('_')[1];
      if (!prefix) {
        req.auth = { type: 'invalid', reason: 'malformed' };
        return next();
      }

      let row = null;
      try {
        const db = getDb();
        const candidates = execQuery(
          db,
          'SELECT * FROM api_keys WHERE key_prefix = ? AND revoked_at IS NULL',
          [prefix]
        );
        row = candidates.find((item) => password.compare(rawKey, item.key_hash)) || null;
      } catch (error) {
        console.error('校验 API 密钥失败:', error);
      }

      if (!row) {
        req.auth = { type: 'invalid', reason: 'unknown' };
        return next();
      }

      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        req.auth = { type: 'invalid', reason: 'expired' };
        return next();
      }

      let scopes = [];
      try {
        scopes = JSON.parse(row.scopes || '[]');
      } catch {
        scopes = [];
      }

      req.auth = { type: 'key', keyId: row.id, scopes };
      // 密钥没有「自己的」用户身份，只保留创建者便于审计；
      // role 固定为 'api'，它不会命中任何按角色授权的路由。
      req.user = {
        id: row.created_by || null,
        username: `API:${row.name}`,
        role: 'api',
        isApiKey: true,
      };
      touchKey(row);
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      req.auth = { type: 'anonymous' };
      return next();
    }

    jwtLib.verify(token, (err, user) => {
      if (err) {
        req.auth = { type: 'invalid', reason: 'jwt' };
        return next();
      }
      req.user = user;
      req.auth = { type: 'user' };
      next();
    });
  }

  /**
   * 访问控制。
   *
   * @param {string} scope 这个端点要求的 scope，如 'posts:write'
   * @param {{ roles?: string[], anonymous?: boolean, allowKey?: boolean }} options
   *        roles     允许的登录角色（语义与改造前的 requireRole 一致）
   *        anonymous 是否允许匿名访问；只有 lib/permissions 的匿名白名单里的
   *                  scope 才能真正生效，写错一个 anonymous 不会把写接口放开
   *        allowKey  是否允许 API Key 通过，默认 true。通知这类「按用户隔离」的
   *                  端点要设 false —— 密钥没有对应的用户身份，放它进去只能看到
   *                  创建者的通知，语义上就是错的
   *
   * 通过时会在 req.auth.level 上留下授权来源：
   *   'full'    —— 角色或密钥命中，可以看到全部数据
   *   'public'  —— 走的是匿名白名单，调用方必须自己做行级过滤
   *                （例如文章端点要强制 status='published'）
   */
  function requireAccess(scope, { roles = [], anonymous = false, allowKey = true } = {}) {
    const anonymousOk = anonymous && permissions.isAnonymousAllowed(scope);

    return (req, res, next) => {
      const auth = req.auth || { type: 'anonymous' };

      if (auth.type === 'invalid') {
        // 保住改造前的契约：带了无效凭据返回 403 而不是 401
        return fail(res, 403, '无效的令牌');
      }

      if (auth.type === 'key') {
        if (!allowKey) {
          return fail(res, 403, `该端点不接受 API 密钥（${scope}）`);
        }
        if (permissions.scopesInclude(auth.scopes, scope)) {
          auth.level = 'full';
          return next();
        }
        return fail(res, 403, `该密钥没有 ${scope} 权限`);
      }

      if (auth.type === 'user') {
        const db = getDb();
        const user = getSingle(db, 'SELECT role FROM users WHERE id = ?', [req.user.id]);
        if (user && roles.includes(user.role)) {
          auth.level = 'full';
          return next();
        }
        // 已登录但角色不够时退到匿名待遇（例如订阅者读公开文章），
        // 而不是直接 403 —— 他能看到的不会比访客更多。
        if (anonymousOk) {
          auth.level = 'public';
          return next();
        }
        return fail(res, 403, '权限不足');
      }

      if (anonymousOk) {
        auth.level = 'public';
        return next();
      }

      return fail(res, 401, '未授权访问');
    };
  }

  return { authenticate, requireAccess };
};
