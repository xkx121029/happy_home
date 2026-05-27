import { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Trash2, 
  Clock,
  Filter,
  Search,
  RefreshCw,
  Mail,
  UserPlus,
  FileText,
  Settings,
  Server,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { useModal, useToast } from '../hooks/useModal';
import { useData } from '../contexts/DataContext';
import { notificationsAPI } from '../services/api';

const notificationTypeConfig = {
  register_request: { icon: UserPlus, color: 'bg-blue-100 text-blue-700', label: '注册请求' },
  post_created: { icon: FileText, color: 'bg-green-100 text-green-700', label: '新文章' },
  comment: { icon: MessageSquare, color: 'bg-purple-100 text-purple-700', label: '新评论' },
  system: { icon: Server, color: 'bg-gray-100 text-gray-700', label: '系统日志' },
  error: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: '错误' },
  warning: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-700', label: '警告' },
  info: { icon: Info, color: 'bg-blue-100 text-blue-700', label: '信息' },
  mail: { icon: Mail, color: 'bg-cyan-100 text-cyan-700', label: '邮件' },
  settings: { icon: Settings, color: 'bg-indigo-100 text-indigo-700', label: '设置' },
};

export default function Notifications() {
  const { confirm, isOpen: isModalOpen, modalConfig, closeModal } = useModal();
  const { showToast, isOpen: isToastOpen, toastConfig, closeToast } = useToast();
  const { notifications, getNotifications, markNotificationAsRead, deleteNotification } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      await getNotifications();
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadNotifications();
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      showToast('已标记为已读', 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    const confirmed = await confirm({
      title: '确认删除',
      message: `确定要删除这条通知吗？`,
    });
    if (confirmed) {
      try {
        await deleteNotification(id);
        showToast('删除成功', 'success');
      } catch (error) {
        showToast('删除失败', 'error');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      await getNotifications();
      showToast('已全部标记为已读', 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: '确认清空',
      message: '确定要清空所有通知吗？此操作不可撤销。',
    });
    if (confirmed) {
      try {
        await notificationsAPI.clearAll();
        await getNotifications();
        showToast('已清空所有通知', 'success');
      } catch (error) {
        showToast('操作失败', 'error');
      }
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || notif.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleString('zh-CN');
  };

  const types = ['all', ...new Set(notifications.map(n => n.type))];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">通知中心</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">查看系统通知、用户活动和日志信息</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            全部已读
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索通知..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部类型</option>
                {types.filter(t => t !== 'all').map(type => (
                  <option key={type} value={type}>
                    {notificationTypeConfig[type]?.label || type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              {notifications.length === 0 ? (
                <>
                  <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">暂无通知</p>
                  <p className="text-sm text-gray-400 mt-1">系统活动将在这里显示</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">没有找到匹配的通知</p>
                  <p className="text-sm text-gray-400 mt-1">尝试使用不同的关键词搜索</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notification => {
                const config = notificationTypeConfig[notification.type] || notificationTypeConfig.info;
                const Icon = config.icon;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                      notification.is_read
                        ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'
                        : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(notification.created_at)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                标记已读
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id, notification.title)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-500" />
            系统日志摘要
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {notifications.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">总通知数</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {notifications.filter(n => n.is_read).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">已读</div>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {notifications.filter(n => !n.is_read).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">未读</div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {notifications.filter(n => n.type === 'error').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">错误日志</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-500" />
            通知类型统计
          </h2>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {types.filter(t => t !== 'all').map(type => {
              const config = notificationTypeConfig[type] || notificationTypeConfig.info;
              const count = notifications.filter(n => n.type === type).length;
              if (count === 0) return null;
              return (
                <div
                  key={type}
                  className={`px-4 py-2 rounded-lg ${config.color} flex items-center gap-2`}
                >
                  {config.label}: {count}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}