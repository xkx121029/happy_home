import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { useSiteSettings } from '../state/SiteSettingsContext';
import { sanitizeCss } from '../lib/sanitize';
import { STORAGE_KEYS, readRaw } from '../lib/storage';

/**
 * 前台外壳。
 *
 * 原来是 App.jsx 里的 renderPublicLayout(content)：在渲染期读 localStorage、
 * 现场定义一个 sanitizeCSS 函数、再把一个 <style> 元素渲染进 body。
 * 这些都不该发生在渲染过程中 —— 读存储应该是副作用，净化应该是纯函数，
 * <style> 应该注入 head 而不是挂在 body 上。
 */
export default function PublicLayout() {
  const { settings } = useSiteSettings();
  const [customCss, setCustomCss] = useState('');

  useEffect(() => {
    setCustomCss(readRaw(STORAGE_KEYS.customCss, '') || '');
  }, []);

  const safeCss = useMemo(() => sanitizeCss(customCss), [customCss]);

  // 站点级自定义 CSS 注入 <head>，只做一次
  useEffect(() => {
    const STYLE_ID = 'happyhome-custom-css';
    let element = document.getElementById(STYLE_ID);

    if (!safeCss) {
      element?.remove();
      return;
    }
    if (!element) {
      element = document.createElement('style');
      element.id = STYLE_ID;
      document.head.appendChild(element);
    }
    element.textContent = safeCss;
  }, [safeCss]);

  // 站点名称与描述驱动页面标题
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