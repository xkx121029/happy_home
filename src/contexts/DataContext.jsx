import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  postsAPI, pagesAPI, usersAPI, categoriesAPI, tagsAPI,
  menusAPI, widgetsAPI, mediaAPI, commentsAPI,
  notificationsAPI, backupsAPI,
} from '../services/api';
import { useAuth } from '../state/AuthContext';

/**
 * 后台实体数据（文章 / 页面 / 分类 / 标签 / 菜单 / 部件 / 媒体 / 评论 / 备份 / 通知）。
 *
 * 相比原实现的三处结构性修正：
 *
 * 1. 剥离认证与站点设置。它们各自拆成了 AuthContext 与 SiteSettingsContext ——
 *    三者的变化频率与消费方完全不同，混在一个 Context 里意味着
 *    「改一篇文章」也会让所有读设置的组件重渲染。
 *
 * 2. value 与全部方法都做了记忆化。原来每次渲染都新建一个 value 对象，
 *    并且所有 getter/create/update 都是渲染期创建的普通函数，
 *    于是 Context 的引用每渲染必变，消费者全部跟着重渲染。
 *
 * 3. 数据加载由 isAuthenticated 驱动，不再自己维护一套登录状态。
 *
 * 已知的遗留问题（留待后续处理，见汇报）：实体数据仍然是全局预加载的，
 * 30 多个页面共享这一份列表；理想形态是各页面按需自取（hooks/useResource.js
 * 已经准备好这个原语），但那需要每个页面同时具备加载中/空/错误三种状态 UI，
 * 属于 UI 重做阶段的工作，不宜在结构重构中先行拆开。
 */
