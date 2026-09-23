const express = require('express');

// 站点设置（settings）：读取所有人可见，写入仅管理员
module.exports = function createSettingsRoutes(deps) {
  const { dbHelpers, ok, fail, requireAccess, ROLE_ADMIN_ONLY, ROLE_ANY } = deps;
  const router = express.Router();

  router.get('/settings', requireAccess('settings:read', { roles: ROLE_ANY, anonymous: true }), (req, res) => {
    try {
      const settings = dbHelpers.getSettings();
      ok(res, { data: settings });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/settings', requireAccess('settings:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      dbHelpers.updateSettings(req.body);
      const settings = dbHelpers.getSettings();
      ok(res, { message: '设置更新成功', data: settings });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};