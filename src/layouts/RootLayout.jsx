import { Outlet } from 'react-router-dom';
import NetworkStatusBanner from '../components/NetworkStatus';
import TutorialSystem from '../components/TutorialSystem';

/**
 * 最外层路由布局：只承载「所有页面都要有、且需要路由上下文」的全局浮层。
 *
 * 原来这两个浮层直接写在 app/App.jsx 里，与 <RouterProvider> 平级 ——
 * 也就是渲染在 Router 上下文之外。TutorialSystem 内部调用了 useNavigate()，
 * 一渲染就抛 "useNavigate() may be used only in the context of a <Router> component"。
 * 放进路由树的最外层之后，两者都能正常拿到导航能力。
 *
 * 注意这里不渲染任何外壳（侧栏 / 页头），那些属于 AdminLayout、PublicLayout。
 */
export default function RootLayout() {
  return (
    <>
      <Outlet />
      <NetworkStatusBanner />
      <TutorialSystem />
    </>
  );
}