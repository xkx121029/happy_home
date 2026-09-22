import { createBrowserRouter } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import { RequireAuth, RequireRole } from './guards';
import { ADMIN_PATHS, AUTH_PATHS, PUBLIC_PATHS } from './paths';
import {
  LoginPage, ForgotPasswordPage, ResetPasswordPage, UnauthorizedPage, NotFoundPage,
  DashboardPage, AnalyticsPage, PostsPage, PostEditorPage, RevisionsPage,
  PagesPage, PageEditorPage, MediaPage, CommentsPage,
  CategoriesPage, TagsPage, MenusPage, WidgetsPage,
  ThemesPage, SEOPage, CustomCSSPage, SocialShareSettingsPage,
  UsersPage, UserEditorPage, RolesPage, NotificationsPage, BackupPage, SettingsPage, HelpPage,
  PublicHomePage, PublicPostsPage, PublicPostDetailPage, PublicPageDetailPage,
} from './lazyPages';
import RouteError from '../app/RouteError';

/**
 * 唯一的路由表。
 *
 * 原实现是 571 行的 App.jsx：21 条后台路由逐条包一层 <PrivateRoute>，
 * 28 个 AdminXxx 组件定义在组件体内，页面靠 props 接收数据。
 *
 * 现在用嵌套布局路由，鉴权与外壳各写一次：
 *   RequireAuth → AdminLayout → 具体页面
 * 页面直接作为 children，不再有任何包装组件，也就不存在
 * 「组件体内定义组件」导致的整树重挂载。
 *
 * 前台路径一个都没改 —— 它们已经写进数据库的 menus.items 里，
 * 改了会让用户已有的菜单链接全部 404。
 */
export const router = createBrowserRouter([
  // ------------------------------------------------------------------ 前台
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <PublicHomePage /> },
      { path: 'posts', element: <PublicPostsPage /> },
      { path: 'posts/:id', element: <PublicPostDetailPage /> },
      { path: 'page/:slug', element: <PublicPageDetailPage /> },
    ],
  },

  // ------------------------------------------------------------ 认证流程
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // -------------------------------------------------------------- 后台
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'analytics', element: <AnalyticsPage /> },

          // 内容
          { path: 'posts', element: <PostsPage /> },
          { path: 'posts/new', element: <PostEditorPage /> },
          { path: 'posts/:id/edit', element: <PostEditorPage /> },
          { path: 'revisions', element: <RevisionsPage /> },
          { path: 'pages', element: <PagesPage /> },
          { path: 'pages/new', element: <PageEditorPage /> },
          { path: 'pages/:id/edit', element: <PageEditorPage /> },
          { path: 'media', element: <MediaPage /> },
          { path: 'comments', element: <CommentsPage /> },

          // 结构
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'tags', element: <TagsPage /> },
          { path: 'menus', element: <MenusPage /> },
          { path: 'widgets', element: <WidgetsPage /> },

          // 外观（这四页此前已实现但从未挂上路由，属于「建好了没接线」）
          { path: 'settings/appearance', element: <ThemesPage /> },
          { path: 'settings/seo', element: <SEOPage /> },
          { path: 'settings/custom-css', element: <CustomCSSPage /> },
          { path: 'settings/social', element: <SocialShareSettingsPage /> },

          // 系统
          { path: 'users', element: <UsersPage /> },
          { path: 'users/new', element: <UserEditorPage /> },
          { path: 'users/:id/edit', element: <UserEditorPage /> },
          // 角色管理只在界面上对管理员展示；真正的权限控制在后端
          {
            path: 'roles',
            element: (
              <RequireRole role="administrator">
                <RolesPage />
              </RequireRole>
            ),
          },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'system/backup', element: <BackupPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'help', element: <HelpPage /> },
        ],
      },
    ],
  },

  // -------------------------------------------------------- 无布局的特殊页
  { path: 'unauthorized', element: <UnauthorizedPage />, errorElement: <RouteError /> },
  // 后台下的未知路径直接落到 404，不静默跳回仪表盘 ——
  // 静默跳转会把「链接写错了」这类问题藏起来，只有让用户看见 404 才会被发现并修掉。
  { path: '*', element: <NotFoundPage />, errorElement: <RouteError /> },
]);

export { ADMIN_PATHS, AUTH_PATHS, PUBLIC_PATHS };
export default router;