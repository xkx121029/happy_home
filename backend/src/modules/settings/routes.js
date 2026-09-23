const express = require('express');
const { pickSettings } = require('../../lib/settingKeys');

// 站点设置（settings）：读取按身份裁剪，写入仅管理员
module.exports = function createSettingsRoutes(deps) {
  const { dbHelpers, ok, fail, requireAccess, ROLE_ADMIN_ONLY, ROLE_ANY } = deps;
  const router = express.Router();

  router.get('/settings', requireAccess('settings:read', { roles: ROLE_ANY, anonymous: true }), (req, res) => {
    try {
      const all = dbHelpers.getSettings();
      // 匿名与角色不够的登录用户只拿到前台白名单；管理员拿全量；
      // 其余登录用户拿全量但剔除 SMTP 凭据。
      // 改造前这里是直接返回原始设置，author 角色就能读到 smtpPass。
      ok(res, {
        data: pickSettings(all, {
          isPublic: req.auth.level === 'public',
          isAdmin: req.auth.role === 'administrator',
        }),
      });
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