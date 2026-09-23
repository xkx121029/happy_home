import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, CheckCircle, AlertCircle, Info, AlertTriangle,
  RefreshCw, Trash2, ChevronRight, Loader2, Wifi, WifiOff
} from 'lucide-react';

/**
 * 通知类型枚举
 */
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading',
  NETWORK: 'network',
};

/**
 * 通知配置
 */
const notificationConfig = {
  defaultDuration: 4000,
  maxNotifications: 5,
  position: 'top-right', // top-right, top-center, top-left, bottom-right, bottom-center, bottom-left
  stacking: true, // 新通知堆叠在旧通知上面
};

/**
 * 通知图标映射
 */
const notificationIcons = {
  [NotificationType.SUCCESS]: CheckCircle,
  [NotificationType.ERROR]: AlertCircle,
  [NotificationType.WARNING]: AlertTriangle,
  [NotificationType.INFO]: Info,
  [NotificationType.LOADING]: Loader2,
  [NotificationType.NETWORK]: Wifi,
};

/**
 * 通知颜色配置
 */
const notificationColors = {
  [NotificationType.SUCCESS]: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-700',
    icon: 'text-green-500',
    text: 'text-green-800 dark:text-green-200',
    progress: 'bg-green-500',
  },
  [NotificationType.ERROR]: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-700',
    icon: 'text-red-500',
    text: 'text-red-800 dark:text-red-200',
    progress: 'bg-red-500',
  },
  [NotificationType.WARNING]: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-700',
    icon: 'text-yellow-500',
    text: 'text-yellow-800 dark:text-yellow-200',
    progress: 'bg-yellow-500',
  },
  [NotificationType.INFO]: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-700',
    icon: 'text-blue-500',
    text: 'text-blue-800 dark:text-blue-200',
    progress: 'bg-blue-500',
  },
  [NotificationType.LOADING]: {
    bg: 'bg-gray-50 dark:bg-gray-800/30',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'text-blue-500',
    text: 'text-gray-800 dark:text-gray-200',
    progress: 'bg-blue-500 animate-pulse',
  },
  [NotificationType.NETWORK]: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-700',
    icon: 'text-orange-500',
    text: 'text-orange-800 dark:text-orange-200',
    progress: 'bg-orange-500',
  },
};

/**
 * 单个通知组件
 */
function NotificationItem({ notification, onClose, onAction }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  
  const { id, type, message, title, duration, actions, dismissible = true } = notification;
  const colors = notificationColors[type] || notificationColors[NotificationType.INFO];
  const Icon = notificationIcons[type] || Info;
  
  // 进度条动画
  useEffect(() => {
    if (type === NotificationType.LOADING || duration === 0) {
      // 加载状态不显示进度条
      return;
    }
    
    const effectiveDuration = duration || notificationConfig.defaultDuration;
    startTimeRef.current = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / effectiveDuration) * 100);
      setProgress(remaining);
      
      if (remaining > 0) {
        timerRef.current = requestAnimationFrame(updateProgress);
      }
    };
    
    timerRef.current = requestAnimationFrame(updateProgress);
    
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [type, duration]);
  
  // 自动关闭
  useEffect(() => {
    if (type === NotificationType.LOADING || duration === 0) {
      return;
    }
    
    const effectiveDuration = duration || notificationConfig.defaultDuration;
    const timeout = setTimeout(() => {
      handleClose();
    }, effectiveDuration);
    
    return () => clearTimeout(timeout);
  }, [type, duration]);
  
  // 清理closeTimeoutRef
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);
  
  const handleClose = useCallback(() => {
    setIsExiting(true);
    closeTimeoutRef.current = setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);
  
  const handleAction = useCallback((action) => {
    if (action.onClick) {
      action.onClick();
    }
    if (action.closeOnClick !== false) {
      handleClose();
    }
    if (onAction) {
      onAction(id, action);
    }
  }, [id, onAction, handleClose]);
  
  return (
    <div
      className={`
        relative w-80 overflow-hidden rounded-lg shadow-lg border${colors.bg} ${colors.border}
        ${isExiting ? 'opacity-0' : 'opacity-100'}
      `}
      style={{ transition: 'opacity 180ms var(--ease-entry)' }}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 图标 */}
          <div className={`flex-shrink-0${colors.icon}`}>
            {type === NotificationType.LOADING ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>
          
          {/* 内容 */}
          <div className="flex-1 min-w-0">
            {title && (
              <p className={`font-semibold text-sm${colors.text}`}>
                {title}
              </p>
            )}
            <p className={`text-sm${colors.text} ${title ? 'mt-1' : ''}`}>
              {message}
            </p>
            
            {/* 操作按钮 */}
            {actions && actions.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleAction(action)}
                    className={`
                      text-sm font-medium px-3 py-1 rounded-lg transition-colors${action.dangerous 
                        ? 'bg-danger/12  text-danger hover:bg-danger/12'
                        : 'bg-accent/12  text-accent hover:bg-accent/12'
                      }
                    `}
                  >
                    {action.icon && <action.icon className="w-3 h-3 inline mr-1" />}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 关闭按钮 */}
          {dismissible && (
            <button
              onClick={handleClose}
              className={`flex-shrink-0 p-1 rounded-lg hover:bg-fg/5 transition-colors${colors.icon}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* 进度条 */}
      {type !== NotificationType.LOADING && duration !== 0 && (
        <div className="h-1 w-full bg-fg/5">
          <div
            className={`h-full${colors.progress} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 通知容器组件
 */
export function NotificationContainer({ notifications, onClose, onAction }) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
  };
  
  return (
    <div
      className={`fixed z-[9999]${positionStyles[notificationConfig.position]} space-y-3`}
      aria-live="polite"
    >
      {notifications.slice(0, notificationConfig.maxNotifications).map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={onClose}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

/**
 * 全局通知Hook
 */
export function useNotification() {
  const [notifications, setNotifications] = useState([]);
  
  // 添加通知
  const addNotification = useCallback((options) => {
    const notification = {
      id: Date.now() + Math.random(),
      type: NotificationType.INFO,
      duration: notificationConfig.defaultDuration,
      dismissible: true,
      ...options,
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, notificationConfig.maxNotifications));
    
    return notification.id;
  }, []);
  
  // 移除通知
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  // 清除所有通知
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // 快捷方法
  const success = useCallback((message, options = {}) => {
    return addNotification({ type: NotificationType.SUCCESS, message, ...options });
  }, [addNotification]);
  
  const error = useCallback((message, options = {}) => {
    return addNotification({ type: NotificationType.ERROR, message, duration: 6000, ...options });
  }, [addNotification]);
  
  const warning = useCallback((message, options = {}) => {
    return addNotification({ type: NotificationType.WARNING, message, ...options });
  }, [addNotification]);
  
  const info = useCallback((message, options = {}) => {
    return addNotification({ type: NotificationType.INFO, message, ...options });
  }, [addNotification]);
  
  const loading = useCallback((message, options = {}) => {
    return addNotification({ type: NotificationType.LOADING, message, duration: 0, ...options });
  }, [addNotification]);
  
  const network = useCallback((message, options = {}) => {
    return addNotification({ type: NotificationType.NETWORK, message, duration: 0, ...options });
  }, [addNotification]);
  
  // 更新通知
  const updateNotification = useCallback((id, updates) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates } : n
    ));
  }, []);
  
  // 替换通知（保持位置）
  const replaceNotification = useCallback((oldId, newNotification) => {
    setNotifications(prev => {
      const index = prev.findIndex(n => n.id === oldId);
      if (index === -1) return prev;
      
      const newNotif = {
        id: Date.now(),
        duration: notificationConfig.defaultDuration,
        dismissible: true,
        ...newNotification,
      };
      
      const updated = [...prev];
      updated[index] = newNotif;
      return updated;
    });
  }, []);
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    updateNotification,
    replaceNotification,
    success,
    error,
    warning,
    info,
    loading,
    network,
  };
}

