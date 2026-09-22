const express = require('express');

// 账号与鉴权：注册、登录、邮箱验证、当前用户。
// 依赖全部通过参数注入（db 助手、jwt、密码封装、邮件、鉴权中间件），
// 本模块不再 require server.js 或 db.js，避免循环依赖。
module.exports = function createAuthRoutes(deps) {
  const {
    getDb, saveDatabase, getSingle, uuidv4,
    jwt, mailer, authenticateToken, ok, fail, asyncHandler,
    password: passwordLib,
  } = deps;
  const router = express.Router();

  router.post('/api/auth/send-register-code', asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;
      const db = getDb();

      if (!email) {
        return fail(res, 400, '请提供邮箱地址');
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

  router.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const db = getDb();

      if (!username || !password) {
        return fail(res, 400, '请输入用户名和密码');
      }

      const user = getSingle(db, 'SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
      if (!user) {
        return fail(res, 401, '用户名或密码错误');
      }

      const isPasswordValid = passwordLib.compare(password, user.password);
      if (!isPasswordValid) {
        return fail(res, 401, '用户名或密码错误');
      }

      if (user.status !== 'active') {
        return fail(res, 401, '账户未激活');
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role });

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

  router.post('/api/auth/register', asyncHandler(async (req, res) => {
    try {
      const { username, email, password, code } = req.body;
      const db = getDb();

      if (!username || !email || !password || !code) {
        return fail(res, 400, '请填写所有字段，包括验证码');
      }

      if (passwordLib.isTooShort(password)) {
        return fail(res, 400, '密码长度至少6位');
      }

      const existingUser = getSingle(db, 'SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
      if (existingUser) {
        return fail(res, 400, '用户名或邮箱已存在');
      }

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

      const newUserId = uuidv4();

      db.run(
        'INSERT INTO users (id, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [newUserId, username, email, passwordLib.hash(password), 'author', 'active']
      );

      db.run('DELETE FROM register_codes WHERE email = ?', [email]);
      saveDatabase();

      const token = jwt.sign({ id: newUserId, username, role: 'author' });

      ok(res, {
        message: '注册成功！',
        token,
        user: { id: newUserId, username, email, role: 'author', status: 'active' }
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  }));

  router.post('/api/auth/verify', (req, res) => {
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

  router.post('/api/auth/resend-verification', asyncHandler(async (req, res) => {
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

  router.get('/api/auth/me', authenticateToken, (req, res) => {
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