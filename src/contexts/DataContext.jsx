import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  authAPI, postsAPI, pagesAPI, usersAPI, categoriesAPI, tagsAPI,
  menusAPI, widgetsAPI, mediaAPI, commentsAPI, settingsAPI, publicSettingsAPI, publicAPI,
  notificationsAPI, backupsAPI,
  setAuthToken, getAuthToken
} from '../services/api';

const DataContext = createContext();

// 后端返回的是数据库原始行（snake_case，且布尔位是 0/1），而所有页面读的是
// camelCase（post.updatedAt / post.publishDate / comment.parentId ...）。
// 两边一直没有对齐，于是排序、定时发布提示、评论嵌套等功能读到的全是 undefined。
// 这里在数据进入 state 的唯一入口做一次规整。
// （Phase 5 拆分后端时会改由各模块的 dto.js 统一转换，这一层随之简化）
const toCamelCase = (key) => key.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());

// 这些列的库内类型是 INTEGER，但语义是布尔
const BOOLEAN_FIELDS = new Set(['sticky', 'enabled', 'isRead', 'is_read']);

function normalizeEntity(entity) {
  if (Array.isArray(entity)) return entity.map(normalizeEntity);
  if (!entity || typeof entity !== 'object') return entity;

  const result = {};
  for (const [rawKey, value] of Object.entries(entity)) {
    const key = toCamelCase(rawKey);
    if (BOOLEAN_FIELDS.has(key)) {
      result[key] = value === 1 || value === true;
    } else if (key === 'items' || key === 'config') {
      // menus.items 与 widgets.config 在库里是 JSON 字符串
      if (typeof value === 'string') {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

const normalizeList = (data) => (Array.isArray(data) ? data.map(normalizeEntity) : data);

export const DataProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data
  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [menus, setMenus] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [comments, setComments] = useState([]);
  const [settings, setSettings] = useState({});

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const meResponse = await authAPI.getMe();
          setCurrentUser(meResponse.user);
          setIsAuthenticated(true);
          await loadAllData();
        } else {
          await loadPublicData();
        }
      } catch (error) {
        setAuthToken(null);
        await loadPublicData();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      const [
        postsRes, pagesRes, usersRes, categoriesRes,
        tagsRes, menusRes, widgetsRes, mediaRes, commentsRes, settingsRes
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
        settingsAPI.getAll(),
      ]);

      setPosts(normalizeList(postsRes.data) || []);
      setPages(normalizeList(pagesRes.data) || []);
      setUsers(normalizeList(usersRes.data) || []);
      setCategories(normalizeList(categoriesRes.data) || []);
      setTags(normalizeList(tagsRes.data) || []);
      setMenus(normalizeList(menusRes.data) || []);
      setWidgets(normalizeList(widgetsRes.data) || []);
      setMediaItems(normalizeList(mediaRes.data) || []);
      setComments(normalizeList(commentsRes.data) || []);
      setSettings(settingsRes.data || {});
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Load public data (for non-authenticated users)
  const loadPublicData = useCallback(async () => {
    try {
      const [
        postsRes, pagesRes, settingsRes
      ] = await Promise.all([
        postsAPI.getPublicAll(),
        publicAPI.getPages(),
        publicSettingsAPI.getAll(),
      ]);

      setPosts(normalizeList(postsRes.data) || []);
      setPages(normalizeList(pagesRes.data) || []);
      setSettings(settingsRes.data || {});
    } catch (error) {
      console.error('Error loading public data:', error);
    }
  }, []);

  // Auth functions
  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    setAuthToken(response.token);
    setCurrentUser(response.user);
    setIsAuthenticated(true);
    await loadAllData();
    return response;
  };

  const logout = async () => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    await loadPublicData();
  };

  // Posts
  const getPosts = async (params = {}) => {
    const response = await postsAPI.getAll(params);
    setPosts(normalizeList(response.data) || []);
    return response;
  };

  const getPost = async (id) => {
    const response = await postsAPI.getById(id);
    return response;
  };

  const createPost = async (data) => {
    const response = await postsAPI.create(data);
    setPosts(prev => [normalizeEntity(response.data), ...prev]);
    return response;
  };

  const updatePost = async (id, data) => {
    const response = await postsAPI.update(id, data);
    const updated = normalizeEntity(response.data);
    setPosts(prev => prev.map(p => p.id === id ? updated : p));
    return response;
  };

  const deletePost = async (id) => {
    const response = await postsAPI.delete(id);
    setPosts(prev => prev.filter(p => p.id !== id));
    return response;
  };

  // Pages
  const getPages = async (params = {}) => {
    const response = await pagesAPI.getAll(params);
    setPages(response.data || []);
    return response;
  };

  const getPage = async (id) => {
    const response = await pagesAPI.getById(id);
    return response;
  };

  const createPage = async (data) => {
    const response = await pagesAPI.create(data);
    setPages(prev => [response.data, ...prev]);
    return response;
  };

  const updatePage = async (id, data) => {
    const response = await pagesAPI.update(id, data);
    setPages(prev => prev.map(p => p.id === id ? response.data : p));
    return response;
  };

  const deletePage = async (id) => {
    const response = await pagesAPI.delete(id);
    setPages(prev => prev.filter(p => p.id !== id));
    return response;
  };

  // Categories
  const getCategories = async () => {
    const response = await categoriesAPI.getAll();
    setCategories(response.data || []);
    return response;
  };

  const createCategory = async (data) => {
    const response = await categoriesAPI.create(data);
    setCategories(prev => [response.data, ...prev]);
    return response;
  };

  const updateCategory = async (id, data) => {
    const response = await categoriesAPI.update(id, data);
    setCategories(prev => prev.map(c => c.id === id ? response.data : c));
    return response;
  };

  const deleteCategory = async (id) => {
    const response = await categoriesAPI.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    return response;
  };

  // Tags
  const getTags = async () => {
    const response = await tagsAPI.getAll();
    setTags(response.data || []);
    return response;
  };

  const createTag = async (data) => {
    const response = await tagsAPI.create(data);
    setTags(prev => [response.data, ...prev]);
    return response;
  };

  const updateTag = async (id, data) => {
    const response = await tagsAPI.update(id, data);
    setTags(prev => prev.map(t => t.id === id ? response.data : t));
    return response;
  };

  const deleteTag = async (id) => {
    const response = await tagsAPI.delete(id);
    setTags(prev => prev.filter(t => t.id !== id));
    return response;
  };

  // Menus
  const getMenus = async () => {
    const response = await menusAPI.getAll();
    setMenus(response.data || []);
    return response;
  };

  const createMenu = async (data) => {
    const response = await menusAPI.create(data);
    setMenus(prev => [response.data, ...prev]);
    return response;
  };

  const updateMenu = async (id, data) => {
    const response = await menusAPI.update(id, data);
    setMenus(prev => prev.map(m => m.id === id ? response.data : m));
    return response;
  };

  const deleteMenu = async (id) => {
    const response = await menusAPI.delete(id);
    setMenus(prev => prev.filter(m => m.id !== id));
    return response;
  };

  // Widgets
  const getWidgets = async (params = {}) => {
    const response = await widgetsAPI.getAll(params);
    setWidgets(response.data || []);
    return response;
  };

  const createWidget = async (data) => {
    const response = await widgetsAPI.create(data);
    setWidgets(prev => [response.data, ...prev]);
    return response;
  };

  const updateWidget = async (id, data) => {
    const response = await widgetsAPI.update(id, data);
    setWidgets(prev => prev.map(w => w.id === id ? response.data : w));
    return response;
  };

  const deleteWidget = async (id) => {
    const response = await widgetsAPI.delete(id);
    setWidgets(prev => prev.filter(w => w.id !== id));
    return response;
  };

  // Media
  const getMedia = async () => {
    const response = await mediaAPI.getAll();
    setMediaItems(response.data || []);
    return response;
  };

  const uploadMedia = async (data) => {
    const response = await mediaAPI.create(data);
    setMediaItems(prev => [response.data, ...prev]);
    return response;
  };

  const deleteMedia = async (id) => {
    const response = await mediaAPI.delete(id);
    setMediaItems(prev => prev.filter(m => m.id !== id));
    return response;
  };

  // Comments
  const getComments = async (params = {}) => {
    const response = await commentsAPI.getAll(params);
    setComments(response.data || []);
    return response;
  };

  const updateCommentStatus = async (id, status) => {
    const response = await commentsAPI.updateStatus(id, status);
    setComments(prev => prev.map(c => c.id === id ? response.data : c));
    return response;
  };

  const deleteComment = async (id) => {
    const response = await commentsAPI.delete(id);
    setComments(prev => prev.filter(c => c.id !== id));
    return response;
  };

  const createComment = async (data) => {
    const response = await commentsAPI.create(data);
    setComments(prev => [response.data, ...prev]);
    return response;
  };

  // Settings
  const getSettings = async () => {
    const response = await settingsAPI.getAll();
    setSettings(response.data || {});
    return response;
  };

  const updateSettings = async (data) => {
    const response = await settingsAPI.update(data);
    setSettings(response.data || {});
    return response;
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    loadAllData,

    // Data
    posts,
    pages,
    users,
    categories,
    tags,
    menus,
    widgets,
    mediaItems,
    comments,
    settings,

    // Posts
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,

    // Pages
    getPages,
    getPage,
    createPage,
    updatePage,
    deletePage,

    // Categories
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Tags
    getTags,
    createTag,
    updateTag,
    deleteTag,

    // Menus
    getMenus,
    createMenu,
    updateMenu,
    deleteMenu,

    // Widgets
    getWidgets,
    createWidget,
    updateWidget,
    deleteWidget,

    // Media
    getMedia,
    uploadMedia,
    deleteMedia,

    // Comments
    getComments,
    updateCommentStatus,
    deleteComment,
    createComment,

    // Settings
    getSettings,
    updateSettings,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

