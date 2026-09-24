import { lazy, Suspense } from 'react';
import { LoadingState } from '../components/StateViews';

/**
 * 页面级懒加载。
 *
 * 原来管理后台的 30 多个页面全部打进同一个 bundle（600KB+），
 * 打开登录页也要把评论审核、SEO 设置、备份管理全部下载下来。
 * 按路由切分后，首包只包含当前页面需要的代码。
 *
 * 每个页面单独一个 chunk，粒度足够细又不会碎到产生大量请求。
 */
const wrap = (loader) => {
  const Component = lazy(loader);
  return function LazyPage() {
    return (
      <Suspense fallback={<LoadingState message="正在加载页面..." fullPage />}>
        <Component />
      </Suspense>
    );
  };
};

// ---------------------------------------------------------------- 认证相关
export const LoginPage = wrap(() => import('../pages/Login'));
export const ForgotPasswordPage = wrap(() => import('../pages/ForgotPassword'));
export const UnauthorizedPage = wrap(() => import('../pages/UnauthorizedPage'));
export const NotFoundPage = wrap(() => import('../pages/NotFoundPage'));

// ------------------------------------------------------------------ 后台内容
export const DashboardPage = wrap(() => import('../pages/Dashboard'));
export const AnalyticsPage = wrap(() => import('../pages/Analytics'));
export const PostsPage = wrap(() => import('../pages/Posts'));
export const PostEditorPage = wrap(() => import('../pages/PostEditor'));
export const RevisionsPage = wrap(() => import('../pages/Revisions'));
export const PagesPage = wrap(() => import('../pages/Pages'));
export const PageEditorPage = wrap(() => import('../pages/PageEditor'));
export const MediaPage = wrap(() => import('../pages/Media'));
export const CommentsPage = wrap(() => import('../pages/Comments'));

// ------------------------------------------------------------------ 后台结构
export const CategoriesPage = wrap(() => import('../pages/Categories'));
export const TagsPage = wrap(() => import('../pages/Tags'));
export const MenusPage = wrap(() => import('../pages/Menus'));
export const WidgetsPage = wrap(() => import('../pages/Widgets'));

// ------------------------------------------------------------------ 后台外观
export const ThemesPage = wrap(() => import('../pages/Themes'));
export const SEOPage = wrap(() => import('../pages/SEO'));
export const CustomCSSPage = wrap(() => import('../pages/CustomCSS'));
export const SocialShareSettingsPage = wrap(() => import('../pages/SocialShare'));

// ------------------------------------------------------------------ 后台系统
export const UsersPage = wrap(() => import('../pages/Users'));
export const UserEditorPage = wrap(() => import('../pages/UserEditor'));
export const RolesPage = wrap(() => import('../pages/Roles'));
export const NotificationsPage = wrap(() => import('../pages/Notifications'));
export const BackupPage = wrap(() => import('../pages/Backup'));
export const ApiKeysPage = wrap(() => import('../pages/ApiKeys'));
export const SettingsPage = wrap(() => import('../pages/Settings'));
export const HelpPage = wrap(() => import('../pages/Help'));

// -------------------------------------------------------------------- 前台
export const PublicHomePage = wrap(() => import('../pages/public/PublicHome'));
export const PublicPostsPage = wrap(() => import('../pages/public/PublicPosts'));
export const PublicPostDetailPage = wrap(() => import('../pages/public/PublicPostDetail'));
export const PublicPageDetailPage = wrap(() => import('../pages/public/PublicPageDetail'));