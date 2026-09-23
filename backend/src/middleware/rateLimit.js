const { COMMENT_RATE_LIMIT } = require('../config');

// 极简内存限流：按 IP 与邮箱双维度计数。
// 公开写接口没有限流等于开放刷库通道，所以它与端点必须同时存在。
// 阈值可通过环境变量调整：本地反复跑冒烟测试时可以把上限调高。
const commentRateBuckets = new Map();

function checkCommentRate(key) {
  const now = Date.now();
  const bucket = commentRateBuckets.get(key);
  if (!bucket || now - bucket.start > COMMENT_RATE_LIMIT.windowMs) {
    commentRateBuckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: COMMENT_RATE_LIMIT.max - 1 };
  }
  if (bucket.count >= COMMENT_RATE_LIMIT.max) {
    return { allowed: false, remaining: 0 };
  }
  bucket.count += 1;
  return { allowed: true, remaining: COMMENT_RATE_LIMIT.max - bucket.count };
}

// 定期清理过期计数，避免内存随访客量无界增长
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of commentRateBuckets) {
    if (now - bucket.start > COMMENT_RATE_LIMIT.windowMs) commentRateBuckets.delete(key);
  }
}, COMMENT_RATE_LIMIT.windowMs).unref();

// ------------------------------------------------------------ 登录失败限流
//
// 与评论限流刻意分开计数，因为两者语义不同：
//   - 评论限流统计的是「成功提交」，防止刷库；
//   - 登录限流只统计「失败」，防止撞库 —— 输对密码必须立刻清零，
//     否则用户自己手滑几次之后再输对也会被锁在门外。
// 阈值来自 settings.loginLimit（0 或未配置表示不限制），所以由调用方传入。
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const loginRateBuckets = new Map();

function checkLoginRate(key, max) {
  const limit = Number(max) || 0;
  if (limit <= 0) return { allowed: true, remaining: Infinity };

  const now = Date.now();
  const bucket = loginRateBuckets.get(key);
  if (!bucket || now - bucket.start > LOGIN_WINDOW_MS) {
    return { allowed: true, remaining: limit };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: limit - bucket.count };
}

function recordLoginFailure(key) {
  const now = Date.now();
  const bucket = loginRateBuckets.get(key);
  if (!bucket || now - bucket.start > LOGIN_WINDOW_MS) {
    loginRateBuckets.set(key, { start: now, count: 1 });
    return;
  }
  bucket.count += 1;
}

function clearLoginFailures(key) {
  loginRateBuckets.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of loginRateBuckets) {
    if (now - bucket.start > LOGIN_WINDOW_MS) loginRateBuckets.delete(key);
  }
}, LOGIN_WINDOW_MS).unref();

module.exports = {
  checkCommentRate,
  checkLoginRate,
  recordLoginFailure,
  clearLoginFailures,
};
