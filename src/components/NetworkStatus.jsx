import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetwork } from '../contexts/NetworkContext';

/**
 * 离线提示横幅。
 *
 * 原实现围绕一个「离线操作队列」展开：离线时的写操作入队，网络恢复后自动重放。
 * 但那套东西从来没真正工作过 ——
 *   - 入队用的键是 happyhome_offline_queue（services/enhancedApi.js），
 *     而读取与清空用的是 offline_queue 与 happyhome_offline_queue（ErrorContext.jsx），
 *     键名对不上，队列读出来永远是空的；
 *   - NetworkContext 的「同步」只是把队列删掉，不重发任何请求；
 *   - 组件里的重放逻辑是个只打印日志的空桩。
 * 也就是说它给了一个「已同步」的假象，实际数据全丢。
 *
 * 与其保留一个会骗人的功能，不如只做它真正能做到的事：
 * 如实告知当前网络不可用，让用户自己决定要不要重试。
 * 提交按钮在离线时由各页面自行禁用（见各表单页的 isOnline 判断）。
 */
export default function NetworkStatusBanner() {
  const { isOnline } = useNetwork();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // 断网时立刻显示
      setVisible(true);
      return undefined;
    }
    // 恢复联网后短暂提示，然后自动收起
    if (!visible) return undefined;
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [isOnline, visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={`fixed top-0 left-0 right-0 z-[9998]${
        isOnline ? 'bg-success text-success-fg' : 'bg-warning text-warning-fg'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {isOnline ? '网络已恢复' : '网络连接已断开，暂时无法保存修改'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-sm px-2 transition-opacity duration-100 opacity-80 hover:opacity-100"
        >
          知道了
        </button>
      </div>
    </div>
  );
}