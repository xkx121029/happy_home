import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { LoadingState } from '../components/StateViews';
import { AUTH_PATHS } from './paths';

/**
 * 唯一的后台鉴权入口。配合嵌套路由使用，只写一次：
 *
 *   <Route element={<RequireAuth />}>
 *     <Route path="/admin" element={<AdminLayout />}> ... </Route>
 *   </Route>
 *
 * 原实现是在 21 条路由上逐个包一层 <PrivateRoute>，还要在 PrivateRoute
 * 里再包 children，改动一条路由就要动多处。
 */
export function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated, loading } = useData();

  if (loading) {
    return <LoadingState message="正在验证身份..." fullPage />;
  }

  // 只看 isAuthenticated —— 它来自 /auth/me 对 token 的真实校验。
  // 原来的 PrivateRoute 还额外信任 localStorage 里的 isLoggedIn 标记：
  // 只要那个键是 'true'，即使 token 已失效或根本不存在，页面照样放行，
  // 随后每个请求都 403 —— 是最隐蔽的一处鉴权漏洞。
  if (!isAuthenticated) {
    // 未登录应去登录页并记住来路，而不是跳到一个没有出口的 /unauthorized
    return <Navigate to={AUTH_PATHS.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * 角色守卫。必须嵌在 RequireAuth 之内。
 *
 * 注意：这只是前端的体验优化（不给无权用户展示入口），
 * 真正的权限控制在后端 —— 前端隐藏按钮挡不住直接调接口。
 */
export function RequireRole({ role, children }) {
  const { currentUser } = useData();

  if (!currentUser) return null;

  if (currentUser.role !== role) {
    return <Navigate to={AUTH_PATHS.unauthorized} replace />;
  }

  return children ?? <Outlet />;
}