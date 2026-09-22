import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI, setAuthToken, getAuthToken } from '../services/api';
import { STORAGE_KEYS, remove } from '../lib/storage';

/**
 * 认证状态 —— 全站唯一真源。
 *
 * 从 DataContext 里拆出来的原因：它和实体数据列表是两件完全不同的事
 * （变化频率、生命周期、消费方都不同），混在一起导致任何一次文章更新
 * 都会重建整个 Context value，让所有消费者重渲染。
 *
 * 同时修掉两个和认证有关的既有问题：
 * 1. 原来的 login 会在 localStorage 写一个 isLoggedIn 标记，而 PrivateRoute
 *    会信任它 —— 只要这个键是 'true'（上个版本的残留、或手工写入），
 *    即使 token 已失效也照样放行页面，随后每个请求都 403。
 *    现在不再写这个键，鉴权只认 /auth/me 的校验结果。
 * 2. 原来登录后往 localStorage 写 currentUser，但顶栏读的是另一个键、
 *    全项目没有任何地方写它，于是用户名永远是空的。用户信息改为只存在于内存。
 *
 * 启动时会清理旧的遗留键，避免上一版本留下的脏状态继续影响判断。
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // initializing 表示「正在校验本地 token 是否仍然有效」，与「正在提交登录表单」无关
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 清掉历史遗留的本地鉴权标记（现在只信 /auth/me）
    remove(STORAGE_KEYS.isLoggedIn);
    remove(STORAGE_KEYS.currentUser);

    const bootstrap = async () => {
      const token = getAuthToken();
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const response = await authAPI.getMe();
        setUser(response.user || null);
        setIsAuthenticated(Boolean(response.user));
      } catch {
        // token 已失效：api 层在收到 401 时已经把它清掉了
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authAPI.login(credentials);
    setAuthToken(response.token);
    setUser(response.user || null);
    setIsAuthenticated(Boolean(response.user));
    return response;
  }, []);

  /**
   * 用已有 token 完成登录。
   *
   * 注册与邮箱验证成功后，后端会直接返回一个 token。原来的代码调的是
   * `login({ token })`，而 login 会把它当成用户名密码去调 /auth/login，
   * 请求体里没有 username/password，后端返回 400 —— 注册完就登不进去。
   * 这里显式提供一个「用 token 登录」的入口。
   */
  const loginWithToken = useCallback(async (token) => {
    setAuthToken(token);
    try {
      const response = await authAPI.getMe();
      setUser(response.user || null);
      setIsAuthenticated(Boolean(response.user));
      return response;
    } catch (error) {
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // 记住 value，避免每次渲染都产生新对象导致所有消费者重渲染
  const value = useMemo(
    () => ({ user, isAuthenticated, initializing, login, loginWithToken, logout }),
    [user, isAuthenticated, initializing, login, loginWithToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}