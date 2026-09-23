const express = require('express');

// 访问统计。当前 stats 返回的是演示数据（随机数），track 只记日志。
module.exports = function createAnalyticsRoutes(deps) {
  const { authenticateToken, ok, fail } = deps;
  const router = express.Router();

  router.get('/api/analytics/stats', authenticateToken, (req, res) => {
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

  router.post('/api/analytics/track', authenticateToken, (req, res) => {
    try {
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