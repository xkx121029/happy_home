const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = 'happyhome_jwt_secret_key';
const JWT_EXPIRES_IN = '7d';

let posts = [
  {
    id: '1',
    title: '欢迎来到 HappyHome',
    content: '<h2>欢迎使用 HappyHome 建站平台！</h2><p>这是一个功能强大、易于使用的建站解决方案。</p>',
    excerpt: '欢迎使用 HappyHome 建站平台！',
    category: '公告',
    status: 'published',
    author: 'admin',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    title: '如何创建文章',
    content: '<h2>创建文章指南</h2><p>在管理后台点击"新建文章"即可创建新文章。</p>',
    excerpt: '创建文章的简单指南',
    category: '教程',
    status: 'published',
    author: 'admin',
    createdAt: '2024-01-02T14:30:00Z',
    updatedAt: '2024-01-02T14:30:00Z'
  }
];

let pages = [
  {
    id: '1',
    title: '关于我们',
    content: '<h2>关于 HappyHome</h2><p>我们致力于为每个人提供简单易用的建站解决方案。</p>',
    slug: 'about',
    status: 'published',
    author: 'admin',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    title: '联系我们',
    content: '<h2>联系我们</h2><p>邮箱：contact@happyhome.com</p><p>电话：400-123-4567</p>',
    slug: 'contact',
    status: 'published',
    author: 'admin',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  }
];

let users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'administrator',
    status: 'active',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  }
];

let media = [
  {
    id: '1',
    name: 'sample-image.jpg',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    size: '256 KB',
    type: 'image/jpeg',
    uploadedAt: '2024-01-01T10:00:00Z'
  }
];

let settings = {
  siteName: 'HappyHome',
  siteDescription: '一个功能强大、易于使用的建站平台',
  siteUrl: 'http://localhost:3000',
  tagline: '简单而强大',
  adminEmail: 'admin@example.com',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  dateFormat: 'Y-m-d',
  timeFormat: '24h',
  theme: 'default',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#ec4899',
  backgroundColor: '#f9fafb',
  textColor: '#1f2937',
  fontFamily: 'system',
  fontSize: 16,
  lineHeight: 1.6,
  layout: 'wide',
  sidebarPosition: 'left',
  postsPerPage: 10,
  postsPerFeed: 20,
  excerptLength: 150,
  enableComments: true,
  commentsModeration: true,
  allowGuestComments: false,
  requireNameEmail: true,
  autoApproval: true,
  enableRevisions: true,
  revisionLimit: 25,
  defaultPostStatus: 'draft',
  enablePingbacks: true,
  registrationEnabled: false,
  defaultRole: 'subscriber',
  emailVerification: true,
  moderateNewUsers: false,
  enableAvatars: true,
  avatarType: 'gravatar',
  enableProfileFields: true,
  enableUserBio: true,
  twoFactorAuth: false,
  loginLimit: 'none',
  sessionTimeout: '24',
  enableSSL: false,
  allowFileEdits: false,
  enableDebug: false,
  errorReporting: true,
  notifyNewComment: true,
  notifyNewUser: true,
  notifyPostApproval: true,
  notifyUpdates: true,
  notifySecurity: true,
  emailFormat: 'html',
  emailFromName: '网站名称',
  emailFromAddress: 'no-reply@example.com',
  maxUploadSize: '10',
  allowedFileTypes: {
    images: true,
    documents: true,
    videos: false,
    audio: false
  },
  autoResizeImages: true,
  maxImageWidth: 1920,
  maxImageHeight: 1080,
  imageQuality: 85,
  generateThumbnails: true,
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',
  smtpEncryption: 'none',
  enableCaching: true,
  cacheDuration: '86400',
  minifyHTML: true,
  minifyCSS: true,
  minifyJS: true,
  lazyLoadImages: true,
  enableGzip: true,
  metaTitleSeparator: '-',
  metaKeywords: 'CMS,博客,网站',
  enableOpenGraph: true,
  enableTwitterCards: true,
  enableRobotsTxt: true,
  enableSitemap: true,
  analyticsEnabled: true,
  googleAnalyticsId: '',
  enableHeatmaps: false,
  trackPageViews: true,
  trackEvents: true,
  trackErrors: true,
  enableSocialShare: true,
  shareServices: {
    twitter: true,
    facebook: true,
    linkedin: true,
    weibo: true,
    wechat: true
  },
  apiEnabled: true,
  apiRateLimit: '60',
  apiKey: '',
  autoBackup: true,
  backupFrequency: 'daily',
  backupRetention: '30'
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '无效的令牌' });
    }
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
  };
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ success: false, message: '账户未激活' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写所有字段' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: bcrypt.hashSync(password, 10),
      role: 'author',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

