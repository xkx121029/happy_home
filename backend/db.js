const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'happyhome.db');

let db = null;
let SQL = null;

function initDatabase() {
  return new Promise(async (resolve, reject) => {
    try {
      SQL = await initSqlJs({
        locateFile: file => `node_modules/sql.js/dist/${file}`
      });
      
      if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log('Database loaded from', DB_PATH);
      } else {
        db = new SQL.Database();
        console.log('New database created');
      }
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

const dbHelpers = {
  getSettings() {
    if (!db) return {};
    const results = db.exec('SELECT key, value FROM settings');
    const settings = {};
    if (results.length > 0) {
      results[0].values.forEach(row => {
        try {
          settings[row[0]] = JSON.parse(row[1]);
        } catch {
          settings[row[0]] = row[1];
        }
      });
    }
    return settings;
  },

  updateSettings(settings) {
    if (!db) return false;
    
    Object.entries(settings).forEach(([key, value]) => {
      let strValue;
      try {
        if (typeof value === 'object') {
          strValue = JSON.stringify(value);
        } else {
          strValue = String(value);
        }
      } catch (error) {
        console.error(`Failed to serialize setting ${key}:`, error);
        return;
      }
      
      if (strValue.length > 100000) {
        console.warn(`Setting ${key} is too large (${strValue.length} characters), skipping`);
        return;
      }
      
      const exists = db.exec(`SELECT key FROM settings WHERE key = '${key.replace(/'/g, "''")}'`);
      
      if (exists.length > 0 && exists[0].values.length > 0) {
        db.run(`UPDATE settings SET value = '${strValue.replace(/'/g, "''")}', updated_at = datetime('now') WHERE key = '${key.replace(/'/g, "''")}'`);
      } else {
        db.run(`INSERT INTO settings (key, value) VALUES ('${key.replace(/'/g, "''")}', '${strValue.replace(/'/g, "''")}')`);
      }
    });
    
    saveDatabase();
    return true;
  }
};

module.exports = {
  initDatabase,
  getDb: () => db,
  getSql: () => SQL,
  dbHelpers,
  saveDatabase
};
