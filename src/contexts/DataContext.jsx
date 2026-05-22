import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 简单的密码验证（明文比较，用于演示目的）
const hashPassword = (password) => {
  return password;
};

// 验证密码
const verifyPassword = (inputPassword, storedPassword) => {
  return inputPassword === storedPassword;
};

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
    content: '<h2>联系我们</h2><p>如果您有任何问题或建议，请通过以下方式联系我们：</p><ul><li>邮箱：contact@happyhome.com</li><li>电话：400-123-4567</li></ul>',
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

const initialCategories = [
  {
    id: 1,
    name: '教程',
    slug: 'tutorial',
    description: '各类教程文章',
    parent: null,
    count: 1,
    createdAt: '2024-01-01',
  },
  {
    id: 2,
    name: '新闻',
    slug: 'news',
    description: '最新新闻资讯',
    parent: null,
    count: 0,
    createdAt: '2024-01-01',
  },
  {
    id: 3,
    name: '前端开发',
    slug: 'frontend',
    description: '前端技术相关文章',
    parent: null,
    count: 0,
    createdAt: '2024-01-01',
  },
];

const initialTags = [
  {
    id: 1,
    name: '欢迎',
    slug: 'welcome',
    count: 1,
    createdAt: '2024-01-01',
  },
  {
    id: 2,
    name: '教程',
    slug: 'tutorial',
    count: 1,
    createdAt: '2024-01-01',
  },
  {
    id: 3,
    name: '入门',
    slug: 'getting-started',
    count: 1,
    createdAt: '2024-01-01',
  },
];

