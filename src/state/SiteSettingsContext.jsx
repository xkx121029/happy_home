import { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useResource } from '../hooks/useResource';
import { settingsAPI } from '../services/api';
import { globalThemeCss, resolveTheme } from '../theme/apply';
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
  const { initializing } = useAuth();

  const {
    data: settings,
    isLoading,
    error,
    refetch,
    setData,
  } = useResource(
    // 同一个端点，后端按身份决定返回哪些键：
    // 访客拿前台白名单（主题、自定义代码、统计 ID 都在里面），
    // 管理员拿全量，其余登录用户拿全量但剔除 SMTP 凭据。
    // 以前这里要按 isAuthenticated 在两个 API 之间二选一，现在不必了。
    () => settingsAPI.getAll(),
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

  // 主题（中性色系 / 强调色 / 圆角 / 字体）写进一份动态样式表。
  //
  // 这里刻意不用 documentElement.style.setProperty：内联样式优先级高于样式表，
  // 一旦把亮色的 --c-accent 写成内联属性，tokens.css 里 html[data-theme='dark']
  // 那一整块暗色覆盖就永久失效 —— 切到暗色时强调色不会跟着变。
  // 生成 :root 与暗色两条规则交给层叠决定，明暗切换才能继续正常工作。
  useEffect(() => {
    const STYLE_ID = 'happyhome-theme';
    let element = document.getElementById(STYLE_ID);

    if (!element) {
      element = document.createElement('style');
      element.id = STYLE_ID;
    }

    element.textContent = globalThemeCss(resolveTheme(settings));
    // 每次都追加到 head 末尾：dev 环境下 Vite 会持续注入样式，
    // 不移动的话我们的规则会被后插入的样式压在下面，改主题看不到效果。
    document.head.appendChild(element);
  }, [settings]);

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