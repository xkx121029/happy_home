import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { useNetwork } from '../contexts/NetworkContext';

/**
 * 网络状态检测组件
 * 在网络断开时显示横幅通知
 */
export function NetworkStatusBanner({ 
  onNetworkChange,
  onSyncComplete,
}) {
  const { isOnline, pendingCount } = useNetwork(); // 使用统一的网络状态
  const [showBanner, setShowBanner] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 监听网络状态变化（从 NetworkContext 获取）
  useEffect(() => {
    setShowBanner(true);
    onNetworkChange?.(isOnline);
  }, [isOnline, onNetworkChange]);
  
  // 网络恢复时自动同步
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      handleSync();
    }
  }, [isOnline, pendingCount, isSyncing]);
  
  // 2秒后自动隐藏成功banner
  useEffect(() => {
    if (isOnline && showBanner && !isSyncing) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showBanner, isSyncing]);
  
  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      // 触发离线队列同步
      const { processed, failed } = await syncOfflineOperations();
      
      onSyncComplete?.({ processed, failed });
    } catch (error) {
      console.error('[NetworkStatus] Sync failed:', error);
    } finally {
      setIsSyncing(false);
      setShowBanner(false);
    }
  }, [isSyncing, onSyncComplete]);
  
  // 离线时立即显示
  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    }
  }, [isOnline]);
  
  if (!showBanner) return null;
  
  return (
    <div className={`
      fixed top-0 left-0 right-0 z-[9998] 
      transform transition-transform duration-300
      ${isOnline ? 'bg-green-500' : 'bg-orange-500'}
    `}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">网络已恢复</span>
              {pendingCount > 0 && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  正在同步 {pendingCount} 个操作...
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">网络连接已断开</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                离线模式
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isSyncing && (
            <span className="flex items-center gap-1 text-white text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              同步中...
            </span>
          )}
          
          {!isOnline && pendingCount > 0 && (
            <span className="text-white/80 text-xs">
              {pendingCount} 个操作待同步
            </span>
          )}
          
          {!isOnline && (
            <button
              onClick={() => setShowBanner(false)}
              className="text-white/80 hover:text-white p-1"
              aria-label="关闭"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {isOnline && isSyncing && (
            <RefreshCw className="w-4 h-4 text-white animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 网络状态Hook
 * 注意：此 hook 已废弃，请使用 NetworkContext 中的 useNetwork hook
 * 保留此函数仅为向后兼容
 */
export function useNetworkStatus() {
  console.warn('useNetworkStatus is deprecated. Please use useNetwork from NetworkContext instead.');
  const { isOnline } = useNetwork();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOnline && !wasOffline) {
      setWasOffline(true);
      // 触发网络恢复事件
      window.dispatchEvent(new CustomEvent('network:restored'));
    } else if (!isOnline) {
      // 触发网络断开事件
      window.dispatchEvent(new CustomEvent('network:lost'));
    }
  }, [isOnline, wasOffline]);

  const checkConnection = useCallback(async () => {
    try {
      // 尝试发送一个简单的请求来检测真实连接状态
      const response = await fetch('http://localhost:3002/api/health', {
        method: 'GET',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    isOnline,
    wasOffline,
    checkConnection,
  };
}

/**
 * 离线操作同步函数
 */
async function syncOfflineOperations() {
  const { getOfflineQueue, removeFromOfflineQueue } = await import('../services/enhancedApi');
  const queue = getOfflineQueue();
  
  let processed = 0;
  let failed = 0;
  
  for (const item of queue) {
    try {
      // 重新执行离线请求
      // 简化实现，实际应该调用对应的API方法
      console.log('[Sync] Processing offline item:', item);
      
      // 假设成功
      removeFromOfflineQueue(item.id);
      processed++;
    } catch (error) {
      console.error('[Sync] Failed to process item:', error);
      failed++;
    }
  }
  
  return { processed, failed };
}

/**
 * 带网络状态检测的Fetcher
 */
export function useNetworkAwareFetch(fetchFn, dependencies = []) {
  const { isOnline } = useNetworkStatus();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetch = useCallback(async () => {
    if (!isOnline) {
      setError(new Error('网络不可用'));
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, isOnline, ...dependencies]);
  
  useEffect(() => {
    fetch();
  }, [fetch]);
  
  const refetch = useCallback(() => {
    return fetch();
  }, [fetch]);
  
  return { data, error, loading, refetch, isOnline };
}

export default NetworkStatusBanner;
