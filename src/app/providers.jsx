import { NetworkProvider } from '../contexts/NetworkContext';
import { ErrorProvider } from '../contexts/ErrorContext';
import { NotificationProvider } from '../components/Notification';
import { DataProvider } from '../contexts/DataContext';
import { ThemeProvider } from '../state/ThemeContext';

/**
 * Provider 组合。顺序敏感，集中在这里而不是散在 App 里的嵌套 JSX。
 *
 * 顺序约束：
 *   ThemeProvider 最外层 —— 主题影响所有 UI，且其他 Provider 内部可能用到；
 *   ErrorProvider 在 NotificationProvider 之前 —— 错误上报会调用通知；
 *   DataProvider 最内层 —— 它依赖其它 Provider 提供的状态（如网络状态）。
 */
export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <ErrorProvider>
          <NotificationProvider>
            <DataProvider>
              {children}
            </DataProvider>
          </NotificationProvider>
        </ErrorProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}