import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * 网络状态上下文
 * 统一管理整个应用的网络状态，避免重复监听
 */
const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  // 统一的网络状态监听器（只注册一次）
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // 只在这里注册全局监听器
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 加载待处理的离线请求计数
  useEffect(() => {
    try {
      const queue = JSON.parse(localStorage.getItem('happyhome_offline_queue') || '[]');
      setPendingCount(queue.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  // 更新待处理计数的方法
  const updatePendingCount = useCallback((count) => {
    setPendingCount(count);
  }, []);

  // 同步离线请求的方法
  const syncOfflineRequests = useCallback(async () => {
    if (!isOnline || pendingCount === 0) return;

    try {
      const queue = JSON.parse(localStorage.getItem('happyhome_offline_queue') || '[]');
      localStorage.removeItem('happyhome_offline_queue');
      setPendingCount(0);
      
      return { success: true, synced: queue.length };
    } catch (error) {
      console.error('同步离线请求失败:', error);
      return { success: false, error: error.message };
    }
  }, [isOnline, pendingCount]);

  const value = {
    isOnline,
    pendingCount,
    updatePendingCount,
    syncOfflineRequests,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}