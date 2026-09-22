import { createContext, useContext, useState, useEffect } from 'react';

/**
 * 全局网络状态。
 *
 * 只负责一件事：把浏览器的 online/offline 事件收敛成一处状态，
 * 避免每个组件各注册一遍监听。
 *
 * 原先还有一套「离线操作队列」的计数与同步接口（pendingCount /
 * updatePendingCount / syncOfflineRequests），但整套机制从未真正工作过
 * （键名不一致 + 只清队不重发），已随 enhancedApi 一并删除。
 */
const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
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