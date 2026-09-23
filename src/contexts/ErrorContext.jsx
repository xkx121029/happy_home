import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from './NetworkContext';

/**
 * 错误类型枚举
 */
export const ErrorType = {
  // 网络相关
  NETWORK_ERROR: 'network_error',           // 网络连接失败
  NETWORK_TIMEOUT: 'network_timeout',        // 网络请求超时
  NETWORK_OFFLINE: 'network_offline',       // 离线状态
  
  // 认证相关
  AUTH_UNAUTHORIZED: 'auth_unauthorized',   // 未授权（401）
  AUTH_FORBIDDEN: 'auth_forbidden',           // 权限不足（403）
  AUTH_TOKEN_EXPIRED: 'auth_token_expired',  // Token过期
  
  // 业务相关
  VALIDATION_ERROR: 'validation_error',      // 数据验证失败
  BUSINESS_ERROR: 'business_error',           // 业务逻辑错误
  NOT_FOUND: 'not_found',                    // 资源不存在（404）
  
  // 系统相关
  SERVER_ERROR: 'server_error',              // 服务器错误（500）
  UNKNOWN_ERROR: 'unknown_error',             // 未知错误
};

/**
 * 错误严重程度
 */
export const ErrorSeverity = {
  INFO: 'info',         // 仅提示，不影响操作
  WARNING: 'warning',   // 警告，可能影响部分功能
  ERROR: 'error',       // 错误，操作失败
  CRITICAL: 'critical', // 严重错误，可能导致应用不可用
};

/**
 * 初始状态
 */
const initialState = {
  // 当前活跃的错误队列
  errors: [],
  
  // 全局加载状态
  globalLoading: false,
  loadingMessage: '',
  
  // 网络状态
  isOnline: navigator.onLine,
  
  // 错误统计
  errorStats: {
    total: 0,
    networkErrors: 0,
    authErrors: 0,
    serverErrors: 0,
  },
  
  // 是否显示全局错误模态框
  showErrorModal: false,
  currentError: null,
};

/**
 * Action 类型
 */
const ActionType = {
  // 添加错误
  ADD_ERROR: 'ADD_ERROR',
  
  // 移除错误
  REMOVE_ERROR: 'REMOVE_ERROR',
  
  // 清除所有错误
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  
  // 设置全局加载
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',
  
  // 设置网络状态
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  
  // 显示错误模态框
  SHOW_ERROR_MODAL: 'SHOW_ERROR_MODAL',
  
  // 隐藏错误模态框
  HIDE_ERROR_MODAL: 'HIDE_ERROR_MODAL',
  
  // 更新错误统计
  UPDATE_ERROR_STATS: 'UPDATE_ERROR_STATS',
};

/**
 * 错误 reducer
 */
function errorReducer(state, action) {
  switch (action.type) {
    case ActionType.ADD_ERROR: {
      const error = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        errors: [error, ...state.errors].slice(0, 50), // 最多保留50条错误记录
        errorStats: {
          ...state.errorStats,
          total: state.errorStats.total + 1,
          [`${action.payload.type}s`]: (state.errorStats[`${action.payload.type}s`] || 0) + 1,
        },
      };
    }
    
    case ActionType.REMOVE_ERROR:
      return {
        ...state,
        errors: state.errors.filter(e => e.id !== action.payload.id),
      };
    
    case ActionType.CLEAR_ERRORS:
      return {
        ...state,
        errors: [],
      };
    
    case ActionType.SET_GLOBAL_LOADING:
      return {
        ...state,
        globalLoading: action.payload.loading,
        loadingMessage: action.payload.message || '',
      };
    
    case ActionType.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload.isOnline,
      };
    
    case ActionType.SHOW_ERROR_MODAL:
      return {
        ...state,
        showErrorModal: true,
        currentError: action.payload.error,
      };
    
    case ActionType.HIDE_ERROR_MODAL:
      return {
        ...state,
        showErrorModal: false,
        currentError: null,
      };
    
    case ActionType.UPDATE_ERROR_STATS:
      return {
        ...state,
        errorStats: {
          ...state.errorStats,
          ...action.payload,
        },
      };
    
    default:
      return state;
  }
}

