const express = require('express');

// SMTP 与邮箱验证码相关端点。
// 验证码存储在这里（内存中，生产环境应使用 Redis）。
module.exports = function createSmtpRoutes(deps) {
  const {
    getDb, saveDatabase, getSingle,
    authenticateToken, requireRole, ok, fail, asyncHandler, mailer,
    password: passwordLib,
  } = deps;
  const router = express.Router();

  // 验证码存储（内存中，生产环境应使用 Redis）
  const verificationCodes = new Map();

  router.post('/api/auth/send-verification-code', asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return fail(res, 400, '请输入邮箱地址');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail(res, 400, '请输入有效的邮箱地址');
      }

      const db = getDb();
      const user = getSingle(db, 'SELECT * FROM users WHERE email = ?', [email]);

      if (!user) {
        return fail(res, 404, '该邮箱未注册');
      }

      // 生成6位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 保存验证码，有效期10分钟
      verificationCodes.set(email, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      const result = await mailer.sendVerificationCode(email, code);

      if (result.success) {
        ok(res, { message: '验证码已发送' });
      } else {
        fail(res, 500, result.message);
      }
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  }));

  router.post('/api/auth/verify-code', (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return fail(res, 400, '请输入邮箱和验证码');
      }

      const storedCode = verificationCodes.get(email);

      if (!storedCode) {
        return fail(res, 400, '请先获取验证码');
      }

      if (Date.now() > storedCode.expiresAt) {
        verificationCodes.delete(email);
        return fail(res, 400, '验证码已过期');
      }

      if (storedCode.code !== code) {
        return fail(res, 400, '验证码不正确');
      }

      // 验证成功，删除验证码
      verificationCodes.delete(email);

      ok(res, { message: '验证成功' });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api/auth/reset-password', (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return fail(res, 400, '请填写所有字段');
      }

      if (passwordLib.isTooShort(newPassword)) {
        return fail(res, 400, '密码长度至少6位');
      }

      const storedCode = verificationCodes.get(email);

      if (!storedCode) {
        return fail(res, 400, '请先获取验证码');
      }

      if (Date.now() > storedCode.expiresAt) {
        verificationCodes.delete(email);
        return fail(res, 400, '验证码已过期');
      }

      if (storedCode.code !== code) {
        return fail(res, 400, '验证码不正确');
      }

      const db = getDb();
      db.run(
        'UPDATE users SET password = ?, updated_at = datetime("now") WHERE email = ?',
        [passwordLib.hash(newPassword), email]
      );
      saveDatabase();

      verificationCodes.delete(email);

      ok(res, { message: '密码重置成功' });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/api/smtp/test', authenticateToken, requireRole('administrator'), asyncHandler(async (req, res) => {
    try {
      const { useSavedConfig = true, testConfig } = req.body;

      let result;
      if (useSavedConfig || !testConfig) {
        result = await mailer.testConnection();
      } else {
        result = await mailer.testConnectionWithConfig(testConfig);
      }
      res.json(result);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  }));

  router.post('/api/smtp/refresh', authenticateToken, requireRole('administrator'), (req, res) => {
    try {
      mailer.createTransporter();
      ok(res, { message: 'SMTP 配置已刷新' });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};