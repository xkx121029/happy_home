const express = require('express');

// 账号与鉴权：注册、登录、邮箱验证、当前用户。
// 依赖全部通过参数注入（db 助手、jwt、密码封装、邮件、鉴权中间件），
// 本模块不再 require server.js 或 db.js，避免循环依赖。
module.exports = function createAuthRoutes(deps) {
  const { getDb, saveDatabase, getSingle, uuidv4, dbHelpers, jwt, mailer, ok, fail, asyncHandler, password: passwordLib, checkLoginRate, recordLoginFailure, clearLoginFailures, requireAccess, ROLE_ANY } = deps;
  const router = express.Router();

  router.post('/auth/send-register-code', asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;
      const db = getDb();

      if (!email) {
        return fail(res, 400, '请提供邮箱地址');
      }

      // 注册已关闭时不必浪费一封邮件，也不该给探测者留下「邮箱已注册」的信号
      if (dbHelpers.getSettings().registrationEnabled === false) {
        return fail(res, 403, '本站当前未开放注册');
      }

      const existingUser = getSingle(db, 'SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return fail(res, 400, '该邮箱已被注册');
      }

      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.run(
        'INSERT OR REPLACE INTO register_codes (email, code, expires_at) VALUES (?, ?, ?)',
        [email, verificationCode, expiresAt]
      );
      saveDatabase();

      let mailSent = false;

      try {
        const result = await mailer.sendVerificationEmail(email, '用户', verificationCode);
        if (result.success) {
          mailSent = true;
          console.log(`注册验证码已发送到 ${email}`);
        } else {
          console.warn('发送验证邮件失败:', result.message);
        }
      } catch (mailError) {
        console.warn('发送验证邮件失败:', mailError.message);
      }

      db.run(
        'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), null, 'register_request', '新用户注册请求', `用户请求注册，邮箱：${email}，邮件发送：${mailSent ? '成功' : '失败'}`, '/admin/users']
      );
      saveDatabase();

      if (!mailSent) {
        return fail(res, 500, '邮件发送失败，请稍后重试或联系管理员');
      }

      ok(res, {
        message: '验证码已发送到您的邮箱，请在10分钟内完成注册',
        email
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  }));

  router.post('/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const db = getDb();

      if (!username || !password) {
        return fail(res, 400, '请输入用户名和密码');
      }

      // 登录失败限流。阈值来自「安全」页的 loginLimit（0 表示不限制）。
      // 按「来源 IP + 用户名」计数：只按 IP 会让同一局域网的人互相牵连，
      // 只按用户名则无法阻挡轮换用户名的撞库。
      const settings = dbHelpers.getSettings();
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const rateKey = `login:${ip}:${String(username).toLowerCase()}`;

      if (!checkLoginRate(rateKey, settings.loginLimit).allowed) {
        return fail(res, 429, '登录尝试过于频繁，请 10 分钟后再试');
      }

      const user = getSingle(db, 'SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
      if (!user) {
        recordLoginFailure(rateKey);
        return fail(res, 401, '用户名或密码错误');
      }

      const isPasswordValid = passwordLib.compare(password, user.password);
      if (!isPasswordValid) {
        recordLoginFailure(rateKey);
        return fail(res, 401, '用户名或密码错误');
      }

      if (user.status !== 'active') {
        recordLoginFailure(rateKey);
        return fail(res, 401, '账户未激活');
      }

      // 登录成功即清零，否则用户手滑几次之后再输对也会被锁
      clearLoginFailures(rateKey);

      // 有效期来自「安全」页的 sessionTimeout；未配置时沿用环境变量
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        settings.sessionTimeout
      );

      ok(res, {
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/auth/register', asyncHandler(async (req, res) => {
    try {
      const { username, email, password, code } = req.body;
      const db = getDb();
      const settings = dbHelpers.getSettings();

      // 该键此前从未被读取，注册一直是开放的；迁移 3 已把历史库里的 'false'
      // 修正为 'true'，所以这里用 === false 判断，缺省即视为开放。
      if (settings.registrationEnabled === false) {
        return fail(res, 403, '本站当前未开放注册');
      }

      const requireCode = settings.emailVerification !== false;

      if (!username || !email || !password || (requireCode && !code)) {
        return fail(res, 400, requireCode ? '请填写所有字段，包括验证码' : '请填写用户名、邮箱和密码');
      }

      if (passwordLib.isTooShort(password)) {
        return fail(res, 400, '密码长度至少6位');
      }

      const existingUser = getSingle(db, 'SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
      if (existingUser) {
        return fail(res, 400, '用户名或邮箱已存在');
      }

      if (requireCode) {
        const registerCode = getSingle(db, 'SELECT * FROM register_codes WHERE email = ?', [email]);
        if (!registerCode) {
          return fail(res, 400, '请先获取验证码');
        }

        if (registerCode.code !== code.toUpperCase()) {
          return fail(res, 400, '验证码错误');
        }

        if (new Date(registerCode.expires_at) < new Date()) {
          db.run('DELETE FROM register_codes WHERE email = ?', [email]);
          saveDatabase();
          return fail(res, 400, '验证码已过期，请重新获取');
        }
      }

      const newUserId = uuidv4();
      // 角色来自「用户」页的 defaultRole，原来写死 'author'
      const role = settings.defaultRole || 'author';

      db.run(
        'INSERT INTO users (id, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [newUserId, username, email, passwordLib.hash(password), role, 'active']
      );

      db.run('DELETE FROM register_codes WHERE email = ?', [email]);
      saveDatabase();

      const token = jwt.sign({ id: newUserId, username, role }, settings.sessionTimeout);

      ok(res, {
        message: '注册成功！',
        token,
        user: { id: newUserId, username, email, role, status: 'active' }
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  }));

  router.post('/auth/verify', (req, res) => {
    try {
      const { userId, code } = req.body;
      const db = getDb();

      if (!userId || !code) {
        return fail(res, 400, '请提供用户ID和验证码');
      }

      const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        return fail(res, 404, '用户不存在');
      }

      if (user.status === 'active') {
        return fail(res, 400, '用户已验证');
      }

      if (user.verification_code !== code.toUpperCase()) {
        return fail(res, 400, '验证码错误');
      }

      if (new Date(user.verification_expires) < new Date()) {
        return fail(res, 400, '验证码已过期，请重新获取');
      }

      db.run('UPDATE users SET status = ?, verification_code = NULL, verification_expires = NULL WHERE id = ?', ['active', userId]);
      saveDatabase();

      const token = jwt.sign({ id: userId, username: user.username, role: user.role });

      ok(res, {
        message: '邮箱验证成功！',
        token,
        user: { id: userId, username: user.username, email: user.email, role: user.role, status: 'active' }
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/auth/resend-verification', asyncHandler(async (req, res) => {
    try {
      const { userId } = req.body;
      const db = getDb();

      if (!userId) {
        return fail(res, 400, '请提供用户ID');
      }

      const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        return fail(res, 404, '用户不存在');
      }

      if (user.status === 'active') {
        return fail(res, 400, '用户已验证');
      }

      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.run('UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?', [verificationCode, expiresAt, userId]);
      saveDatabase();

      try {
        await mailer.sendVerificationEmail(user.email, user.username, verificationCode);
        console.log(`验证邮件已重新发送到 ${user.email}`);
      } catch (mailError) {
        console.warn('发送验证邮件失败:', mailError.message);
      }

      ok(res, {
        message: '验证邮件已重新发送，请查收邮箱'
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  }));

  router.get('/auth/me', requireAccess('users:read', { roles: ROLE_ANY, allowKey: false }), (req, res) => {
    try {
      const db = getDb();
      const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (!user) {
        return fail(res, 404, '用户不存在');
      }

      ok(res, {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};