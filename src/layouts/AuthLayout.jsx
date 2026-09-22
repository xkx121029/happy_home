import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../state/ThemeContext';
import { PUBLIC_PATHS } from '../routes/paths';

/**
 * 登录 / 忘记密码 / 重置密码 共用的居中卡片外壳。
 *
 * 这三个页面原本各自把「整屏居中 + 品牌块 + 卡片」写了一遍，
 * 布局细节还不一致（有的垂直居中、有的顶部留白不同）。
 */
export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <Link to={PUBLIC_PATHS.home} className="flex items-center gap-2 text-fg">
          <span className="w-8 h-8 rounded-lg bg-accent text-accent-fg grid place-items-center font-semibold">
            H
          </span>
          <span className="font-semibold">HappyHome</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="text-sm text-muted hover:text-fg px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors duration-100"
        >
          {theme === 'dark' ? '切换亮色' : '切换暗色'}
        </button>
      </header>

      <main className="flex-1 grid place-items-center px-6 pb-16">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}