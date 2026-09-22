const { fail } = require('../lib/response');

// 未匹配到任何路由时统一返回 JSON，而不是 Express 默认的 HTML 404 页面。
// 状态码仍为 404，与重构前的默认行为一致。
function notFound(req, res) {
  return fail(res, 404, '接口不存在');
}

// 统一错误响应：兜住被 next(err) 抛出的异常，形状与其他错误完全一致
function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  return fail(res, 500, '服务器错误');
}

module.exports = { notFound, errorHandler };