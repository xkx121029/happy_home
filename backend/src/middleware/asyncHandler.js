/**
 * 把 async 路由处理器的 reject 交给 Express 错误中间件。
 *
 * 处理器内部已有 try/catch 时它不改变任何行为，只是兜底避免出现
 * unhandledRejection（由统一错误响应收口）。
 */
module.exports = function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};