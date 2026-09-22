import { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useResource } from '../hooks/useResource';
import { settingsAPI, publicSettingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

/**
 * 站点设置 —— 全站共享，且要作用到 <head> 与 CSS 变量上。
 *
 * 从 DataContext 拆出来的原因：它被前台和后台同时使用，变化频率极低，
 * 但影响面很大（标题、描述、主题色、自定义 CSS）。单独拎出来之后，
 * 文章列表更新之类的操作不会连带触发依赖设置的那批组件重渲染。
 *
 * 顺带实现「后台改主题色即时生效」：写入 --c-accent，全站强调色立刻跟着变，
 * 不必刷新。原来 Themes 页只是改了本地 state，改完什么都不发生。
 */
const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  const {
    data: settings,
    isLoading,
    error,
    refetch,
    setData,
  } = useResource(
    // 已登录读完整设置（含 SMTP 等敏感项），访客只读公开字段
    () => (isAuthenticated ? settingsAPI.getAll() : publicSettingsAPI.getAll()),
    {
      enabled: !initializing,
      initialData: {},
      select: (res) => res?.data || {},
    }
  );

  const updateSettings = useCallback(async (patch) => {
    const response = await settingsAPI.update(patch);
    setData(response.data || {});
    return response;
  }, [setData]);

  // 页面标题跟随站点名
  useEffect(() => {
    if (settings?.siteName) {
      document.title = settings.siteName;
    }
  }, [settings?.siteName]);

  // 主题色写进 CSS 变量，实现设置页改色即时生效
  useEffect(() => {
    const hex = settings?.primaryColor;
    if (!hex || typeof hex !== 'string') return;
    const match = hex.trim().match(/^#?([0-9a-f]{6})$/i);
    if (!match) return;

    const value = match[1];
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    document.documentElement.style.setProperty('--c-accent', `${r} ${g} ${b}`);
  }, [settings?.primaryColor]);

  const value = useMemo(
    () => ({ settings: settings || {}, isLoading, error, refetch, updateSettings }),
    [settings, isLoading, error, refetch, updateSettings]
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}