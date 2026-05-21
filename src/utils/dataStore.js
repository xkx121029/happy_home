const STORAGE_KEYS = {
  POSTS: 'happyhome_posts',
  PAGES: 'happyhome_pages',
  USERS: 'happyhome_users',
  MEDIA: 'happyhome_media',
  SETTINGS: 'happyhome_settings',
  TUTORIAL: 'happyhome_tutorial',
};

const defaultPosts = [
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

const defaultPages = [
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

const defaultUsers = [
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

const defaultMedia = [
  {
    id: 1,
    name: 'sample-image.jpg',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    size: '256 KB',
    type: 'image/jpeg',
    uploadedAt: '2024-01-01',
  },
];

const defaultSettings = {
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

const defaultTutorial = {
  completed: false,
  steps: {
    createPost: false,
    createPage: false,
    uploadMedia: false,
    customizeTheme: false,
    createUser: false,
  },
};

class DataStore {
  static safeGet(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  static safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }

  static safeRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  static initialize() {
    if (!this.safeGet(STORAGE_KEYS.POSTS)) {
      this.safeSet(STORAGE_KEYS.POSTS, defaultPosts);
    }
    if (!this.safeGet(STORAGE_KEYS.PAGES)) {
      this.safeSet(STORAGE_KEYS.PAGES, defaultPages);
    }
    if (!this.safeGet(STORAGE_KEYS.USERS)) {
      this.safeSet(STORAGE_KEYS.USERS, defaultUsers);
    }
    if (!this.safeGet(STORAGE_KEYS.MEDIA)) {
      this.safeSet(STORAGE_KEYS.MEDIA, defaultMedia);
    }
    if (!this.safeGet(STORAGE_KEYS.SETTINGS)) {
      this.safeSet(STORAGE_KEYS.SETTINGS, defaultSettings);
    }
    if (!this.safeGet(STORAGE_KEYS.TUTORIAL)) {
      this.safeSet(STORAGE_KEYS.TUTORIAL, defaultTutorial);
    }
  }

  static reset() {
    this.safeSet(STORAGE_KEYS.POSTS, defaultPosts);
    this.safeSet(STORAGE_KEYS.PAGES, defaultPages);
    this.safeSet(STORAGE_KEYS.USERS, defaultUsers);
    this.safeSet(STORAGE_KEYS.MEDIA, defaultMedia);
    this.safeSet(STORAGE_KEYS.SETTINGS, defaultSettings);
    this.safeSet(STORAGE_KEYS.TUTORIAL, defaultTutorial);
  }

  static clearAll() {
    this.safeRemove(STORAGE_KEYS.POSTS);
    this.safeRemove(STORAGE_KEYS.PAGES);
    this.safeRemove(STORAGE_KEYS.USERS);
    this.safeRemove(STORAGE_KEYS.MEDIA);
    this.safeRemove(STORAGE_KEYS.SETTINGS);
    this.safeRemove(STORAGE_KEYS.TUTORIAL);
  }
}

export { STORAGE_KEYS };

export const postsAPI = {
  getAll: () => {
    const posts = DataStore.safeGet(STORAGE_KEYS.POSTS, []);
    return Array.isArray(posts) ? posts : [];
  },
  
  getById: (id) => {
    const posts = postsAPI.getAll();
    return posts.find(p => p.id === id);
  },
  
  create: (post) => {
    const posts = postsAPI.getAll();
    const newPost = {
      ...post,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      views: 0,
    };
    posts.unshift(newPost);
    DataStore.safeSet(STORAGE_KEYS.POSTS, posts);
    return newPost;
  },
  
  update: (id, updates) => {
    const posts = postsAPI.getAll();
    const index = posts.findIndex(p => p.id === id);
    if (index !== -1) {
      posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      DataStore.safeSet(STORAGE_KEYS.POSTS, posts);
      return posts[index];
    }
    return null;
  },
  
  delete: (id) => {
    const posts = postsAPI.getAll();
    const filtered = posts.filter(p => p.id !== id);
    DataStore.safeSet(STORAGE_KEYS.POSTS, filtered);
    return true;
  },
};

export const pagesAPI = {
  getAll: () => {
    const pages = DataStore.safeGet(STORAGE_KEYS.PAGES, []);
    return Array.isArray(pages) ? pages : [];
  },
  
  getById: (id) => {
    const pages = pagesAPI.getAll();
    return pages.find(p => p.id === id);
  },
  
  create: (page) => {
    const pages = pagesAPI.getAll();
    const newPage = {
      ...page,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    pages.unshift(newPage);
    DataStore.safeSet(STORAGE_KEYS.PAGES, pages);
    return newPage;
  },
  
  update: (id, updates) => {
    const pages = pagesAPI.getAll();
    const index = pages.findIndex(p => p.id === id);
    if (index !== -1) {
      pages[index] = { ...pages[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      DataStore.safeSet(STORAGE_KEYS.PAGES, pages);
      return pages[index];
    }
    return null;
  },
  
  delete: (id) => {
    const pages = pagesAPI.getAll();
    const filtered = pages.filter(p => p.id !== id);
    DataStore.safeSet(STORAGE_KEYS.PAGES, filtered);
    return true;
  },
};

export const usersAPI = {
  getAll: () => {
    const users = DataStore.safeGet(STORAGE_KEYS.USERS, []);
    return Array.isArray(users) ? users : [];
  },
  
  getById: (id) => {
    const users = usersAPI.getAll();
    return users.find(u => u.id === id);
  },
  
  getByUsername: (username) => {
    const users = usersAPI.getAll();
    return users.find(u => u.username === username);
  },
  
  login: (username, password) => {
    const users = usersAPI.getAll();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: '用户名或密码错误' };
  },
  
  create: (user) => {
    const users = usersAPI.getAll();
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
    users.unshift(newUser);
    DataStore.safeSet(STORAGE_KEYS.USERS, users);
    return { success: true, user: newUser };
  },
  
  update: (id, updates) => {
    const users = usersAPI.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      DataStore.safeSet(STORAGE_KEYS.USERS, users);
      return { success: true, user: users[index] };
    }
    return { success: false, message: '用户不存在' };
  },
  
  delete: (id) => {
    const users = usersAPI.getAll();
    if (users.length <= 1) {
      return { success: false, message: '不能删除最后一个用户' };
    }
    const filtered = users.filter(u => u.id !== id);
    DataStore.safeSet(STORAGE_KEYS.USERS, filtered);
    return { success: true };
  },
};

export const mediaAPI = {
  getAll: () => {
    const media = DataStore.safeGet(STORAGE_KEYS.MEDIA, []);
    return Array.isArray(media) ? media : [];
  },
  
  upload: (file, url) => {
    const media = mediaAPI.getAll();
    const newMedia = {
      id: Date.now(),
      name: file.name,
      url: url,
      size: formatFileSize(file.size),
      type: file.type,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    media.unshift(newMedia);
    DataStore.safeSet(STORAGE_KEYS.MEDIA, media);
    return newMedia;
  },
  
  delete: (id) => {
    const media = mediaAPI.getAll();
    const filtered = media.filter(m => m.id !== id);
    DataStore.safeSet(STORAGE_KEYS.MEDIA, filtered);
    return true;
  },
};

export const settingsAPI = {
  get: () => {
    const settings = DataStore.safeGet(STORAGE_KEYS.SETTINGS);
    return settings || { ...defaultSettings };
  },
  
  update: (updates) => {
    const settings = settingsAPI.get();
    const newSettings = { ...settings, ...updates };
    DataStore.safeSet(STORAGE_KEYS.SETTINGS, newSettings);
    return newSettings;
  },
};

export const tutorialAPI = {
  get: () => {
    const tutorial = DataStore.safeGet(STORAGE_KEYS.TUTORIAL);
    return tutorial || { ...defaultTutorial };
  },
  
  completeStep: (step) => {
    const tutorial = tutorialAPI.get();
    tutorial.steps[step] = true;
    const allComplete = Object.values(tutorial.steps).every(v => v);
    if (allComplete) {
      tutorial.completed = true;
    }
    DataStore.safeSet(STORAGE_KEYS.TUTORIAL, tutorial);
    return tutorial;
  },
  
  reset: () => {
    DataStore.safeSet(STORAGE_KEYS.TUTORIAL, defaultTutorial);
    return defaultTutorial;
  },
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export { DataStore };