app.get('/api/posts', (req, res) => {
  try {
    let filteredPosts = posts;

    if (req.query.status) {
      filteredPosts = filteredPosts.filter(p => p.status === req.query.status);
    }

    if (req.query.category) {
      filteredPosts = filteredPosts.filter(p => p.category === req.query.category);
    }

    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      filteredPosts = filteredPosts.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.content.toLowerCase().includes(search)
      );
    }

    res.json({
      success: true,
      data: filteredPosts,
      count: filteredPosts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/posts/:id', (req, res) => {
  try {
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/posts', authenticateToken, (req, res) => {
  try {
    const { title, content, excerpt, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '请填写标题和内容' });
    }

    const newPost = {
      id: uuidv4(),
      title,
      content,
      excerpt: excerpt || content.substring(0, 100).replace(/<[^>]*>/g, '') + '...',
      category: category || '未分类',
      status: status || 'draft',
      author: req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    posts.unshift(newPost);

    res.status(201).json({ success: true, message: '文章创建成功', data: newPost });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/posts/:id', authenticateToken, (req, res) => {
  try {
    const { title, content, excerpt, category, status } = req.body;
    const index = posts.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    posts[index] = {
      ...posts[index],
      title: title || posts[index].title,
      content: content || posts[index].content,
      excerpt: excerpt || posts[index].excerpt,
      category: category || posts[index].category,
      status: status || posts[index].status,
      updatedAt: new Date().toISOString()
    };

    res.json({ success: true, message: '文章更新成功', data: posts[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  try {
    const index = posts.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    const deletedPost = posts.splice(index, 1)[0];
    res.json({ success: true, message: '文章删除成功', data: deletedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/pages', (req, res) => {
  try {
    let filteredPages = pages;

    if (req.query.status) {
      filteredPages = filteredPages.filter(p => p.status === req.query.status);
    }

    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      filteredPages = filteredPages.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.slug.toLowerCase().includes(search)
      );
    }

    res.json({
      success: true,
      data: filteredPages,
      count: filteredPages.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/pages/:id', (req, res) => {
  try {
    const page = pages.find(p => p.id === req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, message: '页面不存在' });
    }
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/pages', authenticateToken, (req, res) => {
  try {
    const { title, content, slug, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '请填写标题和内容' });
    }

    const newPage = {
      id: uuidv4(),
      title,
      content,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      status: status || 'draft',
      author: req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    pages.push(newPage);

    res.status(201).json({ success: true, message: '页面创建成功', data: newPage });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/pages/:id', authenticateToken, (req, res) => {
  try {
    const { title, content, slug, status } = req.body;
    const index = pages.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: '页面不存在' });
    }

    pages[index] = {
      ...pages[index],
      title: title || pages[index].title,
      content: content || pages[index].content,
      slug: slug || pages[index].slug,
      status: status || pages[index].status,
      updatedAt: new Date().toISOString()
    };

    res.json({ success: true, message: '页面更新成功', data: pages[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/pages/:id', authenticateToken, (req, res) => {
  try {
    const index = pages.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: '页面不存在' });
    }

    const deletedPage = pages.splice(index, 1)[0];
    res.json({ success: true, message: '页面删除成功', data: deletedPage });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/users', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    let filteredUsers = users;

    if (req.query.status) {
      filteredUsers = filteredUsers.filter(u => u.status === req.query.status);
    }

    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    const sanitizedUsers = filteredUsers.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    res.json({
      success: true,
      data: sanitizedUsers,
      count: sanitizedUsers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/users', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    const { username, email, password, role, status } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '请填写用户名、邮箱和密码' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: bcrypt.hashSync(password, 10),
      role: role || 'author',
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    const { username, email, password, role, status } = req.body;
    const index = users.findIndex(u => u.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const updates = {
      username: username || users[index].username,
      email: email || users[index].email,
      role: role || users[index].role,
      status: status || users[index].status,
      updatedAt: new Date().toISOString()
    };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: '密码长度至少6位' });
      }
      updates.password = bcrypt.hashSync(password, 10);
    }

    users[index] = { ...users[index], ...updates };

    res.json({
      success: true,
      message: '用户更新成功',
      data: {
        id: users[index].id,
        username: users[index].username,
        email: users[index].email,
        role: users[index].role,
        status: users[index].status,
        createdAt: users[index].createdAt,
        updatedAt: users[index].updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (users[index].role === 'administrator') {
      return res.status(400).json({ success: false, message: '不能删除管理员账户' });
    }

    const deletedUser = users.splice(index, 1)[0];
    res.json({
      success: true,
      message: '用户删除成功',
      data: {
        id: deletedUser.id,
        username: deletedUser.username,
        email: deletedUser.email,
        role: deletedUser.role,
        status: deletedUser.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/media', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      data: media,
      count: media.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/media', authenticateToken, (req, res) => {
  try {
    const { name, url, size, type } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, message: '请提供文件名和URL' });
    }

    const newMedia = {
      id: uuidv4(),
      name,
      url,
      size: size || '未知',
      type: type || 'image/jpeg',
      uploadedAt: new Date().toISOString()
    };

    media.push(newMedia);

    res.status(201).json({ success: true, message: '媒体文件上传成功', data: newMedia });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.delete('/api/media/:id', authenticateToken, (req, res) => {
  try {
    const index = media.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: '媒体文件不存在' });
    }

    const deletedMedia = media.splice(index, 1)[0];
    res.json({ success: true, message: '媒体文件删除成功', data: deletedMedia });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/settings', authenticateToken, (req, res) => {
  try {
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.put('/api/settings', authenticateToken, requireRole('administrator'), (req, res) => {
  try {
    settings = { ...settings, ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, message: '设置更新成功', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/posts', (req, res) => {
  try {
    const publishedPosts = posts.filter(p => p.status === 'published');
    
    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      publishedPosts = publishedPosts.filter(p =>
        p.title.toLowerCase().includes(search) ||
        p.content.toLowerCase().includes(search)
      );
    }

    res.json({
      success: true,
      data: publishedPosts,
      count: publishedPosts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/posts/:id', (req, res) => {
  try {
    const post = posts.find(p => p.id === req.params.id && p.status === 'published');
    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/pages', (req, res) => {
  try {
    const publishedPages = pages.filter(p => p.status === 'published');
    res.json({
      success: true,
      data: publishedPages,
      count: publishedPages.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/pages/:slug', (req, res) => {
  try {
    const page = pages.find(p => p.slug === req.params.slug && p.status === 'published');
    if (!page) {
      return res.status(404).json({ success: false, message: '页面不存在' });
    }
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/public/settings', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        siteName: settings.siteName,
        siteDescription: settings.siteDescription,
        siteUrl: settings.siteUrl
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API 运行正常', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`HappyHome API Server running on http://localhost:${PORT}`);
  console.log('API Endpoints:');
  console.log('  Authentication:');
  console.log('    POST /api/auth/login');
  console.log('    POST /api/auth/register');
  console.log('    GET /api/auth/me');
  console.log('  Posts:');
  console.log('    GET /api/posts');
  console.log('    GET /api/posts/:id');
  console.log('    POST /api/posts');
  console.log('    PUT /api/posts/:id');
  console.log('    DELETE /api/posts/:id');
  console.log('  Pages:');
  console.log('    GET /api/pages');
  console.log('    GET /api/pages/:id');
  console.log('    POST /api/pages');
  console.log('    PUT /api/pages/:id');
  console.log('    DELETE /api/pages/:id');
  console.log('  Users:');
  console.log('    GET /api/users');
  console.log('    GET /api/users/:id');
  console.log('    POST /api/users');
  console.log('    PUT /api/users/:id');
  console.log('    DELETE /api/users/:id');
  console.log('  Media:');
  console.log('    GET /api/media');
  console.log('    POST /api/media');
  console.log('    DELETE /api/media/:id');
  console.log('  Settings:');
  console.log('    GET /api/settings');
  console.log('    PUT /api/settings');
  console.log('  Public (无需认证):');
  console.log('    GET /api/public/posts');
  console.log('    GET /api/public/posts/:id');
  console.log('    GET /api/public/pages');
  console.log('    GET /api/public/pages/:slug');
  console.log('    GET /api/public/settings');
});
