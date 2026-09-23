// 临时排查脚本：列出开发库里所有 settings 键，确认冒烟/验证过程是否写入了脏数据。
// 用完即删。
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

initSqlJs().then((SQL) => {
  const file = path.join(__dirname, '..', 'happyhome.db');
  const db = new SQL.Database(fs.readFileSync(file));
  const res = db.exec('SELECT key, value FROM settings ORDER BY key');
  for (const row of res[0]?.values || []) {
    console.log(`${row[0]} = ${String(row[1]).slice(0, 60)}`);
  }
});
