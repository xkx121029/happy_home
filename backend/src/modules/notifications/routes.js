const express = require('express');

// 通知中心：列表 / 未读数 / 已读标记 / 删除 / 清空 / 演示数据
module.exports = function createNotificationsRoutes(deps) {
  const { getDb, saveDatabase, execQuery, getSingle, uuidv4, authenticateToken, ok, fail } = deps;
  const router = express.Router();

  router.get('/api/notifications', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const notifications = execQuery(
        db,
        'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50',
        [req.user.id]
      );
      const unreadCount = getSingle(
        db,
        'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0',
        [req.user.id]
      );
      ok(res, {
        notifications: notifications.map(n => ({ ...n, isRead: n.is_read === 1 })),
        unreadCount: unreadCount?.count || 0
      });
    } catch (error) {
      console.error(error);
      fail(res, 500, '获取通知失败');
    }
  });

  router.get('/api/notifications/unread', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const notifications = execQuery(
        db,
        'SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0 ORDER BY created_at DESC',
        [req.user.id]
      );
      ok(res, { notifications: notifications.map(n => ({ ...n, isRead: false })) });
    } catch (error) {
      console.error(error);
      fail(res, 500, '获取未读通知失败');
    }
  });

  router.get('/api/notifications/count', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      const result = getSingle(
        db,
        'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0',
        [req.user.id]
      );
      ok(res, { count: result?.count || 0 });
    } catch (error) {
      console.error(error);
      fail(res, 500, '获取未读数失败');
    }
  });

  router.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
      saveDatabase();
      ok(res, { message: '通知已标记为已读' });
    } catch (error) {
      console.error(error);
      // 原来这里返回 HTTP 200 + success:true，操作明明失败了前端却当成成功，
      // 用户点「标记已读」不会有任何提示，问题也被完全掩盖。
      fail(res, 500, '通知操作失败');
    }
  });

  router.put('/api/notifications/read-all', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL', [req.user.id]);
      saveDatabase();
      ok(res, { message: '所有通知已标记为已读' });
    } catch (error) {
      console.error(error);
      // 原来这里返回 HTTP 200 + success:true，操作明明失败了前端却当成成功，
      // 用户点「标记已读」不会有任何提示，问题也被完全掩盖。
      fail(res, 500, '通知操作失败');
    }
  });

  router.delete('/api/notifications/:id', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      db.run('DELETE FROM notifications WHERE id = ?', [req.params.id]);
      saveDatabase();
      ok(res, { message: '通知已删除' });
    } catch (error) {
      console.error(error);
      // 原来这里返回 HTTP 200 + success:true，操作明明失败了前端却当成成功，
      // 用户点「标记已读」不会有任何提示，问题也被完全掩盖。
      fail(res, 500, '通知操作失败');
    }
  });

  router.delete('/api/notifications/clear', authenticateToken, (req, res) => {
    try {
      const db = getDb();
      db.run('DELETE FROM notifications');
      saveDatabase();
      ok(res, { message: '所有通知已清空' });
    } catch (error) {
      console.error(error);
      // 原来这里返回 HTTP 200 + success:true，操作明明失败了前端却当成成功，
      // 用户点「标记已读」不会有任何提示，问题也被完全掩盖。
      fail(res, 500, '通知操作失败');
    }
  });

  // 创建通知的辅助函数（保留原实现，当前无调用点）
  // eslint-disable-next-line no-unused-vars -- 保留给后续模块调用，删掉会丢失实现
  function createNotification(userId, type, title, message, link = null) {
    try {
      const db = getDb();
      const id = uuidv4();
      db.run(
        'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, type, title, message, link]
      );
      saveDatabase();
      return { success: true, id };
    } catch (error) {
      console.error('创建通知失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 创建示例通知（用于演示）
  router.post('/api/notifications/demo', authenticateToken, (req, res) => {
    try {
      const demoNotifications = [
        { type: 'success', title: '系统启动成功', message: 'HappyHome 系统已成功启动并运行' },
        { type: 'post', title: '新文章发布', message: '文章《欢迎使用 HappyHome》已发布' },
        { type: 'comment', title: '新评论', message: '用户发表了新评论：非常棒的系统！' },
        { type: 'error', title: 'SMTP 配置提醒', message: '请配置 SMTP 以启用邮件发送功能' },
        { type: 'info', title: '数据库已更新', message: '数据库表结构已更新到最新版本' },
      ];

      const db = getDb();
      demoNotifications.forEach(notif => {
        const id = uuidv4();
        db.run(
          'INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
          [id, req.user.id, notif.type, notif.title, notif.message]
        );
      });
      saveDatabase();

      ok(res, { message: '示例通知已创建' });
    } catch (error) {
      console.error(error);
      fail(res, 500, '示例通知创建失败');
    }
  });

  return router;
};