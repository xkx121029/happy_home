import { RouterProvider } from 'react-router-dom';
import AppProviders from './providers';
import ErrorBoundary from '../components/ErrorBoundary';
import { router } from '../routes/router';
import TutorialSystem from '../components/TutorialSystem';

/**
 * 应用根组件。
 *
 * 原 App.jsx 有 571 行：承载全部路由表、28 个在组件体内定义的 AdminXxx 组件、
 * 12 个包了 toast 的 useCallback 处理器、两个自建的确认/提示弹窗状态，
 * 以及一个永远不生效的定时发布定时器。
 *
 * 现在这里只做一件事：把 Router 放进 Provider 与错误边界里。
 * 路由在 routes/router.jsx，外壳在 layouts/，数据处理在各页面自己身上。
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
        {/* 引导教程是全局浮层，不参与路由 */}
        <TutorialSystem />
      </AppProviders>
    </ErrorBoundary>
  );
}