import { RouterProvider } from 'react-router-dom';
import AppProviders from './providers';
import ErrorBoundary from '../components/ErrorBoundary';
import { router } from '../routes/router';

/**
 * 应用根组件。
 *
 * 原 App.jsx 有 571 行：承载全部路由表、28 个在组件体内定义的 AdminXxx 组件、
 * 12 个包了 toast 的 useCallback 处理器、两个自建的确认/提示弹窗状态，
 * 以及一个永远不生效的定时发布定时器。
 *
 * 现在这里只做一件事：把 Router 放进 Provider 与错误边界里。
 * 路由在 routes/router.jsx，外壳在 layouts/，数据处理在各页面自己身上。
 *
 * 全局浮层（引导教程、离线横幅）不能写在这层 —— 它们在 Router 之外，
 * 一调用 useNavigate 就崩。它们现在挂在路由树最外层的 RootLayout 里。
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}