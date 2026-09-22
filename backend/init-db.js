const fs = require('fs');
const path = require('path');

const { initDatabase, saveDatabase } = require('./db');

const DB_PATH = path.join(__dirname, 'happyhome.db');

// 建表（createTables）、种子数据（insertInitialData）与迁移（runMigrations）
// 的全部逻辑都在 db.js 里。本脚本不再重复维护一份 schema —— 之前那份拷贝
// 与 db.js 各写一遍，新增列时两边不同步，正是 posts.publish_date 丢失的根源。
// 这里只负责「删掉旧库 → 让 db.js 从零初始化出一个可用的库」。
async function initDb() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Old database removed');
  }

  // 库文件不存在时，initDatabase 会执行 createTables + insertInitialData + runMigrations
  await initDatabase();

  // 迁移流程会写盘，这里再兜一次，确保文件落盘
  saveDatabase();

  console.log('Database initialization complete!');
  console.log(`Database file: ${DB_PATH}`);
}

initDb().catch((error) => {
  console.error(error);
  process.exit(1);
});