const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [menus, setMenus] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [comments, setComments] = useState([]);
  const [backups, setBackups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 后台全量数据
  const loadAllData = useCallback(async () => {
    const [
      postsRes, pagesRes, usersRes, categoriesRes,
      tagsRes, menusRes, widgetsRes, mediaRes, commentsRes,
    ] = await Promise.all([
      postsAPI.getAll(),
      pagesAPI.getAll(),
      usersAPI.getAll(),
      categoriesAPI.getAll(),
      tagsAPI.getAll(),
      menusAPI.getAll(),
      widgetsAPI.getAll(),
      mediaAPI.getAll(),
      commentsAPI.getAll(),
    ]);

    if (!mountedRef.current) return;
    setPosts(postsRes.data || []);
    setPages(pagesRes.data || []);
    setUsers(usersRes.data || []);
    setCategories(categoriesRes.data || []);
    setTags(tagsRes.data || []);
    setMenus(menusRes.data || []);
    setWidgets(widgetsRes.data || []);
    setMediaItems(mediaRes.data || []);
    setComments(commentsRes.data || []);
  }, []);

  // 访客可见的数据（不含用户、评论等待审内容）
  //
  // 用 allSettled 而不是 all：这几个请求里只要有一个失败（历史上就是如此 ——
  // 这里曾经调用四个需要 token 的端点，访客必然 401），all 会让整组 reject，
  // 被 catch 吞掉之后 posts/pages/categories/tags/widgets 全部保持空数组，
  // 于是访客看到的前台侧栏一个小工具都没有。一个接口挂掉不该拖垮整页。
  const loadPublicData = useCallback(async () => {
    const [postsRes, pagesRes, categoriesRes, tagsRes, widgetsRes] = await Promise.allSettled([
      postsAPI.getPage({ perPage: 100 }),
      pagesAPI.getAll(),
      categoriesAPI.getAll(),
      tagsAPI.getAll(),
      widgetsAPI.getAll(),
    ]);

    if (!mountedRef.current) return;

    const pick = (result) => (result.status === 'fulfilled' ? result.value?.data || [] : []);
    const failed = [postsRes, pagesRes, categoriesRes, tagsRes, widgetsRes].filter(
      (r) => r.status === 'rejected'
    );
    if (failed.length) {
      console.error(
        `访客数据加载有 ${failed.length} 项失败：`,
        failed.map((r) => r.reason?.message || r.reason)
      );
    }

    setPosts(pick(postsRes));
    setPages(pick(pagesRes));
    setCategories(pick(categoriesRes));
    setTags(pick(tagsRes));
    setWidgets(pick(widgetsRes));
    // 访客不该看到用户列表与评论审核队列
    setUsers([]);
    setComments([]);
  }, []);

  useEffect(() => {
    if (initializing) return;

    const load = async () => {
      setLoading(true);
      try {
        await (isAuthenticated ? loadAllData() : loadPublicData());
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, initializing, loadAllData, loadPublicData]);

  // ------------------------------------------------------------------ 文章
  const getPosts = useCallback(async (params = {}) => {
    const response = await postsAPI.getAll(params);
    setPosts(response.data || []);
    return response;
  }, []);

  const getPost = useCallback((id) => postsAPI.getById(id), []);

  const createPost = useCallback(async (data) => {
    const response = await postsAPI.create(data);
    setPosts((prev) => [response.data, ...prev]);
    return response;
  }, []);

  const updatePost = useCallback(async (id, data) => {
    const response = await postsAPI.update(id, data);
    setPosts((prev) => prev.map((p) => (p.id === id ? response.data : p)));
    return response;
  }, []);

  const deletePost = useCallback(async (id) => {
    const response = await postsAPI.delete(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    return response;
  }, []);

  // ------------------------------------------------------------------ 页面
  const getPages = useCallback(async (params = {}) => {
    const response = await pagesAPI.getAll(params);
    setPages(response.data || []);
    return response;
  }, []);

  const getPage = useCallback((id) => pagesAPI.getById(id), []);

  const createPage = useCallback(async (data) => {
    const response = await pagesAPI.create(data);
    setPages((prev) => [response.data, ...prev]);
    return response;
  }, []);

  const updatePage = useCallback(async (id, data) => {
    const response = await pagesAPI.update(id, data);
    setPages((prev) => prev.map((p) => (p.id === id ? response.data : p)));
    return response;
  }, []);

  const deletePage = useCallback(async (id) => {
    const response = await pagesAPI.delete(id);
    setPages((prev) => prev.filter((p) => p.id !== id));
    return response;
  }, []);

  // ------------------------------------------------------------------ 分类
  const getCategories = useCallback(async () => {
    const response = await categoriesAPI.getAll();
    setCategories(response.data || []);
    return response;
  }, []);

  const createCategory = useCallback(async (data) => {
    const response = await categoriesAPI.create(data);
    setCategories((prev) => [response.data, ...prev]);
    return response;
  }, []);

  const updateCategory = useCallback(async (id, data) => {
    const response = await categoriesAPI.update(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? response.data : c)));
    return response;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    const response = await categoriesAPI.delete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    return response;
  }, []);

  // ------------------------------------------------------------------ 标签
  const getTags = useCallback(async () => {
    const response = await tagsAPI.getAll();
    setTags(response.data || []);
    return response;
  }, []);

  const createTag = useCallback(async (data) => {
    const response = await tagsAPI.create(data);
    setTags((prev) => [response.data, ...prev]);
    return response;
  }, []);

  const updateTag = useCallback(async (id, data) => {
    const response = await tagsAPI.update(id, data);
    setTags((prev) => prev.map((t) => (t.id === id ? response.data : t)));
    return response;
  }, []);

  const deleteTag = useCallback(async (id) => {
    const response = await tagsAPI.delete(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
    return response;
  }, []);

  // ------------------------------------------------------------------ 菜单
  const getMenus = useCallback(async () => {
    const response = await menusAPI.getAll();
    setMenus(response.data || []);
    return response;
  }, []);

  const createMenu = useCallback(async (data) => {
    const response = await menusAPI.create(data);
    setMenus((prev) => [response.data, ...prev]);
    return response;
  }, []);

  const updateMenu = useCallback(async (id, data) => {
    const response = await menusAPI.update(id, data);
    setMenus((prev) => prev.map((m) => (m.id === id ? response.data : m)));
    return response;
  }, []);

  const deleteMenu = useCallback(async (id) => {
    const response = await menusAPI.delete(id);
    setMenus((prev) => prev.filter((m) => m.id !== id));
    return response;
  }, []);

  // ------------------------------------------------------------------ 部件
  const getWidgets = useCallback(async (params = {}) => {
    const response = await widgetsAPI.getAll(params);
    setWidgets(response.data || []);
    return response;
  }, []);

  const createWidget = useCallback(async (data) => {
    const response = await widgetsAPI.create(data);
    setWidgets((prev) => [response.data, ...prev]);
    return response;
  }, []);

  const updateWidget = useCallback(async (id, data) => {
    const response = await widgetsAPI.update(id, data);
    setWidgets((prev) => prev.map((w) => (w.id === id ? response.data : w)));
    return response;
  }, []);

  const deleteWidget = useCallback(async (id) => {
    const response = await widgetsAPI.delete(id);
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    return response;
  }, []);

  // ------------------------------------------------------------------ 媒体
  const getMedia = useCallback(async () => {
    const response = await mediaAPI.getAll();
    setMediaItems(response.data || []);
    return response;
  }, []);

  const uploadMedia = useCallback(async (data) => {
    const response = await mediaAPI.create(data);
    setMediaItems((prev) => [response.data, ...prev]);
    return response;
  }, []);

  const deleteMedia = useCallback(async (id) => {
    const response = await mediaAPI.delete(id);
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    return response;
  }, []);

  // ------------------------------------------------------------------ 评论
  const getComments = useCallback(async (params = {}) => {
    const response = await commentsAPI.getAll(params);
    setComments(response.data || []);
    return response;
  }, []);

  const updateCommentStatus = useCallback(async (id, status) => {
    const response = await commentsAPI.updateStatus(id, status);
    setComments((prev) => prev.map((c) => (c.id === id ? response.data : c)));
    return response;
  }, []);

  const deleteComment = useCallback(async (id) => {
    const response = await commentsAPI.delete(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
    return response;
  }, []);

  const createComment = useCallback(async (data) => {
    const response = await commentsAPI.create(data);
    setComments((prev) => [response.data, ...prev]);
    return response;
  }, []);

  // ------------------------------------------------------------------ 备份
  const loadBackups = useCallback(async () => {
    const response = await backupsAPI.getAll();
    setBackups(response.data || []);
    return response;
  }, []);

  // ------------------------------------------------------------------ 通知
  // 通知类端点的载荷字段是 notifications / unreadCount，不是统一的 data，
  // 所以这里不能按 response.data 取（否则永远是空数组）。
  const getNotifications = useCallback(async () => {
    const response = await notificationsAPI.getAll();
    setNotifications(response.notifications || []);
    return response;
  }, []);

  const markNotificationAsRead = useCallback(async (id) => {
    await notificationsAPI.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const deleteNotification = useCallback(async (id) => {
    await notificationsAPI.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // 记住整个 value：只在真正依赖的字段变化时才通知消费者
  const value = useMemo(() => ({
    // 数据
    posts, pages, users, categories, tags, menus, widgets,
    mediaItems, comments, backups, notifications, loading,

    // 加载
    loadAllData, loadPublicData,

    // 文章
    getPosts, getPost, createPost, updatePost, deletePost,
    // 页面
    getPages, getPage, createPage, updatePage, deletePage,
    // 分类
    getCategories, createCategory, updateCategory, deleteCategory,
    // 标签
    getTags, createTag, updateTag, deleteTag,
    // 菜单
    getMenus, createMenu, updateMenu, deleteMenu,
    // 部件
    getWidgets, createWidget, updateWidget, deleteWidget,
    // 媒体
    getMedia, uploadMedia, deleteMedia,
    // 评论
    getComments, updateCommentStatus, deleteComment, createComment,
    // 备份与通知
    loadBackups, getNotifications, markNotificationAsRead, deleteNotification,

  }), [
    posts, pages, users, categories, tags, menus, widgets,
    mediaItems, comments, backups, notifications, loading,
    loadAllData, loadPublicData,
    getPosts, getPost, createPost, updatePost, deletePost,
    getPages, getPage, createPage, updatePage, deletePage,
    getCategories, createCategory, updateCategory, deleteCategory,
    getTags, createTag, updateTag, deleteTag,
    getMenus, createMenu, updateMenu, deleteMenu,
    getWidgets, createWidget, updateWidget, deleteWidget,
    getMedia, uploadMedia, deleteMedia,
    getComments, updateCommentStatus, deleteComment, createComment,
    loadBackups, getNotifications, markNotificationAsRead, deleteNotification,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}