/**
 * 创建错误对象
 */
function createError(type, message, details = {}, severity = ErrorSeverity.ERROR) {
  return {
    type,
    message,
    details,
    severity,
  };
}

/**
 * 错误上下文
 */
const ErrorContext = createContext(null);

/**
 * 错误提供者组件
 */
export function ErrorProvider({ children }) {
  const [state, dispatch] = useReducer(errorReducer, initialState);
  const errorQueueRef = useRef([]); // 待处理错误队列
  const { isOnline } = useNetwork(); // 使用统一的网络状态

  // 监听网络状态变化（从 NetworkContext 获取）
  useEffect(() => {
    dispatch({ type: ActionType.SET_ONLINE_STATUS, payload: { isOnline } });
  }, [isOnline]);

  // 原来这里还有一个 processOfflineQueue：网络恢复时遍历 localStorage 里的离线队列
  // 逐个"重放"。但重放的代码是注释掉的空桩，两个键名还互相对不上
  // （写用 happyhome_offline_queue，读用 offline_queue），最后无条件删掉队列 ——
  // 结果是静静地丢弃用户的离线操作并假装已同步。整套机制已删除。

  // 添加错误
  const addError = useCallback((error) => {
    const errorObj = typeof error === 'string' 
      ? createError(ErrorType.UNKNOWN_ERROR, error)
      : error;
    
    dispatch({ type: ActionType.ADD_ERROR, payload: errorObj });
    
    // 根据严重程度处理
    if (errorObj.severity === ErrorSeverity.CRITICAL) {
      dispatch({ type: ActionType.SHOW_ERROR_MODAL, payload: { error: errorObj } });
    }
    
    return errorObj.id;
  }, []);
  
  // 移除错误
  const removeError = useCallback((id) => {
    dispatch({ type: ActionType.REMOVE_ERROR, payload: { id } });
  }, []);
  
  // 清除所有错误
  const clearErrors = useCallback(() => {
    dispatch({ type: ActionType.CLEAR_ERRORS });
  }, []);
  
  // 设置全局加载状态
  const setGlobalLoading = useCallback((loading, message = '') => {
    dispatch({ type: ActionType.SET_GLOBAL_LOADING, payload: { loading, message } });
  }, []);
  
  // 处理网络错误
  const handleNetworkError = useCallback((error, retryFn = null) => {
    const errorObj = createError(
      ErrorType.NETWORK_ERROR,
      '网络连接失败，请检查您的网络设置',
      { originalError: error.message },
      ErrorSeverity.ERROR
    );
    
    const errorId = addError(errorObj);
    
    if (retryFn) {
      errorQueueRef.current.push({ id: errorId, retryFn });
    }
    
    return errorId;
  }, [addError]);
  
  // 处理认证错误
  const handleAuthError = useCallback((status) => {
    let type, message, severity;

    switch (status) {
      case 401:
        type = ErrorType.AUTH_UNAUTHORIZED;
        message = '登录已过期，请重新登录';
        severity = ErrorSeverity.WARNING;
        // 原来这里用 window.location.href 硬跳转到 /unauthorized：
        // 整页重载会丢掉所有内存状态，用户还会在重新登录后回到首页而不是原页面。
        // 401 的处理已经收敛到两处 —— lib/http.js 清掉失效 token，
        // 路由守卫 RequireAuth 检测到未登录后跳登录页并记住来路。这里不再插手导航。
        break;
      case 403:
        type = ErrorType.AUTH_FORBIDDEN;
        message = '您没有权限执行此操作';
        severity = ErrorSeverity.WARNING;
        break;
      default:
        type = ErrorType.AUTH_UNAUTHORIZED;
        message = '认证失败，请重新登录';
        severity = ErrorSeverity.WARNING;
    }

    const errorObj = createError(type, message, { status }, severity);
    addError(errorObj);

    return errorObj.id;
  }, [addError]);
  
  // 处理业务错误
  const handleBusinessError = useCallback((message, details = {}) => {
    const errorObj = createError(
      ErrorType.BUSINESS_ERROR,
      message,
      details,
      ErrorSeverity.WARNING
    );
    return addError(errorObj);
  }, [addError]);
  
  // 处理服务器错误
  const handleServerError = useCallback((error) => {
    const errorObj = createError(
      ErrorType.SERVER_ERROR,
      '服务器出现了一些问题，请稍后重试',
      { originalError: error.message },
      ErrorSeverity.ERROR
    );
    return addError(errorObj);
  }, [addError]);
  
  // 处理验证错误
  const handleValidationError = useCallback((errors) => {
    const messages = Array.isArray(errors) 
      ? errors.join('；')
      : typeof errors === 'object' 
        ? Object.values(errors).flat().join('；')
        : errors;
    
    const errorObj = createError(
      ErrorType.VALIDATION_ERROR,
      messages || '数据验证失败',
      { errors },
      ErrorSeverity.WARNING
    );
    return addError(errorObj);
  }, [addError]);
  
  // 重试操作
  const retryOperation = useCallback((errorId) => {
    const item = errorQueueRef.current.find(e => e.id === errorId);
    if (item?.retryFn) {
      removeError(errorId);
      return item.retryFn();
    }
    return Promise.resolve();
  }, [removeError]);
  
  // 关闭错误模态框
  const hideErrorModal = useCallback(() => {
    dispatch({ type: ActionType.HIDE_ERROR_MODAL });
  }, []);
  
  // 错误提示（轻量级，非模态框）
  const notify = useCallback((message, type = 'info', options = {}) => {
    // 这个函数由 Notification 系统调用
    // 实际的通知显示由 NotificationProvider 处理
    const notification = {
      id: Date.now(),
      message,
      type, // info, success, warning, error
      ...options,
    };
    
    // 广播给 Notification 系统
    window.dispatchEvent(new CustomEvent('app:notification', { detail: notification }));
    
    return notification.id;
  }, []);
  
  // 记录操作日志
  const logAction = useCallback((action, details = {}) => {
    let user = {};
    try {
      user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    } catch (error) {
      console.error('解析用户信息失败:', error);
      user = {};
    }
    
    const log = {
      action,
      details,
      timestamp: new Date().toISOString(),
      user,
    };
    
    // 在开发环境打印
    if (import.meta.env.DEV) {
      console.log('[ActionLog]', log);
    }
    
    // 可以发送到服务器
    // fetch('/api/logs/action', { method: 'POST', body: JSON.stringify(log) });
  }, []);
  
  const value = {
    // 状态
    errors: state.errors,
    globalLoading: state.globalLoading,
    loadingMessage: state.loadingMessage,
    isOnline: state.isOnline,
    errorStats: state.errorStats,
    showErrorModal: state.showErrorModal,
    currentError: state.currentError,
    
    // 方法
    addError,
    removeError,
    clearErrors,
    setGlobalLoading,
    handleNetworkError,
    handleAuthError,
    handleBusinessError,
    handleServerError,
    handleValidationError,
    retryOperation,
    hideErrorModal,
    notify,
    logAction,
    
    // 错误类型
    ErrorType,
    ErrorSeverity,
  };
  
  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

/**
 * 使用错误上下文
 */
export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

/**
 * HOC - 为组件提供错误处理能力
 */
export function withErrorHandler(Component, _errorHandler) {
  return function ErrorHandledComponent(props) {
    const error = useError();
    return <Component {...props} error={error} />;
  };
}

/**
 * 高阶函数 - 包装异步函数自动处理错误
 */
export function withAsyncErrorHandler(asyncFn, errorHandler) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (typeof errorHandler === 'function') {
        errorHandler(error);
      }
      throw error;
    }
  };
}

export default ErrorContext;
