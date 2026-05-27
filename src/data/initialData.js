export const initialPosts = [
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

export const initialPages = [
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

export const initialUsers = [
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

export const initialMedia = [
  {
    id: 1,
    name: 'sample-image.jpg',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    size: '256 KB',
    type: 'image/jpeg',
    uploadedAt: '2024-01-01',
  },
];

export const initialCategories = [
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

export const initialTags = [
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

export const initialMenus = [
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

export const initialSettings = {
  siteName: 'HappyHome',
  siteDescription: '一个功能强大、易于使用的建站平台',
  siteUrl: window.location.origin,
  adminEmail: 'admin@example.com',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  postsPerPage: 10,
  commentsModeration: true,
  registrationEnabled: false,
  quickLoginEnabled: false,
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

export const initialComments = [
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

export const initialWidgets = [
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

export const initialCustomCSS = {
  customCSS: '',
  customJS: '',
  customHead: '',
};

export const initialBackups = [];

export const initialRevisions = [];