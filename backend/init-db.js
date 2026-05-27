const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'happyhome.db');

async function initDb() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Old database removed');
  }

  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const db = new SQL.Database();
  console.log('Creating database tables...');

  db.run(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'author',
      status TEXT DEFAULT 'active',
      verification_code TEXT,
      verification_expires TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      excerpt TEXT,
      category TEXT,
      status TEXT DEFAULT 'draft',
      author TEXT,
      sticky INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      slug TEXT UNIQUE,
      status TEXT DEFAULT 'draft',
      author TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      parent TEXT,
      count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE,
      count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE post_tags (
      post_id TEXT,
      tag_id TEXT,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE TABLE post_categories (
      post_id TEXT,
      category_id TEXT,
      PRIMARY KEY (post_id, category_id)
    );

    CREATE TABLE comments (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      author TEXT,
      email TEXT,
      content TEXT,
      status TEXT DEFAULT 'pending',
      parent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE menus (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT,
      items TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE widgets (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      location TEXT,
      order_num INTEGER,
      enabled INTEGER DEFAULT 1,
      config TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE media (
      id TEXT PRIMARY KEY,
      name TEXT,
      url TEXT,
      size TEXT,
      type TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE revisions (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      title TEXT,
      content TEXT,
      excerpt TEXT,
      author TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE backups (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      size INTEGER,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE register_codes (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  console.log('Tables created successfully');
  console.log('Inserting initial data...');

  db.run(
    `INSERT INTO users (id, username, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'admin', 'admin@example.com', bcrypt.hashSync('admin123', 10), 'administrator', 'active']
  );

  const initCategories = [
    { id: uuidv4(), name: '公告', slug: 'announcements', description: '网站公告' },
    { id: uuidv4(), name: '教程', slug: 'tutorials', description: '使用教程' },
    { id: uuidv4(), name: '博客', slug: 'blog', description: '博客文章' }
  ];

  initCategories.forEach(cat => {
    db.run(
      `INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?)`,
      [cat.id, cat.name, cat.slug, cat.description]
    );
  });

  const initTags = [
    { id: uuidv4(), name: '欢迎', slug: 'welcome' },
    { id: uuidv4(), name: '教程', slug: 'tutorial' },
    { id: uuidv4(), name: '入门', slug: 'getting-started' }
  ];

  initTags.forEach(tag => {
    db.run(
      `INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)`,
      [tag.id, tag.name, tag.slug]
    );
  });

  const initPost = {
    id: uuidv4(),
    title: '欢迎来到 HappyHome',
    content: '<h2>欢迎使用 HappyHome 建站平台！</h2><p>这是一个功能强大、易于使用的建站解决方案。</p><p>在这里，您可以轻松创建和管理您的网站内容。</p>',
    excerpt: '欢迎使用 HappyHome 建站平台！这是一个功能强大、易于使用的建站解决方案。',
    category: '公告',
    status: 'published',
    author: 'admin'
  };

  db.run(
    `INSERT INTO posts (id, title, content, excerpt, category, status, author) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [initPost.id, initPost.title, initPost.content, initPost.excerpt, initPost.category, initPost.status, initPost.author]
  );

  const initPage = {
    id: uuidv4(),
    title: '关于我们',
    content: '<h2>关于 HappyHome</h2><p>我们致力于为每个人提供简单易用的建站解决方案。</p>',
    slug: 'about',
    status: 'published',
    author: 'admin'
  };

  db.run(
    `INSERT INTO pages (id, title, content, slug, status, author) VALUES (?, ?, ?, ?, ?, ?)`,
    [initPage.id, initPage.title, initPage.content, initPage.slug, initPage.status, initPage.author]
  );

  const initSettings = [
    { key: 'siteName', value: 'HappyHome' },
    { key: 'siteDescription', value: '一个功能强大、易于使用的建站平台' },
    { key: 'siteUrl', value: 'http://localhost:3000' },
    { key: 'adminEmail', value: 'admin@example.com' },
    { key: 'timezone', value: 'Asia/Shanghai' },
    { key: 'language', value: 'zh-CN' },
    { key: 'postsPerPage', value: '10' },
    { key: 'commentsModeration', value: 'true' },
    { key: 'registrationEnabled', value: 'false' },
    { key: 'enableDarkMode', value: 'false' },
    { key: 'primaryColor', value: '#3b82f6' },
    { key: 'secondaryColor', value: '#8b5cf6' },
    { key: 'accentColor', value: '#ec4899' },
    { key: 'backgroundColor', value: '#ffffff' },
    { key: 'textColor', value: '#1f2937' },
    { key: 'fontFamily', value: 'system' },
    { key: 'layout', value: 'wide' }
  ];

  initSettings.forEach(setting => {
    db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?)`,
      [setting.key, String(setting.value)]
    );
  });

  const initMenus = [
    { id: uuidv4(), title: '头部导航', location: 'header', items: JSON.stringify([{ id: '1', title: '首页', url: '/', target: '_self', type: 'custom', enabled: true, order: 1 }, { id: '2', title: '文章', url: '/posts', target: '_self', type: 'custom', enabled: true, order: 2 }]) },
    { id: uuidv4(), title: '页脚导航', location: 'footer', items: JSON.stringify([{ id: '3', title: '关于我们', url: '/page/about', target: '_self', type: 'page', enabled: true, order: 1 }]) }
  ];

  initMenus.forEach(menu => {
    db.run(
      `INSERT INTO menus (id, title, location, items) VALUES (?, ?, ?, ?)`,
      [menu.id, menu.title, menu.location, menu.items]
    );
  });

  const initWidgets = [
    { id: uuidv4(), name: '搜索', type: 'search', location: 'sidebar', order_num: 0, config: JSON.stringify({}) },
    { id: uuidv4(), name: '最新文章', type: 'recent_posts', location: 'sidebar', order_num: 1, config: JSON.stringify({ count: 5 }) },
    { id: uuidv4(), name: '分类目录', type: 'categories', location: 'sidebar', order_num: 2, config: JSON.stringify({ count: 10 }) },
    { id: uuidv4(), name: '标签云', type: 'tags', location: 'sidebar', order_num: 3, config: JSON.stringify({ count: 20 }) }
  ];

  initWidgets.forEach(widget => {
    db.run(
      `INSERT INTO widgets (id, name, type, location, order_num, config) VALUES (?, ?, ?, ?, ?, ?)`,
      [widget.id, widget.name, widget.type, widget.location, widget.order_num, widget.config]
    );
  });

  const initMedia = [
    { id: uuidv4(), name: 'sample-image.jpg', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', size: '256 KB', type: 'image/jpeg' }
  ];

  initMedia.forEach(item => {
    db.run(
      `INSERT INTO media (id, name, url, size, type) VALUES (?, ?, ?, ?, ?)`,
      [item.id, item.name, item.url, item.size, item.type]
    );
  });

  const initComment = {
    id: uuidv4(),
    post_id: initPost.id,
    author: '张三',
    email: 'zhangsan@example.com',
    content: '这是一篇非常好的文章，学到了很多！',
    status: 'approved'
  };

  db.run(
    `INSERT INTO comments (id, post_id, author, email, content, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [initComment.id, initComment.post_id, initComment.author, initComment.email, initComment.content, initComment.status]
  );

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);

  console.log('Initial data inserted successfully');
  console.log('Database initialization complete!');
  console.log(`Database file: ${DB_PATH}`);
}

initDb().catch(console.error);
