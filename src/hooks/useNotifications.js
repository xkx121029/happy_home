import { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../services/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationsAPI.getAll();
      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (err) {
      setError(err.message);
      console.error('获取通知失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取未读数量
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsAPI.getCount();
      if (response.success) {
        setUnreadCount(response.count || 0);
      }
    } catch (err) {
      console.error('获取未读数量失败:', err);
    }
  }, []);

  // 标记单个通知为已读
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  }, []);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('标记全部已读失败:', err);
    }
  }, []);

  // 删除通知
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationsAPI.delete(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('删除通知失败:', err);
    }
  }, [notifications]);

  // 添加新通知（用于实时推送）
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // 初始化：获取通知列表并设置轮询
  useEffect(() => {
    fetchNotifications();

    // 每30秒刷新一次通知
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
}
