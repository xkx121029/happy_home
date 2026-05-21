import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const initialPosts = [
  {
    id: 1,
    title: '欢迎使用 HappyHome 建站平台',
    content: '<h2>恭喜您开始使用 HappyHome！</h2><p>这是一个功能强大的建站平台，帮助您轻松创建和管理网站内容。</p><p><strong>快速开始：</strong></p><ul><li>在左侧菜单点击"文章"开始创建您的第一篇文章</li><li>点击"页面"创建静态页面</li><li>使用"主题"功能定制网站外观</li></ul><p>如需帮助，请查看右上角的"帮助"按钮。</p>',
    excerpt: '欢迎使用 HappyHome 建站平台！这是一个功能强大的建站平台，帮助您轻松创建和管理网站内容。',
    status: 'published',
    category: '教程',
    tags: ['欢迎', '教程', '入门'],
    author: 'admin',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    views: 128,
  },
];

const initialPages = [
  {
    id: 1,
    title: '关于我们',
    content: '<h2>关于我们</h2><p>HappyHome 是一个致力于为每个人提供简单易用的建站解决方案的平台。</p><p>我们相信每个人都应该能够轻松展示自己的创意和内容，无需复杂的技术知识。</p>',
    slug: 'about',
    status: 'published',
    author: 'admin',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    title: '联系我们',
    content: '<h2>联系我们</h2><p>如果您有任何问题或建议，请通过以下方式联系我们：</p><ul><li>邮箱：contact@happpyhome.com</li><li>电话：400-123-4567</li></ul>',
    slug: 'contact',
    status: 'published',
    author: 'admin',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const initialUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'administrator',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const initialMedia = [
  {
    id: 1,
    name: 'sample-image.jpg',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    size: '256 KB',
    type: 'image/jpeg',
    uploadedAt: '2024-01-01',
  },
];

const initialSettings = {
  siteName: 'HappyHome',
  siteDescription: '一个功能强大、易于使用的建站平台',
  siteUrl: window.location.origin,
  adminEmail: 'admin@example.com',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  postsPerPage: 10,
  commentsModeration: true,
  registrationEnabled: false,
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      text: '#1f2937',
    },
    font: 'Inter',
    layout: 'wide',
  },
};

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [media, setMedia] = useState([]);
  const [settings, setSettings] = useState(initialSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    try {
      const savedPosts = localStorage.getItem('happyhome_posts');
      const savedPages = localStorage.getItem('happyhome_pages');
      const savedUsers = localStorage.getItem('happyhome_users');
      const savedMedia = localStorage.getItem('happyhome_media');
      const savedSettings = localStorage.getItem('happyhome_settings');

      setPosts(savedPosts ? JSON.parse(savedPosts) : initialPosts);
      setPages(savedPages ? JSON.parse(savedPages) : initialPages);
      setUsers(savedUsers ? JSON.parse(savedUsers) : initialUsers);
      setMedia(savedMedia ? JSON.parse(savedMedia) : initialMedia);
      setSettings(savedSettings ? JSON.parse(savedSettings) : initialSettings);
    } catch (error) {
      console.error('Error initializing data:', error);
      setPosts(initialPosts);
      setPages(initialPages);
      setUsers(initialUsers);
      setMedia(initialMedia);
      setSettings(initialSettings);
    } finally {
      setIsInitialized(true);
    }
  };

  const saveToStorage = useCallback((key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  const postsAPI = {
    getAll: useCallback(() => posts, [posts]),
    
    getById: useCallback((id) => posts.find(p => p.id === id), [posts]),
    
    create: useCallback((post) => {
      const newPost = {
        ...post,
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        views: 0,
      };
      const newPosts = [newPost, ...posts];
      setPosts(newPosts);
      saveToStorage('happyhome_posts', newPosts);
      return newPost;
    }, [posts, saveToStorage]),
    
    update: useCallback((id, updates) => {
      const newPosts = posts.map(p => 
        p.id === id 
          ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      );
      setPosts(newPosts);
      saveToStorage('happyhome_posts', newPosts);
      return newPosts.find(p => p.id === id);
    }, [posts, saveToStorage]),
    
    delete: useCallback((id) => {
      const newPosts = posts.filter(p => p.id !== id);
      setPosts(newPosts);
      saveToStorage('happyhome_posts', newPosts);
      return true;
    }, [posts, saveToStorage]),
  };

  const pagesAPI = {
    getAll: useCallback(() => pages, [pages]),
    
    getById: useCallback((id) => pages.find(p => p.id === id), [pages]),
    
    create: useCallback((page) => {
      const newPage = {
        ...page,
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const newPages = [newPage, ...pages];
      setPages(newPages);
      saveToStorage('happyhome_pages', newPages);
      return newPage;
    }, [pages, saveToStorage]),
    
    update: useCallback((id, updates) => {
      const newPages = pages.map(p => 
        p.id === id 
          ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      );
      setPages(newPages);
      saveToStorage('happyhome_pages', newPages);
      return newPages.find(p => p.id === id);
    }, [pages, saveToStorage]),
    
    delete: useCallback((id) => {
      const newPages = pages.filter(p => p.id !== id);
      setPages(newPages);
      saveToStorage('happyhome_pages', newPages);
      return true;
    }, [pages, saveToStorage]),
  };

  const usersAPI = {
    getAll: useCallback(() => users, [users]),
    
    getById: useCallback((id) => users.find(u => u.id === id), [users]),
    
    getByUsername: useCallback((username) => users.find(u => u.username === username), [users]),
    
    login: useCallback((username, password) => {
      const user = users.find(u => u.username === username && u.password === password);
      return user ? { success: true, user } : { success: false, message: '用户名或密码错误' };
    }, [users]),
    
    create: useCallback((user) => {
      const existing = users.find(u => u.username === user.username || u.email === user.email);
      if (existing) {
        return { success: false, message: '用户名或邮箱已存在' };
      }
      const newUser = {
        ...user,
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const newUsers = [newUser, ...users];
      setUsers(newUsers);
      saveToStorage('happyhome_users', newUsers);
      return { success: true, user: newUser };
    }, [users, saveToStorage]),
    
    update: useCallback((id, updates) => {
      const newUsers = users.map(u => 
        u.id === id 
          ? { ...u, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : u
      );
      setUsers(newUsers);
      saveToStorage('happyhome_users', newUsers);
      return { success: true, user: newUsers.find(u => u.id === id) };
    }, [users, saveToStorage]),
    
    delete: useCallback((id) => {
      if (users.length <= 1) {
        return { success: false, message: '不能删除最后一个用户' };
      }
      const newUsers = users.filter(u => u.id !== id);
      setUsers(newUsers);
      saveToStorage('happyhome_users', newUsers);
      return { success: true };
    }, [users, saveToStorage]),
  };

  const mediaAPI = {
    getAll: useCallback(() => media, [media]),
    
    upload: useCallback((file, url) => {
      const newMedia = {
        id: Date.now(),
        name: file.name,
        url: url,
        size: formatFileSize(file.size),
        type: file.type,
        uploadedAt: new Date().toISOString().split('T')[0],
      };
      const newMediaList = [newMedia, ...media];
      setMedia(newMediaList);
      saveToStorage('happyhome_media', newMediaList);
      return newMedia;
    }, [media, saveToStorage]),
    
    delete: useCallback((id) => {
      const newMediaList = media.filter(m => m.id !== id);
      setMedia(newMediaList);
      saveToStorage('happyhome_media', newMediaList);
      return true;
    }, [media, saveToStorage]),
  };

  const settingsAPI = {
    get: useCallback(() => settings, [settings]),
    
    update: useCallback((updates) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      saveToStorage('happyhome_settings', newSettings);
      return newSettings;
    }, [settings, saveToStorage]),
  };

  const resetAllData = useCallback(() => {
    setPosts(initialPosts);
    setPages(initialPages);
    setUsers(initialUsers);
    setMedia(initialMedia);
    setSettings(initialSettings);
    localStorage.removeItem('happyhome_posts');
    localStorage.removeItem('happyhome_pages');
    localStorage.removeItem('happyhome_users');
    localStorage.removeItem('happyhome_media');
    localStorage.removeItem('happyhome_settings');
  }, []);

  const clearAllData = useCallback(() => {
    setPosts([]);
    setPages([]);
    setUsers([]);
    setMedia([]);
    setSettings(initialSettings);
    localStorage.removeItem('happyhome_posts');
    localStorage.removeItem('happyhome_pages');
    localStorage.removeItem('happyhome_users');
    localStorage.removeItem('happyhome_media');
    localStorage.removeItem('happyhome_settings');
  }, []);

  const value = {
    posts,
    pages,
    users,
    media,
    settings,
    isInitialized,
    postsAPI,
    pagesAPI,
    usersAPI,
    mediaAPI,
    settingsAPI,
    resetAllData,
    clearAllData,
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