/**
 * 全局通知提供者（需要在App顶层使用）
 */
export function NotificationProvider({ children }) {
  const {
    notifications,
    removeNotification,
    addNotification,
  } = useNotification();
  
  // 监听全局通知事件
  useEffect(() => {
    const handleNotification = (event) => {
      const { message, type, ...options } = event.detail;
      addNotification({ message, type, ...options });
    };
    
    window.addEventListener('app:notification', handleNotification);
    return () => window.removeEventListener('app:notification', handleNotification);
  }, [addNotification]);
  
  return (
    <>
      {children}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </>
  );
}

/**
 * 带操作按钮的错误通知组件
 */
export function ErrorToast({ 
  id, 
  title = '操作失败', 
  message, 
  error,
  onRetry,
  onDismiss,
  actions = [] 
}) {
  const defaultActions = [];
  
  if (onRetry) {
    defaultActions.push({
      label: '重试',
      icon: RefreshCw,
      onClick: onRetry,
      dangerous: false,
    });
  }
  
  if (error?.details?.originalError && import.meta.env.DEV) {
    defaultActions.push({
      label: '查看详情',
      icon: ChevronRight,
      onClick: () => console.error('[ErrorToast]', error),
      dangerous: false,
    });
  }
  
  const allActions = [...defaultActions, ...actions];
  
  return (
    <NotificationItem
      notification={{
        id,
        type: NotificationType.ERROR,
        title,
        message: message || error?.message || '发生了一个错误',
        actions: allActions,
        duration: 0, // 错误通知不自动关闭
      }}
      onClose={onDismiss}
    />
  );
}

/**
 * 网络状态通知组件
 */
export function NetworkStatusNotification({ isOnline }) {
  const { network, removeNotification } = useNotification();
  const notificationIdRef = useRef(null);
  
  useEffect(() => {
    if (!isOnline) {
      notificationIdRef.current = network('网络连接已断开，某些功能可能不可用', {
        type: NotificationType.NETWORK,
        duration: 0,
      });
    } else if (notificationIdRef.current) {
      removeNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, [isOnline, network, removeNotification]);
  
  return null;
}

/**
 * 全局错误模态框组件
 */
export function GlobalErrorModal({ isOpen, error, onClose, onRetry }) {
  if (!isOpen || !error) return null;
  
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        <div className="w-16 h-16 bg-danger/12  rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-danger" />
        </div>
        
        <h3 className="text-xl font-bold text-fg text-center mb-2">
          {error.title || '发生错误'}
        </h3>
        
        <p className="text-muted  text-center mb-6">
          {error.message || '一个意外的错误发生了'}
        </p>
        
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-3 bg-accent hover:bg-accent-700 text-accent-fg rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-surface-2 hover:bg-line text-fg rounded-xl font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationContainer;
