// 本地数据存储管理
const STORAGE_KEYS = {
  POSTS: 'happyhome_posts',
  PAGES: 'happyhome_pages',
  USERS: 'happyhome_users',
  MEDIA: 'happyhome_media',
  SETTINGS: 'happyhome_settings',
  TUTORIAL: 'happyhome_tutorial',
};

// 默认初始数据
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

// 数据存储类
class DataStore {
  static get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  // 初始化数据（如果不存在）
  static initialize() {
    if (!this.get(STORAGE_KEYS.POSTS)) {
      this.set(STORAGE_KEYS.POSTS, defaultPosts);
    }
    if (!this.get(STORAGE_KEYS.PAGES)) {
      this.set(STORAGE_KEYS.PAGES, defaultPages);
    }
    if (!this.get(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, defaultUsers);
    }
    if (!this.get(STORAGE_KEYS.MEDIA)) {
      this.set(STORAGE_KEYS.MEDIA, defaultMedia);
    }
    if (!this.get(STORAGE_KEYS.SETTINGS)) {
      this.set(STORAGE_KEYS.SETTINGS, defaultSettings);
    }
    if (!this.get(STORAGE_KEYS.TUTORIAL)) {
      this.set(STORAGE_KEYS.TUTORIAL, defaultTutorial);
    }
  }

  // 重置所有数据
  static reset() {
    this.set(STORAGE_KEYS.POSTS, defaultPosts);
    this.set(STORAGE_KEYS.PAGES, defaultPages);
    this.set(STORAGE_KEYS.USERS, defaultUsers);
    this.set(STORAGE_KEYS.MEDIA, defaultMedia);
    this.set(STORAGE_KEYS.SETTINGS, defaultSettings);
    this.set(STORAGE_KEYS.TUTORIAL, defaultTutorial);
  }
}

// 导出存储键常量
export { STORAGE_KEYS };

// 导出posts操作
export const postsAPI = {
  getAll: () => DataStore.get(STORAGE_KEYS.POSTS) || [],
  
  getById: (id) => {
    const posts = DataStore.get(STORAGE_KEYS.POSTS) || [];
    return posts.find(p => p.id === id);
  },
  
  create: (post) => {
    const posts = DataStore.get(STORAGE_KEYS.POSTS) || [];
    const newPost = {
      ...post,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      views: 0,
    };
    posts.unshift(newPost);
    DataStore.set(STORAGE_KEYS.POSTS, posts);
    return newPost;
  },
  
  update: (id, updates) => {
    const posts = DataStore.get(STORAGE_KEYS.POSTS) || [];
    const index = posts.findIndex(p => p.id === id);
    if (index !== -1) {
      posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      DataStore.set(STORAGE_KEYS.POSTS, posts);
      return posts[index];
    }
    return null;
  },
  
  delete: (id) => {
    const posts = DataStore.get(STORAGE_KEYS.POSTS) || [];
    const filtered = posts.filter(p => p.id !== id);
    DataStore.set(STORAGE_KEYS.POSTS, filtered);
    return true;
  },
};

// 导出pages操作
export const pagesAPI = {
  getAll: () => DataStore.get(STORAGE_KEYS.PAGES) || [],
  
  getById: (id) => {
    const pages = DataStore.get(STORAGE_KEYS.PAGES) || [];
    return pages.find(p => p.id === id);
  },
  
  create: (page) => {
    const pages = DataStore.get(STORAGE_KEYS.PAGES) || [];
    const newPage = {
      ...page,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    pages.unshift(newPage);
    DataStore.set(STORAGE_KEYS.PAGES, pages);
    return newPage;
  },
  
  update: (id, updates) => {
    const pages = DataStore.get(STORAGE_KEYS.PAGES) || [];
    const index = pages.findIndex(p => p.id === id);
    if (index !== -1) {
      pages[index] = { ...pages[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      DataStore.set(STORAGE_KEYS.PAGES, pages);
      return pages[index];
    }
    return null;
  },
  
  delete: (id) => {
    const pages = DataStore.get(STORAGE_KEYS.PAGES) || [];
    const filtered = pages.filter(p => p.id !== id);
    DataStore.set(STORAGE_KEYS.PAGES, filtered);
    return true;
  },
};

// 导出users操作
export const usersAPI = {
  getAll: () => DataStore.get(STORAGE_KEYS.USERS) || [],
  
  getById: (id) => {
    const users = DataStore.get(STORAGE_KEYS.USERS) || [];
    return users.find(u => u.id === id);
  },
  
  getByUsername: (username) => {
    const users = DataStore.get(STORAGE_KEYS.USERS) || [];
    return users.find(u => u.username === username);
  },
  
  login: (username, password) => {
    const users = DataStore.get(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: '用户名或密码错误' };
  },
  
  create: (user) => {
    const users = DataStore.get(STORAGE_KEYS.USERS) || [];
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
    DataStore.set(STORAGE_KEYS.USERS, users);
    return { success: true, user: newUser };
  },
  
  update: (id, updates) => {
    const users = DataStore.get(STORAGE_KEYS.USERS) || [];
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      DataStore.set(STORAGE_KEYS.USERS, users);
      return { success: true, user: users[index] };
    }
    return { success: false, message: '用户不存在' };
  },
  
  delete: (id) => {
    const users = DataStore.get(STORAGE_KEYS.USERS) || [];
    if (users.length <= 1) {
      return { success: false, message: '不能删除最后一个用户' };
    }
    const filtered = users.filter(u => u.id !== id);
    DataStore.set(STORAGE_KEYS.USERS, filtered);
    return { success: true };
  },
};

// 导出media操作
export const mediaAPI = {
  getAll: () => DataStore.get(STORAGE_KEYS.MEDIA) || [],
  
  upload: (file, url) => {
    const media = DataStore.get(STORAGE_KEYS.MEDIA) || [];
    const newMedia = {
      id: Date.now(),
      name: file.name,
      url: url,
      size: formatFileSize(file.size),
      type: file.type,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    media.unshift(newMedia);
    DataStore.set(STORAGE_KEYS.MEDIA, media);
    return newMedia;
  },
  
  delete: (id) => {
    const media = DataStore.get(STORAGE_KEYS.MEDIA) || [];
    const filtered = media.filter(m => m.id !== id);
    DataStore.set(STORAGE_KEYS.MEDIA, filtered);
    return true;
  },
};

// 导出settings操作
export const settingsAPI = {
  get: () => DataStore.get(STORAGE_KEYS.SETTINGS) || defaultSettings,
  
  update: (updates) => {
    const settings = DataStore.get(STORAGE_KEYS.SETTINGS) || defaultSettings;
    const newSettings = { ...settings, ...updates };
    DataStore.set(STORAGE_KEYS.SETTINGS, newSettings);
    return newSettings;
  },
};

// 导出tutorial操作
export const tutorialAPI = {
  get: () => DataStore.get(STORAGE_KEYS.TUTORIAL) || defaultTutorial,
  
  completeStep: (step) => {
    const tutorial = DataStore.get(STORAGE_KEYS.TUTORIAL) || defaultTutorial;
    tutorial.steps[step] = true;
    
    // 检查是否全部完成
    const allComplete = Object.values(tutorial.steps).every(v => v);
    if (allComplete) {
      tutorial.completed = true;
    }
    
    DataStore.set(STORAGE_KEYS.TUTORIAL, tutorial);
    return tutorial;
  },
  
  reset: () => {
    DataStore.set(STORAGE_KEYS.TUTORIAL, defaultTutorial);
    return defaultTutorial;
  },
};

// 辅助函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 导出DataStore
export { DataStore };
