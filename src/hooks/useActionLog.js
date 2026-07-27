import { useCallback, useRef, useEffect } from 'react';

/**
 * 操作类型枚举
 */
export const ActionType = {
  // 数据操作
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  READ: 'read',
  
  // 认证操作
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  
  // 设置操作
  SETTINGS_UPDATE: 'settings_update',
  THEME_CHANGE: 'theme_change',
  
  // 上传操作
  UPLOAD: 'upload',
  DELETE_MEDIA: 'delete_media',
};

/**
 * 操作状态枚举
 */
export const ActionStatus = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  PARTIAL: 'partial', // 部分成功
};

/**
 * 操作日志Hook
 * 用于记录和追踪用户操作
 */
export function useActionLog(options = {}) {
  const {
    maxLogs = 100,        // 最多保存的日志数
    persistKey = null,     // 持久化到localStorage的key
    onAction = null,       // 操作回调
    includeTimestamp = true,
    includeUser = true,
  } = options;
  
  const logsRef = useRef([]);
  
  // 从localStorage恢复日志
  useEffect(() => {
    if (persistKey) {
      try {
        const stored = localStorage.getItem(persistKey);
        if (stored) {
          logsRef.current = JSON.parse(stored);
        }
      } catch (error) {
        console.error('[ActionLog] Failed to restore logs:', error);
      }
    }
  }, [persistKey]);
  
  // 保存日志到localStorage
  const persistLogs = useCallback((logs) => {
    if (persistKey) {
      try {
        localStorage.setItem(persistKey, JSON.stringify(logs));
      } catch (error) {
        console.error('[ActionLog] Failed to persist logs:', error);
      }
    }
  }, [persistKey]);
  
  /**
   * 记录操作
   */
  const logAction = useCallback((action, details = {}, status = ActionStatus.SUCCESS) => {
    let user = null;
    if (includeUser) {
      try {
        user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      } catch (error) {
        console.error('解析用户信息失败:', error);
        user = {};
      }
    }
    
    const logEntry = {
      id: Date.now() + Math.random(),
      action,
      details,
      status,
      timestamp: includeTimestamp ? new Date().toISOString() : null,
      user: user?.username || null,
      userId: user?.id || null,
      page: window.location.pathname,
    };
    
    // 添加到日志数组
    logsRef.current = [logEntry, ...logsRef.current].slice(0, maxLogs);
    
    // 持久化
    persistLogs(logsRef.current);
    
    // 调用回调
    if (onAction) {
      onAction(logEntry);
    }
    
    // 在开发环境打印
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ActionLog] ${status}:`, action, details);
    }
    
    return logEntry.id;
  }, [maxLogs, includeTimestamp, includeUser, persistLogs, onAction]);
  
  /**
   * 记录成功操作
   */
  const logSuccess = useCallback((action, details = {}) => {
    return logAction(action, details, ActionStatus.SUCCESS);
  }, [logAction]);
  
  /**
   * 记录失败操作
   */
  const logFailure = useCallback((action, details = {}, error = null) => {
    return logAction(action, { ...details, error: error?.message || String(error) }, ActionStatus.FAILED);
  }, [logAction]);
  
  /**
   * 记录待处理操作
   */
  const logPending = useCallback((action, details = {}) => {
    return logAction(action, details, ActionStatus.PENDING);
  }, [logAction]);
  
  /**
   * 获取所有日志
   */
  const getLogs = useCallback((filters = {}) => {
    let logs = [...logsRef.current];
    
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    
    if (filters.status) {
      logs = logs.filter(log => log.status === filters.status);
    }
    
    if (filters.user) {
      logs = logs.filter(log => log.user === filters.user);
    }
    
    if (filters.fromDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.fromDate));
    }
    
    if (filters.toDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.toDate));
    }
    
    return logs;
  }, []);
  
  /**
   * 获取最近的操作
   */
  const getRecentLogs = useCallback((count = 10) => {
    return logsRef.current.slice(0, count);
  }, []);
  
  /**
   * 按操作类型统计
   */
  const getStats = useCallback(() => {
    const stats = {
      total: logsRef.current.length,
      byAction: {},
      byStatus: {},
      byUser: {},
    };
    
    logsRef.current.forEach(log => {
      // byAction
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // byStatus
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
      
      // byUser
      if (log.user) {
        stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1;
      }
    });
    
    return stats;
  }, []);
  
  /**
   * 清除日志
   */
  const clearLogs = useCallback(() => {
    logsRef.current = [];
    persistLogs([]);
  }, [persistLogs]);
  
  /**
   * 删除指定日志
   */
  const deleteLog = useCallback((id) => {
    logsRef.current = logsRef.current.filter(log => log.id !== id);
    persistLogs(logsRef.current);
  }, [persistLogs]);
  
  /**
   * 导出日志
   */
  const exportLogs = useCallback((format = 'json') => {
    if (format === 'json') {
      return JSON.stringify(logsRef.current, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['id', 'action', 'status', 'user', 'timestamp', 'page', 'details'];
      const rows = logsRef.current.map(log => [
        log.id,
        log.action,
        log.status,
        log.user || '',
        log.timestamp || '',
        log.page || '',
        JSON.stringify(log.details || {}),
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return '';
  }, []);
  
  return {
    logs: logsRef.current,
    logAction,
    logSuccess,
    logFailure,
    logPending,
    getLogs,
    getRecentLogs,
    getStats,
    clearLogs,
    deleteLog,
    exportLogs,
    ActionType,
    ActionStatus,
  };
}

/**
 * 包装异步函数，自动记录操作
 */
export function withActionLogging(asyncFn, actionName, actionLog) {
  return async (...args) => {
    const logId = actionLog?.logPending?.(actionName, { args: args.map(a => 
      typeof a === 'object' ? JSON.stringify(a) : String(a)
    )});
    
    try {
      const result = await asyncFn(...args);
      actionLog?.logSuccess?.(actionName, { result: typeof result === 'object' ? '...' : result });
      return result;
    } catch (error) {
      actionLog?.logFailure?.(actionName, { args: args }, error);
      throw error;
    }
  };
}

/**
 * 错误到操作的转换
 * 将错误信息记录为操作日志
 */
export function logErrorAsAction(error, actionLog, context = {}) {
  const errorInfo = {
    message: error?.message || 'Unknown error',
    code: error?.code,
    status: error?.status,
    stack: error?.stack,
    ...context,
  };
  
  return actionLog?.logFailure?.('error', errorInfo, error);
}

export default useActionLog;
