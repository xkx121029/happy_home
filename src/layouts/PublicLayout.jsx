import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { useSiteSettings } from '../state/SiteSettingsContext';
import { sanitizeCss } from '../lib/sanitize';
import { injectAnalytics, injectHtml, injectScript, injectStyle } from '../lib/injectCode';

/**
 * 前台外壳。
 *
 * 原来是 App.jsx 里的 renderPublicLayout(content)：在渲染期读 localStorage、
 * 现场定义一个 sanitizeCSS 函数、再把一个 <style> 元素渲染进 body。
 * 这些都不该发生在渲染过程中 —— 读存储应该是副作用，净化应该是纯函数，
 * <style> 应该注入 head 而不是挂在 body 上。
 *
 * 自定义代码的来源也换掉了：原来读 localStorage（happyhome_custom_css），
 * 而设置页写的是数据库 —— 两条链路互不通气，改哪边都只生效一半。
 * 现在统一从 settings 注入，与主题走同一条路。
 */
export default function PublicLayout() {
  const { settings } = useSiteSettings();

  const safeCss = useMemo(() => sanitizeCss(settings?.customCSS || ''), [settings?.customCSS]);

  useEffect(() => {
    injectStyle(document.head, 'custom-css', safeCss);
  }, [safeCss]);

  useEffect(() => {
    injectHtml(document.head, 'head-code', settings?.headCode);
  }, [settings?.headCode]);

  useEffect(() => {
    injectScript(document.body, 'custom-js', settings?.customJS);
  }, [settings?.customJS]);

  useEffect(() => {
    injectHtml(document.body, 'footer-code', settings?.footerCode);
  }, [settings?.footerCode]);

  // 订阅自动发现：订阅器靠这个 <link> 找到 feed，不必让用户手动粘贴地址。
  // 用相对路径，免得 siteUrl 没配好时指向错误的域名。
  useEffect(() => {
    injectHtml(
      document.head,
      'feed-discovery',
      `<link rel="alternate" type="application/rss+xml" title="${(settings?.siteName || 'HappyHome').replace(/"/g, '&quot;')}" href="/feed.xml">`
    );
  }, [settings?.siteName]);

  // 统计脚本只在前台注入 —— 后台不需要统计自己
  const analytics = settings?.seo;
  useEffect(() => {
    injectAnalytics(analytics);
  }, [analytics]);

  // 站点名称驱动页面标题
  useEffect(() => {
    if (settings?.siteName) {
      document.title = settings.siteName;
    }
  }, [settings?.siteName]);

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <PublicHeader />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
