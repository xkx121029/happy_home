import { 
  AlertCircle, RefreshCw, Home, ChevronRight, 
  FileQuestion, Search, Wifi, WifiOff, Loader2
} from 'lucide-react';

/**
 * 加载状态组件 - 骨架屏和加载动画
 */
export function LoadingState({ 
  type = 'spinner', // 'spinner' | 'skeleton' | 'progress'
  message = '加载中...',
  fullPage = false,
  skeletonRows = 5,
  progress,
}) {
  const containerClass = fullPage 
    ? 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'
    : 'flex items-center justify-center py-12';
  
  if (type === 'skeleton') {
    return (
      <div className={containerClass}>
        <div className="w-full max-w-4xl px-4 space-y-4">
          {/* 头部骨架 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
          
          {/* 内容骨架 */}
          {[...Array(skeletonRows)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded animate-pulse w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded animate-pulse w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (type === 'progress') {
    return (
      <div className={containerClass}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - (progress || 0) / 100)}
                strokeLinecap="round"
                className="text-blue-500 transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
              {progress || 0}%
            </span>
          </div>
          {message && (
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          )}
        </div>
      </div>
    );
  }
  
  // 默认 spinner
  return (
    <div className={containerClass}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
        {message && (
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * 错误状态组件
 */
export function ErrorState({
  title = '加载失败',
  message = '数据加载失败了，请稍后重试',
  error,
  onRetry,
  onGoHome,
  showDetails = false,
  fullPage = false,
  actions,
}) {
  const containerClass = fullPage 
    ? 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4'
    : 'py-12 px-4';
  
  return (
    <div className={containerClass}>
      <div className={`${fullPage ? '' : 'max-w-md mx-auto'} text-center`}>
        {/* 错误图标 */}
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        {/* 标题和消息 */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        {/* 技术详情（仅开发环境） */}
        {showDetails && process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-40 overflow-auto">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.stack || error.message || String(error)}
            </p>
          </div>
        )}
        
        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          )}
          
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              返回首页
            </button>
          )}
          
          {/* 自定义操作 */}
          {actions}
        </div>
      </div>
    </div>
  );
}

/**
 * 空状态组件
 */
export function EmptyState({
  icon: Icon = FileQuestion,
  title = '暂无数据',
  message = '这里还没有任何内容',
  action,
  actionLabel,
  actionIcon: ActionIcon = ChevronRight,
  fullPage = false,
}) {
  const containerClass = fullPage 
    ? 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'
    : 'py-12';
  
  return (
    <div className={containerClass}>
      <div className="text-center max-w-md mx-auto px-4">
        {/* 空状态图标 */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Icon className="w-12 h-12 text-gray-400" />
        </div>
        
        {/* 标题和消息 */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        {/* 操作按钮 */}
        {action && (
          <button
            onClick={action}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {actionLabel || '创建'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 网络错误状态组件
 */
export function NetworkErrorState({
  isOnline,
  onRetry,
  pendingCount = 0,
  fullPage = false,
}) {
  const containerClass = fullPage 
    ? 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4'
    : 'py-12 px-4';
  
  return (
    <div className={containerClass}>
      <div className="text-center max-w-md mx-auto">
        {/* 网络图标 */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
          isOnline 
            ? 'bg-green-100 dark:bg-green-900/30' 
            : 'bg-orange-100 dark:bg-orange-900/30'
        }`}>
          {isOnline ? (
            <Wifi className="w-10 h-10 text-green-500" />
          ) : (
            <WifiOff className="w-10 h-10 text-orange-500" />
          )}
        </div>
        
        {/* 标题和消息 */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {isOnline ? '网络已恢复' : '网络连接中断'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {isOnline 
            ? '您可以继续之前的操作了' 
            : '请检查您的网络连接，某些功能可能不可用'
          }
        </p>
        
        {/* 待处理的离线操作 */}
        {pendingCount > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              有 <span className="font-bold">{pendingCount}</span> 个操作正在等待网络恢复后同步
            </p>
          </div>
        )}
        
        {/* 操作按钮 */}
        {onRetry && isOnline && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        )}
        
        {!isOnline && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            网络恢复后将自动重试
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 搜索无结果组件
 */
export function NoSearchResults({ query, onClear, totalResults = 0 }) {
  return (
    <div className="py-12 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Search className="w-10 h-10 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          未找到"{query}"
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {totalResults > 0 
            ? `找到了 ${totalResults} 个结果，但没有匹配的 "${query}"`
            : `没有找到与 "${query}" 相关的内容`
          }
        </p>
        
        {onClear && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
          >
            清除搜索
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 页面不可用状态（如维护中）
 */
export function PageUnavailable({
  title = '页面维护中',
  message = '该功能正在进行维护，请稍后再试',
  estimatedTime,
  contactEmail,
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-yellow-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        {estimatedTime && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            预计恢复时间：{estimatedTime}
          </p>
        )}
        
        {contactEmail && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            如有问题请联系：<a href={`mailto:${contactEmail}`} className="text-blue-500 hover:underline">{contactEmail}</a>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 表单错误提示组件
 */
export function FormError({ error, field }) {
  if (!error) return null;
  
  const message = typeof error === 'string' 
    ? error 
    : error[field] || error.message || '请检查输入';
  
  return (
    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}

/**
 * 权限不足组件
 */
export function PermissionDenied({ 
  requiredRole, 
  onGoBack,
  onRequestAccess,
}) {
  return (
    <div className="py-12 px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          权限不足
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {requiredRole 
            ? `您需要 ${requiredRole} 权限才能访问此功能`
            : '您没有权限访问此页面'
          }
        </p>
        
        <div className="flex gap-3 justify-center">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
            >
              返回
            </button>
          )}
          
          {onRequestAccess && (
            <button
              onClick={onRequestAccess}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              申请权限
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default {
  LoadingState,
  ErrorState,
  EmptyState,
  NetworkErrorState,
  NoSearchResults,
  PageUnavailable,
  FormError,
  PermissionDenied,
};
