const express = require('express');

// 部件（widgets）CRUD。enabled 以 0/1 存库、对外转成布尔，config 以 JSON 字符串存库。
module.exports = function createWidgetsRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, bindable, uuidv4, ok, fail, requireAccess, ROLE_CONTENT } = deps;
  const router = express.Router();

  router.get('/widgets', requireAccess('widgets:read', { roles: ROLE_CONTENT, anonymous: true }), (req, res) => {
    try {
      const db = getDb();
      let sql = 'SELECT * FROM widgets';
      const params = [];

      if (req.query.location) {
        sql += ' WHERE location = ?';
        params.push(req.query.location);
      }

      sql += ' ORDER BY order_num ASC';

      const widgets = execQuery(db, sql, params).map(w => ({
        ...w,
        enabled: w.enabled === 1,
        config: w.config ? JSON.parse(w.config) : {}
      }));

      ok(res, { data: widgets, count: widgets.length });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.post('/widgets', requireAccess('widgets:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const { name, type, location, config } = req.body;
      const db = getDb();

      if (!type) {
        return fail(res, 400, '请选择部件类型');
      }

      const newWidgetId = uuidv4();
      // location 未传时原样绑定 undefined 会让 sql.js 抛错，必须回退到默认值再查询
      const widgetLocation = location || 'sidebar';
      const maxOrder = execQuery(db, 'SELECT MAX(order_num) as max_order FROM widgets WHERE location = ?', [widgetLocation])[0]?.max_order || 0;

      db.run(
        'INSERT INTO widgets (id, name, type, location, order_num, config) VALUES (?, ?, ?, ?, ?, ?)',
        [newWidgetId, name || type, type, widgetLocation, maxOrder + 1, JSON.stringify(config || {})]
      );
      saveDatabase();

      const newWidget = getSingle(db, 'SELECT * FROM widgets WHERE id = ?', [newWidgetId]);
      ok(res, {
        message: '部件创建成功',
        data: { ...newWidget, enabled: newWidget.enabled === 1, config: JSON.parse(newWidget.config || '{}') }
      }, 201);
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.put('/widgets/:id', requireAccess('widgets:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const { name, enabled, config, location, order_num } = req.body;
      const db = getDb();
      const widget = getSingle(db, 'SELECT * FROM widgets WHERE id = ?', [req.params.id]);

      if (!widget) {
        return fail(res, 404, '部件不存在');
      }

      db.run(
        // config 原本是 `config = ?` + `JSON.stringify(config || widget.config)`：widget.config
        // 已是 JSON 字符串，会被二次编码。改为未传时跳过（COALESCE 保持原值）。
        // enabled 原本在未传时绑定 undefined，正是 toggleEnabled 类调用 500 的原因。
        'UPDATE widgets SET name = COALESCE(?, name), enabled = COALESCE(?, enabled), config = COALESCE(?, config), location = COALESCE(?, location), order_num = COALESCE(?, order_num) WHERE id = ?',
        bindable([name, enabled === undefined ? undefined : (enabled ? 1 : 0), config === undefined ? undefined : JSON.stringify(config), location, order_num, req.params.id])
      );
      saveDatabase();

      const updatedWidget = getSingle(db, 'SELECT * FROM widgets WHERE id = ?', [req.params.id]);
      ok(res, {
        message: '部件更新成功',
        data: { ...updatedWidget, enabled: updatedWidget.enabled === 1, config: JSON.parse(updatedWidget.config || '{}') }
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  router.delete('/widgets/:id', requireAccess('widgets:write', { roles: ROLE_CONTENT }), (req, res) => {
    try {
      const db = getDb();
      const widget = getSingle(db, 'SELECT * FROM widgets WHERE id = ?', [req.params.id]);
      if (!widget) {
        return fail(res, 404, '部件不存在');
      }

      db.run('DELETE FROM widgets WHERE id = ?', [req.params.id]);
      saveDatabase();

      ok(res, { message: '部件删除成功', data: widget });
    } catch (error) {
      console.error(error);
      fail(res, 500, '服务器错误');
    }
  });

  return router;
};