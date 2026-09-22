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

module.exports = { checkCommentRate };