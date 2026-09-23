const express = require('express');

// 菜单（menus）CRUD。items 以 JSON 字符串存在库里，出入库时序列化 / 解析。
module.exports = function createMenusRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, bindable, uuidv4, ok, fail, requireAccess, ROLE_CONTENT } = deps;
  const router = express.Router();

  router.get('/menus', requireAccess('menus:read', { roles: ROLE_CONTENT, anonymous: true }), (req, res) => {
    try {
      const db = getDb();
      const menus = execQuery(db, 'SELECT * FROM menus ORDER BY created_at DESC').map(menu => ({
        ...menu,
        items: menu.items ? JSON.parse(menu.items) : []
      }));
      ok(res, { data: menus, count: menus.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/menus', requireAccess('menus:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const { title, location, items } = req.body;
      const db = getDb();

      if (!title) {
        return fail(res, 400, '请输入菜单标题');
      }

      const newMenuId = uuidv4();
      db.run(
        'INSERT INTO menus (id, title, location, items) VALUES (?, ?, ?, ?)',
        [newMenuId, title, location || 'header', JSON.stringify(items || [])]
      );
      saveDatabase();

      const newMenu = getSingle(db, 'SELECT * FROM menus WHERE id = ?', [newMenuId]);
      ok(res, { message: '菜单创建成功', data: { ...newMenu, items: JSON.parse(newMenu.items || '[]') } }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/menus/:id', requireAccess('menus:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const { title, location, items } = req.body;
      const db = getDb();
      const menu = getSingle(db, 'SELECT * FROM menus WHERE id = ?', [req.params.id]);

      if (!menu) {
        return fail(res, 404, '菜单不存在');
      }

      db.run(
        // items 原本是 `items = ?` + `JSON.stringify(items || [])`：只要请求里没带 items
        // （例如只想改标题），就会把整个菜单项列表清空成 []。改为 COALESCE 后跳过未传字段。
        'UPDATE menus SET title = COALESCE(?, title), location = COALESCE(?, location), items = COALESCE(?, items), updated_at = datetime("now") WHERE id = ?',
        bindable([title, location, items === undefined ? undefined : JSON.stringify(items), req.params.id])
      );
      saveDatabase();

      const updatedMenu = getSingle(db, 'SELECT * FROM menus WHERE id = ?', [req.params.id]);
      ok(res, { message: '菜单更新成功', data: { ...updatedMenu, items: JSON.parse(updatedMenu.items || '[]') } });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/menus/:id', requireAccess('menus:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const db = getDb();
      const menu = getSingle(db, 'SELECT * FROM menus WHERE id = ?', [req.params.id]);
      if (!menu) {
        return fail(res, 404, '菜单不存在');
      }

      db.run('DELETE FROM menus WHERE id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '菜单删除成功', data: { ...menu, items: JSON.parse(menu.items || '[]') } });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};