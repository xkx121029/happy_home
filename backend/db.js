const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const createSettings = require('./src/db/settings');
const repo = require('./src/db/repo');

const DB_PATH = path.join(__dirname, 'happyhome.db');

let db = null;
let SQL = null;

function initDatabase() {
  return new Promise(async (resolve, reject) => {
    try {
      SQL = await initSqlJs({
        locateFile: file => `node_modules/sql.js/dist/${file}`
      });
      
      const dbExists = fs.existsSync(DB_PATH);
      
      if (dbExists) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log('Database loaded from', DB_PATH);
      } else {
        db = new SQL.Database();
        console.log('New database created');
        
        createTables();
        insertInitialData();
      }

      // 老库也要补齐新增的列与索引，否则新功能会静默失效
      runMigrations({ isNewDatabase: !dbExists });
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function createTables() {
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

  if (!process.env.INITIAL_ADMIN_PASSWORD) {
    console.log('');
    console.log('====================================================');
    console.log('  已创建初始管理员账号');
    console.log('  用户名：admin');
    console.log('  初始口令：' + initialPassword);
    console.log('  请登录后立即修改，或在 .env 里设置 INITIAL_ADMIN_PASSWORD');
    console.log('====================================================');
    console.log('');
  }

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
}

// 生成一个高强度随机口令（base64url，去掉易混淆字符）
function generateInitialPassword() {
  const { randomBytes } = require('crypto');
  return randomBytes(18).toString('base64url');
}

function insertInitialData() {
  console.log('Inserting initial data...');

  db.run(
  // 初始管理员口令不再硬编码。
  //
  // 原来这里写死 'admin123'，而这个口令已经随 backend/.env 与 README 一起被推到了公开仓库 ——
  // 任何人都能在一个全新部署上用公开口令登录管理员账号。
  // 现在的策略：优先读环境变量 INITIAL_ADMIN_PASSWORD；没配置就随机生成一个并打印一次，
  // 让运维有办法登录，然后立刻改掉。
  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || generateInitialPassword();

    [uuidv4(), 'admin', 'xkxxkx12345@hotmail.com', bcrypt.hashSync(initialPassword, 10), 'administrator', 'active']
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
}

// 同步小睡。Node 主线程允许 Atomics.wait（浏览器里不允许），
// 用来给重试之间留出一点间隔，避免忙等到处占用 CPU。
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  // 原来是直接 writeFileSync 覆盖原文件：一旦进程在写入中途退出，数据库就废了。
  // 改为「先写临时文件，再原子替换」，任何时刻磁盘上至少有一份完整可用的库。
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, buffer);

  // Windows 上 rename 覆盖已存在的文件时，如果有别的进程正打开着目标文件
  // （文件监视、索引、杀软扫描都可能），会抛 EPERM 而不是等待。
  // 保存失败意味着这次修改只留在内存里，所以重试几次、再退回直接覆盖写。
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.renameSync(tmpPath, DB_PATH);
      return;
    } catch (error) {
      if (error.code !== 'EPERM' && error.code !== 'EACCES' && error.code !== 'EBUSY') {
        throw error;
      }
      sleepSync(30 * (attempt + 1));
    }
  }

  console.warn('数据库临时文件替换失败，退回直接覆盖写入');
  fs.writeFileSync(DB_PATH, buffer);
  try {
    fs.unlinkSync(tmpPath);
  } catch {
    // 临时文件清不掉不影响正确性，下次写入会覆盖它
  }
}

// ------------------------------------------------------------------ 迁移
//
// 背景：schema 曾经在 init-db.js 与 db.js 里各写一份，而且只在「库文件不存在」时
// 执行建表。结果是已经存在的 happyhome.db 永远拿不到后来新增的列 —— posts.publish_date
// 就是这样丢失的，前端的「定时发布」写不进任何数据，从头到尾都是空转。
//
// 这里用 SQLite 内建的 PRAGMA user_version 做一个最小可用的迁移器：
// 每个迁移只做一件幂等的事（加列 / 加索引），执行后推进版本号。
// 只允许「可逆性最好」的操作：ADD COLUMN 与 CREATE INDEX，不重建表。

function columnExists(database, table, column) {
  const rows = database.exec(`PRAGMA table_info(${table})`);
  if (!rows.length) return false;
  const nameIndex = rows[0].columns.indexOf('name');
  return rows[0].values.some((row) => row[nameIndex] === column);
}

function getUserVersion(database) {
  const result = database.exec('PRAGMA user_version');
  return result.length ? result[0].values[0][0] : 0;
}

const MIGRATIONS = [
  {
    id: 1,
    name: 'posts 增加 publish_date 列（定时发布所需）',
    up(database) {
      if (!columnExists(database, 'posts', 'publish_date')) {
        database.run('ALTER TABLE posts ADD COLUMN publish_date TEXT');
      }
    },
  },
  {
    id: 2,
    name: '常用查询索引',
    up(database) {
      database.run('CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)');
      database.run('CREATE INDEX IF NOT EXISTS idx_posts_publish_date ON posts(publish_date)');
      database.run('CREATE INDEX IF NOT EXISTS idx_comments_post_status ON comments(post_id, status)');
      database.run('CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)');
    },
  },
];

function backupDatabaseFile() {
  if (!fs.existsSync(DB_PATH)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${DB_PATH}.bak-${stamp}`;
  fs.copyFileSync(DB_PATH, backupPath);
  console.log('数据库已备份到', backupPath);
  return backupPath;
}

function runMigrations({ isNewDatabase = false } = {}) {
  if (!db) return;
  const current = getUserVersion(db);
  const pending = MIGRATIONS.filter((m) => m.id > current);
  if (pending.length === 0) return;

  // sql.js 是整库导出后覆盖写盘，迁移中途失败会毁库，所以先备份再动。
  // 全新库没有可丢的数据，跳过备份以免堆一堆无意义的 .bak 文件。
  if (!isNewDatabase) {
    backupDatabaseFile();
  }

  for (const migration of pending) {
    console.log(`应用迁移 ${migration.id}: ${migration.name}`);
    migration.up(db);
    db.run(`PRAGMA user_version = ${migration.id}`);
  }
  saveDatabase();
  console.log(`迁移完成，user_version = ${getUserVersion(db)}`);
}

// settings 读写已抽到 src/db/settings.js，这里注入 db 实例与写盘函数后继续对外暴露
const dbHelpers = createSettings({ getDb: () => db, saveDatabase });

module.exports = {
  initDatabase,
  getDb: () => db,
  getSql: () => SQL,
  dbHelpers,
  saveDatabase,
  runMigrations,
  backupDatabaseFile,
  // 参数化查询助手：从 src/db/repo.js 再导出以兼容旧引用
  execQuery: repo.execQuery,
  getSingle: repo.getSingle,
  bindable: repo.bindable,
  run: repo.run
};
