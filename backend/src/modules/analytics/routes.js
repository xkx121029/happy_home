const express = require('express');

// 访问统计。当前 stats 返回的是演示数据（随机数），track 只记日志。
module.exports = function createAnalyticsRoutes(deps) {
  const { ok, fail, requireAccess, ROLE_ANY, checkCommentRate } = deps;
  const router = express.Router();

  router.get('/analytics/stats', requireAccess('analytics:read', { roles: ROLE_ANY }), (req, res) => {
    try {
      const now = new Date();

      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 200) + 50,
        });
      }

      const todayCount = dailyData[dailyData.length - 1]?.count || 0;
      const weekCount = dailyData.reduce((sum, day) => sum + day.count, 0);
      const monthCount = weekCount * 4;
      const trend = Math.floor((Math.random() - 0.5) * 20);

      ok(res, {
        data: {
          today: todayCount,
          week: weekCount,
          month: monthCount,
          total: Math.floor(weekCount * 15),
          trend,
          dailyData,
        },
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/analytics/track', requireAccess('analytics:write', { anonymous: true }), (req, res) => {
    try {
      // 这是唯一一个匿名可写的端点，且请求体直接进日志。不限流的话
      // 任何人都能靠它把日志刷爆、把磁盘写满。计数器与评论限流共用一套
      // 实现（同一个 Map，靠 key 前缀分命名空间），业务上互不影响。
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      if (!checkCommentRate(`analytics:ip:${ip}`).allowed) {
        return fail(res, 429, '上报过于频繁，请稍后再试');
      }

      const { type, data } = req.body;
      console.log('Analytics track:', type, data);
      ok(res, { message: '数据已记录' });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};