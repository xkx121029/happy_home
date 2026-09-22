const initSqlJs = require('sql.js');
const fs = require('fs');

initSqlJs({ locateFile: (f) => 'node_modules/sql.js/dist/' + f }).then((SQL) => {
  const db = new SQL.Database(fs.readFileSync('happyhome.db'));
  const t = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('tables(' + t[0].values.length + '):', t[0].values.map((r) => r[0]).join(','));
  console.log('user_version:', db.exec('PRAGMA user_version')[0].values[0][0]);
  console.log('posts:', db.exec('SELECT COUNT(*) FROM posts')[0].values[0][0], '| settings:', db.exec('SELECT COUNT(*) FROM settings')[0].values[0][0]);
  const cols = db.exec('PRAGMA table_info(posts)')[0];
  console.log('posts.publish_date present:', cols.values.some((r) => r[1] === 'publish_date'));
});