const initialMenus = [
  {
    id: 1,
    title: '默认菜单',
    location: 'header',
    items: [
      { id: 1, title: '首页', url: '/', target: '_self', type: 'custom', enabled: true, order: 1 },
      { id: 2, title: '文章', url: '/posts', target: '_self', type: 'custom', enabled: true, order: 2 },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 2,
    title: '页脚菜单',
    location: 'footer',
    items: [
      { id: 3, title: '关于我们', url: '/page/about', target: '_self', type: 'page', enabled: true, order: 1 },
      { id: 4, title: '联系我们', url: '/page/contact', target: '_self', type: 'page', enabled: true, order: 2 },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
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
  seo: {
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    ogImage: '',
    googleAnalytics: '',
    bingVerification: '',
    baiduVerification: '',
    robots: 'index, follow',
    canonical: true,
    noIndex: false,
  },
};

const initialComments = [
  {
    id: 1,
    postId: 1,
    author: '张三',
    email: 'zhangsan@example.com',
    content: '这是一篇非常好的文章，学到了很多！',
    status: 'approved',
    parentId: null,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
  {
    id: 2,
    postId: 1,
    author: '李四',
    email: 'lisi@example.com',
    content: '请问有没有更详细的教程？',
    status: 'pending',
    parentId: null,
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03',
  },
  {
    id: 3,
    postId: 1,
    author: '王五',
    email: 'wangwu@example.com',
    content: '回复张三：确实很好，我也这么认为！',
    status: 'approved',
    parentId: 1,
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03',
  },
];

const initialWidgets = [
  {
    id: 1,
    name: '最新文章',
    type: 'recent_posts',
    location: 'sidebar',
    order: 1,
    enabled: true,
    config: { count: 5 },
  },
  {
    id: 2,
    name: '分类目录',
    type: 'categories',
    location: 'sidebar',
    order: 2,
    enabled: true,
    config: { count: 10 },
  },
  {
    id: 3,
    name: '标签云',
    type: 'tags',
    location: 'sidebar',
    order: 3,
    enabled: true,
    config: { count: 20 },
  },
  {
    id: 4,
    name: '搜索',
    type: 'search',
    location: 'sidebar',
    order: 0,
    enabled: true,
    config: {},
  },
];

const initialCustomCSS = {
  customCSS: '',
  customJS: '',
  customHead: '',
};

const initialBackups = [];

const initialRevisions = [];

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [media, setMedia] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [menus, setMenus] = useState([]);
  const [settings, setSettings] = useState(initialSettings);
  const [comments, setComments] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [backups, setBackups] = useState([]);
  const [customCSS, setCustomCSS] = useState(initialCustomCSS);
  const [revisions, setRevisions] = useState([]);
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
      const savedCategories = localStorage.getItem('happyhome_categories');
      const savedTags = localStorage.getItem('happyhome_tags');
      const savedMenus = localStorage.getItem('happyhome_menus');
      const savedSettings = localStorage.getItem('happyhome_settings');
      const savedComments = localStorage.getItem('happyhome_comments');
      const savedWidgets = localStorage.getItem('happyhome_widgets');
      const savedBackups = localStorage.getItem('happyhome_backups');
      const savedCustomCSS = localStorage.getItem('happyhome_customcss');
      const savedRevisions = localStorage.getItem('happyhome_revisions');

      // 对每个数据项单独进行 JSON 解析和错误处理
      let parsedPosts = initialPosts;
      let parsedPages = initialPages;
      let parsedUsers = initialUsers;
      let parsedMedia = initialMedia;
      let parsedCategories = initialCategories;
      let parsedTags = initialTags;
      let parsedMenus = initialMenus;
      let parsedSettings = initialSettings;
      let parsedComments = initialComments;
      let parsedWidgets = initialWidgets;
      let parsedBackups = initialBackups;
      let parsedCustomCSS = initialCustomCSS;
      let parsedRevisions = initialRevisions;

      try {
        parsedPosts = savedPosts ? JSON.parse(savedPosts) : initialPosts;
      } catch (error) {
        console.error('Error parsing posts:', error);
      }

      try {
        parsedPages = savedPages ? JSON.parse(savedPages) : initialPages;
      } catch (error) {
        console.error('Error parsing pages:', error);
      }

      try {
        // 强制使用初始用户数据（确保密码正确）
        parsedUsers = initialUsers;
      } catch (error) {
        console.error('Error parsing users:', error);
      }

      try {
        parsedMedia = savedMedia ? JSON.parse(savedMedia) : initialMedia;
      } catch (error) {
        console.error('Error parsing media:', error);
      }

      try {
        parsedCategories = savedCategories ? JSON.parse(savedCategories) : initialCategories;
      } catch (error) {
        console.error('Error parsing categories:', error);
      }

      try {
        parsedTags = savedTags ? JSON.parse(savedTags) : initialTags;
      } catch (error) {
        console.error('Error parsing tags:', error);
      }

      try {
        parsedMenus = savedMenus ? JSON.parse(savedMenus) : initialMenus;
      } catch (error) {
        console.error('Error parsing menus:', error);
      }

      try {
        parsedSettings = savedSettings ? JSON.parse(savedSettings) : initialSettings;
      } catch (error) {
        console.error('Error parsing settings:', error);
      }

      try {
        parsedComments = savedComments ? JSON.parse(savedComments) : initialComments;
      } catch (error) {
        console.error('Error parsing comments:', error);
      }

      try {
        parsedWidgets = savedWidgets ? JSON.parse(savedWidgets) : initialWidgets;
      } catch (error) {
        console.error('Error parsing widgets:', error);
      }

      try {
        parsedBackups = savedBackups ? JSON.parse(savedBackups) : initialBackups;
      } catch (error) {
        console.error('Error parsing backups:', error);
      }

      try {
        parsedCustomCSS = savedCustomCSS ? JSON.parse(savedCustomCSS) : initialCustomCSS;
      } catch (error) {
        console.error('Error parsing customCSS:', error);
      }

      try {
        parsedRevisions = savedRevisions ? JSON.parse(savedRevisions) : initialRevisions;
      } catch (error) {
        console.error('Error parsing revisions:', error);
      }

      setPosts(parsedPosts);
      setPages(parsedPages);
      setUsers(parsedUsers);
      setMedia(parsedMedia);
      setCategories(parsedCategories);
      setTags(parsedTags);
      setMenus(parsedMenus);
      setSettings(parsedSettings);
      setComments(parsedComments);
      setWidgets(parsedWidgets);
      setBackups(parsedBackups);
      setCustomCSS(parsedCustomCSS);
      setRevisions(parsedRevisions);
    } catch (error) {
      console.error('Error initializing data:', error);
      setPosts(initialPosts);
      setPages(initialPages);
      setUsers(initialUsers);
      setMedia(initialMedia);
      setCategories(initialCategories);
      setTags(initialTags);
      setMenus(initialMenus);
      setSettings(initialSettings);
      setComments(initialComments);
      setWidgets(initialWidgets);
      setBackups(initialBackups);
      setCustomCSS(initialCustomCSS);
      setRevisions(initialRevisions);
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
      const user = users.find(u => u.username === username);
      if (user && verifyPassword(password, user.password)) {
        const { password: _, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
      }
      return { success: false, message: '用户名或密码错误' };
    }, [users]),
    
    create: useCallback((user) => {
      const existing = users.find(u => u.username === user.username || u.email === user.email);
      if (existing) {
        return { success: false, message: '用户名或邮箱已存在' };
      }
      const newUser = {
        ...user,
        id: Date.now(),
        // 对密码进行哈希处理
        password: hashPassword(user.password),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const newUsers = [newUser, ...users];
      setUsers(newUsers);
      saveToStorage('happyhome_users', newUsers);
      // 返回的用户信息中不包含密码
      const { password: _, ...userWithoutPassword } = newUser;
      return { success: true, user: userWithoutPassword };
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

  const categoriesAPI = {
    getAll: useCallback(() => categories, [categories]),
    
    getById: useCallback((id) => categories.find(c => c.id === id), [categories]),
    
    getBySlug: useCallback((slug) => categories.find(c => c.slug === slug), [categories]),
    
    create: useCallback((category) => {
      const newCategory = {
        ...category,
        id: Date.now(),
        count: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const newCategories = [newCategory, ...categories];
      setCategories(newCategories);
      saveToStorage('happyhome_categories', newCategories);
      return newCategory;
    }, [categories, saveToStorage]),
    
    update: useCallback((id, updates) => {
      const newCategories = categories.map(c => 
        c.id === id 
          ? { ...c, ...updates }
          : c
      );
      setCategories(newCategories);
      saveToStorage('happyhome_categories', newCategories);
      return newCategories.find(c => c.id === id);
    }, [categories, saveToStorage]),
    
    delete: useCallback((id) => {
      // 检查是否有子分类
      const hasChildren = categories.some(c => c.parent === id);
      if (hasChildren) {
        return { success: false, message: '该分类下有子分类，请先删除子分类' };
      }
      // 检查是否有文章使用该分类
      const category = categories.find(c => c.id === id);
      if (category && category.count > 0) {
        return { success: false, message: '该分类下有文章，无法删除' };
      }
      const newCategories = categories.filter(c => c.id !== id);
      setCategories(newCategories);
      saveToStorage('happyhome_categories', newCategories);
      return { success: true };
    }, [categories, saveToStorage]),
    
    incrementCount: useCallback((id) => {
      const newCategories = categories.map(c => 
        c.id === id ? { ...c, count: c.count + 1 } : c
      );
      setCategories(newCategories);
      saveToStorage('happyhome_categories', newCategories);
    }, [categories, saveToStorage]),
    
    decrementCount: useCallback((id) => {
      const newCategories = categories.map(c => 
        c.id === id ? { ...c, count: Math.max(0, c.count - 1) } : c
      );
      setCategories(newCategories);
      saveToStorage('happyhome_categories', newCategories);
    }, [categories, saveToStorage]),
  };

  const tagsAPI = {
    getAll: useCallback(() => tags, [tags]),
    
    getById: useCallback((id) => tags.find(t => t.id === id), [tags]),
    
    getBySlug: useCallback((slug) => tags.find(t => t.slug === slug), [tags]),
    
    create: useCallback((tag) => {
      const newTag = {
        ...tag,
        id: Date.now(),
        count: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      const newTags = [newTag, ...tags];
      setTags(newTags);
      saveToStorage('happyhome_tags', newTags);
      return newTag;
    }, [tags, saveToStorage]),
    
    update: useCallback((id, updates) => {
      const newTags = tags.map(t => 
        t.id === id 
          ? { ...t, ...updates }
          : t
      );
      setTags(newTags);
      saveToStorage('happyhome_tags', newTags);
      return newTags.find(t => t.id === id);
    }, [tags, saveToStorage]),
    
    delete: useCallback((id) => {
      const tag = tags.find(t => t.id === id);
      if (tag && tag.count > 0) {
        return { success: false, message: '该标签下有文章，无法删除' };
      }
      const newTags = tags.filter(t => t.id !== id);
      setTags(newTags);
      saveToStorage('happyhome_tags', newTags);
      return { success: true };
    }, [tags, saveToStorage]),
    
    incrementCount: useCallback((id) => {
      const newTags = tags.map(t => 
        t.id === id ? { ...t, count: t.count + 1 } : t
      );
      setTags(newTags);
      saveToStorage('happyhome_tags', newTags);
    }, [tags, saveToStorage]),
    
    decrementCount: useCallback((id) => {
      const newTags = tags.map(t => 
        t.id === id ? { ...t, count: Math.max(0, t.count - 1) } : t
      );
      setTags(newTags);
      saveToStorage('happyhome_tags', newTags);
    }, [tags, saveToStorage]),
  };

  const menusAPI = {
    getAll: useCallback(() => menus, [menus]),

    getById: useCallback((id) => menus.find(m => m.id === id), [menus]),

    getByLocation: useCallback((location) => menus.find(m => m.location === location), [menus]),

    create: useCallback((menu) => {
      const newMenu = {
        ...menu,
        id: Date.now(),
        items: menu.items || [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const newMenus = [newMenu, ...menus];
      setMenus(newMenus);
      saveToStorage('happyhome_menus', newMenus);
      return newMenu;
    }, [menus, saveToStorage]),

    update: useCallback((id, updates) => {
      const newMenus = menus.map(m =>
        m.id === id
          ? { ...m, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : m
      );
      setMenus(newMenus);
      saveToStorage('happyhome_menus', newMenus);
      return newMenus.find(m => m.id === id);
    }, [menus, saveToStorage]),

    delete: useCallback((id) => {
      const newMenus = menus.filter(m => m.id !== id);
      setMenus(newMenus);
      saveToStorage('happyhome_menus', newMenus);
      return true;
    }, [menus, saveToStorage]),

    addItem: useCallback((menuId, item) => {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return null;
      const newItem = {
        ...item,
        id: Date.now(),
        order: menu.items.length + 1,
      };
      const newItems = [...menu.items, newItem];
      const newMenus = menus.map(m =>
        m.id === menuId
          ? { ...m, items: newItems, updatedAt: new Date().toISOString().split('T')[0] }
          : m
      );
      setMenus(newMenus);
      saveToStorage('happyhome_menus', newMenus);
      return newItem;
    }, [menus, saveToStorage]),

    updateItem: useCallback((menuId, itemId, updates) => {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return null;
      const newItems = menu.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      const newMenus = menus.map(m =>
        m.id === menuId
          ? { ...m, items: newItems, updatedAt: new Date().toISOString().split('T')[0] }
          : m
      );
      setMenus(newMenus);
      saveToStorage('happyhome_menus', newMenus);
      return newItems.find(item => item.id === itemId);
    }, [menus, saveToStorage]),

    deleteItem: useCallback((menuId, itemId) => {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return false;
      const newItems = menu.items.filter(item => item.id !== itemId);
      const newMenus = menus.map(m =>
        m.id === menuId
          ? { ...m, items: newItems, updatedAt: new Date().toISOString().split('T')[0] }
          : m
      );
      setMenus(newMenus);
      saveToStorage('happyhome_menus', newMenus);
      return true;
    }, [menus, saveToStorage]),

    reorder: useCallback((menuId, orderedItems) => {
      const newMenus = menus.map(m =>
        m.id === menuId
          ? { ...m, items: orderedItems, updatedAt: new Date().toISOString().split('T')[0] }
          : m
      );
      setMenus(newMenus);
      saveToStorage('happyhome_menus', newMenus);
      return true;
    }, [menus, saveToStorage]),

    toggleEnabled: useCallback((menuId, itemId) => {
      const menu = menus.find(m => m.id === menuId);
      if (!menu) return null;
      const item = menu.items.find(i => i.id === itemId);
      if (!item) return null;
      const newItems = menu.items.map(i =>
        i.id === itemId ? { ...i, enabled: !i.enabled } : i
      );
      const newMenus = menus.map(m =>
        m.id === menuId
          ? { ...m, items: newItems, updatedAt: new Date().toISOString().split('T')[0] }
          : m
      );
      setMenus(newMenus);
      saveToStorage('happyhome_menus', newMenus);
      return newItems.find(i => i.id === itemId);
    }, [menus, saveToStorage]),
  };

  const commentsAPI = {
    getAll: useCallback(() => comments, [comments]),

    getById: useCallback((id) => comments.find(c => c.id === id), [comments]),

    getByPostId: useCallback((postId) => comments.filter(c => c.postId === postId), [comments]),

    getByStatus: useCallback((status) => comments.filter(c => c.status === status), [comments]),

    getReplies: useCallback((parentId) => comments.filter(c => c.parentId === parentId), [comments]),

    getReplyCount: useCallback((commentId) => comments.filter(c => c.parentId === commentId).length, [comments]),

    create: useCallback((comment) => {
      const newComment = {
        ...comment,
        id: Date.now(),
        status: comment.status || 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const newComments = [newComment, ...comments];
      setComments(newComments);
      saveToStorage('happyhome_comments', newComments);
      return newComment;
    }, [comments, saveToStorage]),

    update: useCallback((id, updates) => {
      const newComments = comments.map(c =>
        c.id === id
          ? { ...c, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : c
      );
      setComments(newComments);
      saveToStorage('happyhome_comments', newComments);
      return newComments.find(c => c.id === id);
    }, [comments, saveToStorage]),

    delete: useCallback((id) => {
      const newComments = comments.filter(c => c.id !== id && c.parentId !== id);
      setComments(newComments);
      saveToStorage('happyhome_comments', newComments);
      return true;
    }, [comments, saveToStorage]),

    approve: useCallback((id) => {
      return commentsAPI.update(id, { status: 'approved' });
    }, [comments]),

    spam: useCallback((id) => {
      return commentsAPI.update(id, { status: 'spam' });
    }, [comments]),

    trash: useCallback((id) => {
      return commentsAPI.update(id, { status: 'trash' });
    }, [comments]),

    reply: useCallback((parentId, replyData) => {
      const parent = comments.find(c => c.id === parentId);
      if (!parent) return null;
      return commentsAPI.create({
        ...replyData,
        postId: parent.postId,
        parentId: parentId,
      });
    }, [comments]),
  };

  const widgetsAPI = {
    getAll: useCallback(() => widgets, [widgets]),

    getById: useCallback((id) => widgets.find(w => w.id === id), [widgets]),

    getByLocation: useCallback((location) =>
      widgets.filter(w => w.location === location).sort((a, b) => a.order - b.order),
      [widgets]
    ),

    create: useCallback((widget) => {
      const maxOrder = widgets.filter(w => w.location === widget.location).reduce((max, w) => Math.max(max, w.order), -1);
      const newWidget = {
        ...widget,
        id: Date.now(),
        order: maxOrder + 1,
        enabled: widget.enabled !== false,
        config: widget.config || {},
      };
      const newWidgets = [...widgets, newWidget];
      setWidgets(newWidgets);
      saveToStorage('happyhome_widgets', newWidgets);
      return newWidget;
    }, [widgets, saveToStorage]),

    update: useCallback((id, updates) => {
      const newWidgets = widgets.map(w =>
        w.id === id ? { ...w, ...updates } : w
      );
      setWidgets(newWidgets);
      saveToStorage('happyhome_widgets', newWidgets);
      return newWidgets.find(w => w.id === id);
    }, [widgets, saveToStorage]),

    delete: useCallback((id) => {
      const newWidgets = widgets.filter(w => w.id !== id);
      setWidgets(newWidgets);
      saveToStorage('happyhome_widgets', newWidgets);
      return true;
    }, [widgets, saveToStorage]),

    toggleEnabled: useCallback((id) => {
      const widget = widgets.find(w => w.id === id);
      if (!widget) return null;
      return widgetsAPI.update(id, { enabled: !widget.enabled });
    }, [widgets]),

    reorder: useCallback((location, orderedIds) => {
      const locationWidgets = widgets.filter(w => w.location === location);
      const otherWidgets = widgets.filter(w => w.location !== location);
      const reorderedWidgets = orderedIds.map((id, index) => {
        const widget = locationWidgets.find(w => w.id === id);
        return { ...widget, order: index };
      });
      const newWidgets = [...otherWidgets, ...reorderedWidgets];
      setWidgets(newWidgets);
      saveToStorage('happyhome_widgets', newWidgets);
      return true;
    }, [widgets, saveToStorage]),
  };

  const createBackup = useCallback((name, type, data) => {
    const newBackup = {
      id: Date.now(),
      name,
      type,
      size: new Blob([JSON.stringify(data)]).size,
      createdAt: new Date().toISOString(),
      data,
    };
    const newBackups = [newBackup, ...backups];
    setBackups(newBackups);
    saveToStorage('happyhome_backups', newBackups);
    return newBackup;
  }, [backups, saveToStorage]);

  const backupAPI = {
    getAll: useCallback(() => backups, [backups]),

    getById: useCallback((id) => backups.find(b => b.id === id), [backups]),

    create: createBackup,

    createFullBackup: useCallback(() => {
      const fullData = {
        posts,
        pages,
        users: users.map(u => {
          const { password, ...userWithoutPassword } = u;
          return userWithoutPassword;
        }),
        categories,
        tags,
        menus,
        settings,
        comments,
        widgets,
      };
      return createBackup(`完整备份 ${new Date().toLocaleString()}`, 'full', fullData);
    }, [posts, pages, users, categories, tags, menus, settings, comments, widgets, createBackup]),

    createCustomBackup: useCallback((name, type, data) => {
      return createBackup(name, type, data);
    }, [createBackup]),

    restore: useCallback((id) => {
      const backup = backups.find(b => b.id === id);
      if (!backup) return { success: false, message: '备份不存在' };

      const { data } = backup;
      if (data.posts) setPosts(data.posts);
      if (data.pages) setPages(data.pages);
      if (data.users) {
        const usersWithPassword = data.users.map(u => {
          const existing = users.find(existing => existing.id === u.id);
          return existing ? { ...u, password: existing.password } : u;
        });
        setUsers(usersWithPassword);
      }
      if (data.categories) setCategories(data.categories);
      if (data.tags) setTags(data.tags);
      if (data.menus) setMenus(data.menus);
      if (data.settings) setSettings(data.settings);
      if (data.comments) setComments(data.comments);
      if (data.widgets) setWidgets(data.widgets);

      // 保存到本地存储
      if (data.posts) saveToStorage('happyhome_posts', data.posts);
      if (data.pages) saveToStorage('happyhome_pages', data.pages);
      if (data.users) {
        const usersWithPassword = data.users.map(u => {
          const existing = users.find(existing => existing.id === u.id);
          return existing ? { ...u, password: existing.password } : u;
        });
        saveToStorage('happyhome_users', usersWithPassword);
      }
      if (data.categories) saveToStorage('happyhome_categories', data.categories);
      if (data.tags) saveToStorage('happyhome_tags', data.tags);
      if (data.menus) saveToStorage('happyhome_menus', data.menus);
      if (data.settings) saveToStorage('happyhome_settings', data.settings);
      if (data.comments) saveToStorage('happyhome_comments', data.comments);
      if (data.widgets) saveToStorage('happyhome_widgets', data.widgets);

      return { success: true, message: '备份恢复成功' };
    }, [backups, users, saveToStorage]),

    delete: useCallback((id) => {
      const newBackups = backups.filter(b => b.id !== id);
      setBackups(newBackups);
      saveToStorage('happyhome_backups', newBackups);
      return true;
    }, [backups, saveToStorage]),

    download: useCallback((id) => {
      const backup = backups.find(b => b.id === id);
      if (!backup) return false;

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backup.name}-${backup.createdAt.split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }, [backups]),

    exportData: useCallback((type) => {
      let exportData = {};
      switch (type) {
        case 'posts':
          exportData = { posts, exportedAt: new Date().toISOString() };
          break;
        case 'pages':
          exportData = { pages, exportedAt: new Date().toISOString() };
          break;
        case 'comments':
          exportData = { comments, exportedAt: new Date().toISOString() };
          break;
        case 'full':
        default:
          exportData = {
            posts,
            pages,
            categories,
            tags,
            menus,
            comments,
            exportedAt: new Date().toISOString(),
          };
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${type}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }, [posts, pages, categories, tags, menus, comments]),

    importData: useCallback((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (data.posts) {
              setPosts(data.posts);
              saveToStorage('happyhome_posts', data.posts);
            }
            if (data.pages) {
              setPages(data.pages);
              saveToStorage('happyhome_pages', data.pages);
            }
            if (data.categories) {
              setCategories(data.categories);
              saveToStorage('happyhome_categories', data.categories);
            }
            if (data.tags) {
              setTags(data.tags);
              saveToStorage('happyhome_tags', data.tags);
            }
            if (data.menus) {
              setMenus(data.menus);
              saveToStorage('happyhome_menus', data.menus);
            }
            if (data.comments) {
              setComments(data.comments);
              saveToStorage('happyhome_comments', data.comments);
            }
            resolve({ success: true, message: '数据导入成功' });
          } catch (error) {
            reject({ success: false, message: '文件格式错误' });
          }
        };
        reader.onerror = () => reject({ success: false, message: '读取文件失败' });
        reader.readAsText(file);
      });
    }, [saveToStorage]),

    exportPostsAsMarkdown: useCallback((postId) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return false;

      let markdown = `# ${post.title}\n\n`;
      markdown += `> ${post.excerpt || ''}\n\n`;
      markdown += `**分类**: ${post.category || '未分类'}  **标签**: ${(post.tags || []).join(', ')}\n\n`;
      markdown += `---\n\n`;
      markdown += post.content.replace(/<[^>]+>/g, '') + '\n\n';
      markdown += `---\n\n`;
      markdown += `*创建于: ${post.createdAt}*\n`;

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${post.title}-${post.createdAt}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }, [posts]),
  };

  const MAX_REVISIONS_PER_POST = 10;

  const revisionsAPI = {
    getAll: useCallback(() => revisions, [revisions]),

    getByPostId: useCallback((postId) =>
      revisions.filter(r => r.postId === postId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      [revisions]
    ),

    getById: useCallback((id) => revisions.find(r => r.id === id), [revisions]),

    create: useCallback((postId, postData) => {
      const newRevision = {
        id: Date.now(),
        postId,
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        author: postData.author || 'admin',
        createdAt: new Date().toISOString(),
      };
      const postRevisions = revisions.filter(r => r.postId === postId);
      const otherRevisions = revisions.filter(r => r.postId !== postId);

      let updatedRevisions = [newRevision, ...postRevisions];
      if (updatedRevisions.length > MAX_REVISIONS_PER_POST) {
        updatedRevisions = updatedRevisions.slice(0, MAX_REVISIONS_PER_POST);
      }

      const newRevisions = [...otherRevisions, ...updatedRevisions];
      setRevisions(newRevisions);
      saveToStorage('happyhome_revisions', newRevisions);
      return newRevision;
    }, [revisions, saveToStorage]),

    restore: useCallback((revisionId) => {
      const revision = revisions.find(r => r.id === revisionId);
      if (!revision) return null;

      const post = posts.find(p => p.id === revision.postId);
      if (!post) return null;

      const updatedPost = {
        ...post,
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      postsAPI.update(revision.postId, updatedPost);
      return revision;
    }, [revisions, posts, postsAPI]),

    delete: useCallback((id) => {
      const newRevisions = revisions.filter(r => r.id !== id);
      setRevisions(newRevisions);
      saveToStorage('happyhome_revisions', newRevisions);
      return true;
    }, [revisions, saveToStorage]),

    deleteByPostId: useCallback((postId) => {
      const newRevisions = revisions.filter(r => r.postId !== postId);
      setRevisions(newRevisions);
      saveToStorage('happyhome_revisions', newRevisions);
      return true;
    }, [revisions, saveToStorage]),

    deleteOldRevisions: useCallback((postId, keepCount = 5) => {
      const postRevisions = revisions.filter(r => r.postId === postId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const toDelete = postRevisions.slice(keepCount);
      const toKeep = postRevisions.slice(0, keepCount);
      const otherRevisions = revisions.filter(r => r.postId !== postId);
      const newRevisions = [...toKeep, ...otherRevisions];
      setRevisions(newRevisions);
      saveToStorage('happyhome_revisions', newRevisions);
      return toDelete.length;
    }, [revisions, saveToStorage]),
  };

  const customCSSAPI = {
    get: useCallback(() => customCSS, [customCSS]),

    update: useCallback((updates) => {
      const newCustomCSS = { ...customCSS, ...updates };
      setCustomCSS(newCustomCSS);
      saveToStorage('happyhome_customcss', newCustomCSS);
      return newCustomCSS;
    }, [customCSS, saveToStorage]),

    reset: useCallback(() => {
      setCustomCSS(initialCustomCSS);
      saveToStorage('happyhome_customcss', initialCustomCSS);
      return initialCustomCSS;
    }, [saveToStorage]),
  };

  const resetAllData = useCallback(() => {
    setPosts(initialPosts);
    setPages(initialPages);
    setUsers(initialUsers);
    setMedia(initialMedia);
    setCategories(initialCategories);
    setTags(initialTags);
    setMenus(initialMenus);
    setSettings(initialSettings);
    setComments(initialComments);
    setWidgets(initialWidgets);
    localStorage.removeItem('happyhome_posts');
    localStorage.removeItem('happyhome_pages');
    localStorage.removeItem('happyhome_users');
    localStorage.removeItem('happyhome_media');
    localStorage.removeItem('happyhome_categories');
    localStorage.removeItem('happyhome_tags');
    localStorage.removeItem('happyhome_menus');
    localStorage.removeItem('happyhome_settings');
    localStorage.removeItem('happyhome_comments');
    localStorage.removeItem('happyhome_widgets');
  }, []);

  const clearAllData = useCallback(() => {
    setPosts([]);
    setPages([]);
    setUsers([]);
    setMedia([]);
    setCategories([]);
    setTags([]);
    setMenus([]);
    setSettings(initialSettings);
    setComments([]);
    setWidgets([]);
    localStorage.removeItem('happyhome_posts');
    localStorage.removeItem('happyhome_pages');
    localStorage.removeItem('happyhome_users');
    localStorage.removeItem('happyhome_media');
    localStorage.removeItem('happyhome_categories');
    localStorage.removeItem('happyhome_tags');
    localStorage.removeItem('happyhome_menus');
    localStorage.removeItem('happyhome_settings');
    localStorage.removeItem('happyhome_comments');
    localStorage.removeItem('happyhome_widgets');
  }, []);

  const value = {
    posts,
    pages,
    users,
    media,
    categories,
    tags,
    menus,
    settings,
    comments,
    widgets,
    backups,
    customCSS,
    revisions,
    isInitialized,
    postsAPI,
    pagesAPI,
    usersAPI,
    mediaAPI,
    categoriesAPI,
    tagsAPI,
    menusAPI,
    commentsAPI,
    widgetsAPI,
    settingsAPI,
    backupAPI,
    customCSSAPI,
    revisionsAPI,
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
