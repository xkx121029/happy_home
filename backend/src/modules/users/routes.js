const express = require('express');

// 用户管理。除「查看本人资料」外均要求管理员角色。
module.exports = function createUsersRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, uuidv4, ok, fail, password: passwordLib, requireAccess, ROLE_ADMIN_ONLY, ROLE_ANY } = deps;
  const router = express.Router();

  router.get('/users', requireAccess('users:read', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const db = getDb();
      const users = execQuery(db, 'SELECT id, username, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC');
      ok(res, { data: users, count: users.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.get('/users/:id', requireAccess('users:read', { roles: ROLE_ANY }), (req, res) => {
    try {
      const db = getDb();
      // 原来只校验了登录，任何用户都能用 id 遍历出他人的资料。
      // 这里限制为「本人或管理员」，管理员判定直接查库而不信 token 里的角色。
      const requester = getSingle(db, 'SELECT role FROM users WHERE id = ?', [req.user.id]);
      if (req.user.id !== req.params.id && requester?.role !== 'administrator') {
        return fail(res, 403, '权限不足');
      }
      const user = getSingle(db, 'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?', [req.params.id]);
      if (!user) {
        return fail(res, 404, '用户不存在');
      }
      ok(res, { data: user });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/users', requireAccess('users:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const { username, email, password, role, status } = req.body;
      const db = getDb();

      if (!username || !email || !password) {
        return fail(res, 400, '请填写用户名、邮箱和密码');
      }

      if (passwordLib.isTooShort(password)) {
        return fail(res, 400, '密码长度至少6位');
      }

      const existingUser = getSingle(db, 'SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
      if (existingUser) {
        return fail(res, 400, '用户名或邮箱已存在');
      }

      const newUserId = uuidv4();
      db.run(
        'INSERT INTO users (id, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [newUserId, username, email, passwordLib.hash(password), role || 'author', status || 'active']
      );
      saveDatabase();

      const newUser = getSingle(db, 'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?', [newUserId]);
      ok(res, { message: '用户创建成功', data: newUser }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/users/:id', requireAccess('users:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const { username, email, password, role, status } = req.body;
      const db = getDb();
      const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [req.params.id]);

      if (!user) {
        return fail(res, 404, '用户不存在');
      }

      if (password && passwordLib.isTooShort(password)) {
        return fail(res, 400, '密码长度至少6位');
      }

      const updates = [username || user.username, email || user.email, role || user.role, status || user.status];
      let sql = 'UPDATE users SET username = ?, email = ?, role = ?, status = ?, updated_at = datetime("now")';

      if (password) {
        sql += ', password = ?';
        updates.push(passwordLib.hash(password));
      }

      sql += ' WHERE id = ?';
      updates.push(req.params.id);

      db.run(sql, updates);
      saveDatabase();

      const updatedUser = getSingle(db, 'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?', [req.params.id]);
      ok(res, { message: '用户更新成功', data: updatedUser });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/users/:id', requireAccess('users:write', { roles: ROLE_ADMIN_ONLY }), (req, res) => {
    try {
      const db = getDb();
      const user = getSingle(db, 'SELECT * FROM users WHERE id = ?', [req.params.id]);
      if (!user) {
        return fail(res, 404, '用户不存在');
      }

      if (user.role === 'administrator') {
        return fail(res, 400, '不能删除管理员账户');
      }

      db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '用户删除成功', data: user });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};