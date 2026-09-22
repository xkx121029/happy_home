const bcrypt = require('bcryptjs');

// 密码策略：最短 6 位，与重构前各端点里的判断保持一致
const MIN_PASSWORD_LENGTH = 6;

// bcrypt 封装：哈希强度与原来一样是 10
function hash(password) {
  return bcrypt.hashSync(password, 10);
}

function compare(plain, hashed) {
  return bcrypt.compareSync(plain, hashed);
}

// 保留原来的字符串长度判断语义（password 一定是字符串，且调用前已确保非空）
function isTooShort(password) {
  return password.length < MIN_PASSWORD_LENGTH;
}

module.exports = { hash, compare, isTooShort, MIN_PASSWORD_LENGTH };