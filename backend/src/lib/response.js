/**
 * 统一响应助手。
 *
 * 全站成功响应都带 success:true，错误响应形状固定为 { success:false, message }。
 * 这里把这两点收敛成两个函数，避免每个路由各写一份字面量。
 *
 * 关键：ok 只是把 success:true 合并进 payload，不会改动 payload 里已有的字段，
 * 因此响应契约（字段名 / 类型 / 状态码）与重构前完全一致。
 */

// 成功响应：payload 是除 success 之外的完整响应体，status 默认 200
function ok(res, payload = {}, status = 200) {
  const body = { success: true, ...payload };
  if (status === 200) return res.json(body);
  return res.status(status).json(body);
}

// 错误响应：code 为 HTTP 状态码，message 为提示文案（形状固定为 { success:false, message }）
function fail(res, code, message) {
  return res.status(code).json({ success: false, message });
}

module.exports = { ok, fail };