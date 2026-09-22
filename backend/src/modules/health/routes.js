const express = require('express');

// 健康检查：唯一一个无需鉴权的探活端点
module.exports = function createHealthRoutes(deps) {
  const { ok } = deps;
  const router = express.Router();

  router.get('/api/health', (req, res) => {
    ok(res, { message: 'API 运行正常', timestamp: new Date().toISOString() });
  });

  return router;
};