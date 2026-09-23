const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

// 签发：密钥与有效期统一来自 config，调用点不再各自拼 JWT_SECRET。
// 注意：签名内容与有效期与重构前完全一致（secret 读同一个环境变量，expiresIn 不变），
// 否则已登录用户会掉线、冒烟也会失败。
//
// expiresIn 可选：登录时传入 settings.sessionTimeout，让「登录有效期」这个设置生效。
// 不传则沿用环境变量 —— 也就是未配置时的既有行为。
function sign(payload, expiresIn) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn || JWT_EXPIRES_IN });
}

// 校验：透传 jsonwebtoken 的回调风格，保持调用点行为不变
function verify(token, callback) {
  return jwt.verify(token, JWT_SECRET, callback);
}

module.exports = { sign, verify };