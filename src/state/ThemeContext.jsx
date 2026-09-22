import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS, readRaw, writeRaw } from '../lib/storage';

/**
 * 亮暗模式。
 *
 * 原来这套逻辑散在 App.jsx 里，而且是「两套机制半生效」：
 *   - useState(false) 没有持久化，刷新即丢；
 *   - handleDarkModeToggle 改的是 document.documentElement 的 class，
 *     但 Tailwind 的 dark: 变体实际依赖包裹布局的 <div className={darkMode ? 'dark' : ''}>。
 *   两者并存，导致 Portal 到 body 的 Toast / Modal 脱离作用域，暗色下必然失真。
 *
 * 现在统一为：主题写在 <html data-theme>，Tailwind 的 dark 变体指向该属性，
 * 首屏由 index.html 的内联脚本先行设置（避免白闪），这里只负责切换与持久化。
 */
const ThemeContext = createContext(null);

const getInitialTheme = () => {
  if (typeof document === 'undefined') return 'light';
  // 内联脚本已经设好，直接沿用，保证与首屏一致
  return document.documentElement.getAttribute('data-theme') || 'light';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writeRaw(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // 用户没手动选过时跟随系统变化
  useEffect(() => {
    const manual = readRaw(STORAGE_KEYS.theme, null);
    if (manual) return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setTheme(event.matches ? 'dark' : 'light');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}