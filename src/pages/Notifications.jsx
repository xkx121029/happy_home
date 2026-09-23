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
import { toneChip } from '../lib/tones';

const notificationTypeConfig = {
  register_request: { icon: UserPlus, tone: 'accent', label: '注册请求' },
  post_created: { icon: FileText, tone: 'success', label: '新文章' },
  comment: { icon: MessageSquare, tone: 'info', label: '新评论' },
  system: { icon: Server, tone: 'neutral', label: '系统日志' },
  error: { icon: AlertTriangle, tone: 'danger', label: '错误' },
  warning: { icon: AlertCircle, tone: 'warning', label: '警告' },
  info: { icon: Info, tone: 'info', label: '信息' },
  mail: { icon: Mail, tone: 'info', label: '邮件' },
  settings: { icon: Settings, tone: 'neutral', label: '设置' },
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
          <h1 className="text-2xl font-bold text-fg">通知中心</h1>
          <p className="text-muted mt-1">查看系统通知、用户活动和日志信息</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-surface-2 text-fg rounded-lg font-medium hover:bg-line transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium hover:bg-accent-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            全部已读
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-danger text-danger-fg rounded-lg font-medium hover:bg-danger transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-line">
        <div className="p-4 border-b border-line">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="搜索通知..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-line rounded-lg bg-surface  text-fg focus:outline-none focus:ring-2 focus:ring-accent"
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
              <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
              <p className="text-muted">加载中...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              {notifications.length === 0 ? (
                <>
                  <BellOff className="w-12 h-12 text-line mx-auto mb-4" />
                  <p className="text-muted">暂无通知</p>
                  <p className="text-sm text-muted mt-1">系统活动将在这里显示</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-line mx-auto mb-4" />
                  <p className="text-muted">没有找到匹配的通知</p>
                  <p className="text-sm text-muted mt-1">尝试使用不同的关键词搜索</p>
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
                    className={`p-4 rounded-xl border transition-all hover:shadow-sm${
                      notification.is_read
                        ? 'bg-bg  border-line'
                        : 'bg-surface border-accent/40'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0${toneChip(config.tone)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-fg">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-accent rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(notification.created_at)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs${toneChip(config.tone)}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="px-3 py-1 text-sm text-accent hover:bg-accent/12 rounded-lg transition-colors"
                              >
                                标记已读
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id, notification.title)}
                              className="px-3 py-1 text-sm text-danger hover:bg-danger/12 rounded-lg transition-colors"
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

      <div className="mt-6 bg-surface rounded-xl shadow-sm border border-line">
        <div className="p-4 border-b border-line">
          <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
            <Server className="w-5 h-5 text-muted" />
            系统日志摘要
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-accent/12  rounded-xl">
              <div className="text-2xl font-bold text-accent">
                {notifications.length}
              </div>
              <div className="text-sm text-muted mt-1">总通知数</div>
            </div>
            <div className="p-4 bg-success/12  rounded-xl">
              <div className="text-2xl font-bold text-success">
                {notifications.filter(n => n.is_read).length}
              </div>
              <div className="text-sm text-muted mt-1">已读</div>
            </div>
            <div className="p-4 bg-warning/14  rounded-xl">
              <div className="text-2xl font-bold text-warning">
                {notifications.filter(n => !n.is_read).length}
              </div>
              <div className="text-sm text-muted mt-1">未读</div>
            </div>
            <div className="p-4 bg-danger/12  rounded-xl">
              <div className="text-2xl font-bold text-danger">
                {notifications.filter(n => n.type === 'error').length}
              </div>
              <div className="text-sm text-muted mt-1">错误日志</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-surface rounded-xl shadow-sm border border-line">
        <div className="p-4 border-b border-line">
          <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted" />
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
                  className={`px-4 py-2 rounded-lg flex items-center gap-2${toneChip(config.tone)}`}
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