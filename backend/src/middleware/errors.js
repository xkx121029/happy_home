const { fail } = require('../lib/response');

/**
 * 未匹配到任何路由时统一返回 JSON，而不是 Express 默认的 HTML 404 页面。
 * 状态码仍为 404，与重构前的默认行为一致。
 *
 * 对外开放 API 之后这里多了一件事：迁移前的地址（/api/posts、/api/public/posts …）
 * 现在会落到 404。只回一句「接口不存在」，外部集成方会以为是自己拼错了，
 * 于是去翻文档、发工单 —— 所以按情况补一句能自解的提示。
 *
 * 注意这只是文案，不构成兼容层：状态码仍是 404，旧地址不会真的能用。
 */
function notFound(req, res) {
  const path = req.path || '';

  if (path.startsWith('/api/public/')) {
    return fail(res, 404, '接口不存在', {
      hint: '公开端点已并入对应资源路径，请改用 /api/v1/posts、/api/v1/pages 等；'
        + '匿名调用同一个端点只会读到已发布内容。',
    });
  }

  // /api/health 是刻意不版本化的存活探针，其余业务端点全部在 /api/v1 下
  if (path.startsWith('/api/') && !path.startsWith('/api/v1/') && path !== '/api/health') {
    return fail(res, 404, '接口不存在', {
      hint: `所有业务端点已迁移到 /api/v1 下，请把 ${path} 改为 /api/v1${path.slice('/api'.length)}。`,
    });
  }

  return fail(res, 404, '接口不存在');
}

// 统一错误响应：兜住被 next(err) 抛出的异常，形状与其他错误完全一致
function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  return fail(res, 500, '服务器错误');
}

module.exports = { notFound, errorHandler };
