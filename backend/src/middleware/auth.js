const jwtLib = require('../lib/jwt');
const { fail } = require('../lib/response');

/**
 * 鉴权中间件工厂。
 *
 * getDb / getSingle 由调用方注入，本模块不反向依赖 db 层，避免循环引用；
 * 同时也让这些中间件可以脱离 server.js 单独测试。
 */
module.exports = function createAuth({ getDb, getSingle }) {
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return fail(res, 401, '未授权访问');
    }

    jwtLib.verify(token, (err, user) => {
      if (err) {
        return fail(res, 403, '无效的令牌');
      }
      req.user = user;
      next();
    });
  }

  // 可选鉴权：有合法 token 就带上用户信息，没有也放行
  function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return next();
    jwtLib.verify(token, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  }

  // 只允许指定角色访问。
  // 原实现是 `user.role !== role && user.role !== 'administrator'`：当调用方传入的
  // role 恰好就是 'administrator' 时，第二个条件恒为假，导致整个表达式恒为假 ——
  // 也就是任何已登录用户都能通过 requireRole('administrator')，管理员权限形同虚设。
  // 现在改为严格匹配；若将来需要「管理员是任意角色的超集」，
  // 必须由调用点显式声明多个角色，而不是靠隐式放行。
  function requireRole(role) {
    return (req, res, next) => {
      const db = getDb();
      const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (!user || user.role !== role) {
        return fail(res, 403, '权限不足');
      }
      next();
    };
  }

  return { authenticateToken, optionalAuth, requireRole };
};