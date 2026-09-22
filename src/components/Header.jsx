import {
  Search, Bell, User, Sun, Moon, LogOut, Check, Trash2,
  Info, AlertCircle, CheckCircle, MessageSquare, FileText, Plus,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { notificationsAPI } from '../services/api';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../state/ThemeContext';
import { formatDate } from '../lib/format';
import { ADMIN_PATHS } from '../routes/paths';
import Modal from './Modal';

/**
 * 后台顶栏。
 *
 * 相比原实现的三处修正：
 * 1. 亮暗模式改为从 ThemeContext 取（原来靠 App.jsx 传 props，
 *    并且是第二套互相打架的机制）。
 * 2. 当前用户改为从 Context 取。原来读的是 localStorage 的 currentUser 键，
 *    但全项目没有任何地方写这个键，于是右上角永远显示兜底的 "admin"。
 * 3. 退出登录走 Context 的 logout。原来只清了 localStorage 标记、
 *    没清 token 也没通知 Context，导致退出后其他页面仍以为自己已登录。
 */
export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { currentUser, logout } = useData();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();

  // 点击面板外部关闭
  const handleClickOutside = useCallback((event) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (!showNotifications) return undefined;
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, handleClickOutside]);

  const handleSearch = (e) => {
    e.preventDefault();
    const keyword = searchQuery.trim();
    if (!keyword) return;
    // 带上关键词，原来的搜索框只是跳转到文章列表，输入的内容被丢掉了
    navigate(`${ADMIN_PATHS.posts}?q=${encodeURIComponent(keyword)}`);
  };

  const confirmLogout = async () => {
    setLogoutConfirm(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const createDemoNotifications = async () => {
    setCreatingDemo(true);
    try {
      await notificationsAPI.createDemo();
      fetchNotifications();
    } catch (error) {
      console.error('创建示例通知失败:', error);
    } finally {
      setCreatingDemo(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-danger" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-info" />;
      case 'post':
        return <FileText className="w-5 h-5 text-accent" />;
      default:
        return <Info className="w-5 h-5 text-muted" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const roleLabel = {
    administrator: '管理员',
    editor: '编辑',
    author: '作者',
  }[currentUser?.role] || '未登录';

  return (
    <>
      <header className="bg-surface border-b border-line sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-8">
            <Link to={ADMIN_PATHS.root} className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-accent text-accent-fg grid place-items-center font-semibold text-sm">
                H
              </span>
              <span className="text-lg font-semibold text-fg">HappyHome</span>
            </Link>

            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="搜索文章、页面..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-surface-2 border border-line rounded-lg text-sm text-fg placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors duration-100 active:scale-[0.97]"
              title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => {
                  const next = !showNotifications;
                  setShowNotifications(next);
                  if (next) fetchNotifications();
                }}
                className="relative p-2 text-muted hover:text-fg hover:bg-surface-2 rounded-lg transition-colors duration-100 active:scale-[0.97]"
                title="通知"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[11px] font-semibold rounded-full grid place-items-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-surface rounded-xl shadow-lg border border-line overflow-hidden z-50">
                  <div className="flex items-center justify-between p-4 border-b border-line">
                    <h3 className="font-semibold text-fg">通知</h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs text-accent hover:opacity-80 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        全部已读
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto scrollbar-thin">
                    {loading ? (
                      <div className="p-8 text-center text-sm text-muted">加载中...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted mb-4">暂无通知</p>
                        <button
                          type="button"
                          onClick={createDemoNotifications}
                          disabled={creatingDemo}
                          className="px-4 py-2 bg-accent text-accent-fg rounded-lg text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2 active:scale-[0.97]"
                        >
                          <Plus className="w-4 h-4" />
                          {creatingDemo ? '生成中...' : '生成示例通知'}
                        </button>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-line last:border-0 hover:bg-surface-2 cursor-pointer transition-colors duration-100 ${
                            !notification.isRead ? 'bg-accent-50/60' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.isRead ? 'font-semibold text-fg' : 'text-fg/80'}`}>
                                {notification.title}
                              </p>
                              {notification.message && (
                                <p className="text-xs text-muted mt-1 truncate">
                                  {notification.message}
                                </p>
                              )}
                              {/* 字段名是 createdAt（后端 created_at 已由 api 层规整），
                                  原来读的 created_at 取不到值，时间永远显示 Invalid Date */}
                              <p className="text-xs text-muted/70 mt-1">
                                {formatDate(notification.createdAt, { style: 'datetime' })}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 text-muted hover:text-danger rounded transition-colors duration-100"
                              title="删除通知"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 ml-2 border-l border-line">
              <div className="w-8 h-8 bg-accent-100 rounded-full grid place-items-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-fg leading-tight">
                  {currentUser?.username || '—'}
                </p>
                <p className="text-xs text-muted leading-tight">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setLogoutConfirm(true)}
                className="ml-1 p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors duration-100 active:scale-[0.97]"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <Modal
        isOpen={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        title="确认退出"
        message="确定要退出登录吗？"
        type="confirm"
        onConfirm={confirmLogout}
      />
    </>
  );
}