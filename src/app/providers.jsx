import { NetworkProvider } from '../contexts/NetworkContext';
import { ErrorProvider } from '../contexts/ErrorContext';
import { NotificationProvider } from '../components/Notification';
import { DataProvider } from '../contexts/DataContext';
import { ThemeProvider } from '../state/ThemeContext';
import { AuthProvider } from '../state/AuthContext';
import { SiteSettingsProvider } from '../state/SiteSettingsContext';

/**
 * Provider 组合。顺序敏感，集中在这里而不是散在 App 里的嵌套 JSX。
 *
 * 依赖关系决定了顺序：
 *   ThemeProvider      最外层，主题影响所有 UI
 *   AuthProvider       认证是其它状态的前提（决定拉哪些数据）
 *   SiteSettingsProvider 依赖认证 —— 已登录读完整设置，访客只读公开字段
 *   NetworkProvider / ErrorProvider / NotificationProvider  平级的全局反馈
 *   DataProvider       最内层，依赖认证状态决定加载范围
 */
export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteSettingsProvider>
          <NetworkProvider>
            <ErrorProvider>
              <NotificationProvider>
                <DataProvider>
                  {children}
                </DataProvider>
              </NotificationProvider>
            </ErrorProvider>
          </NetworkProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}