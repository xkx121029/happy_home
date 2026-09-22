/**
 * settings 表的读写（从 db.js 的 dbHelpers 原样搬过来）。
 *
 * 通过工厂注入 getDb / saveDatabase，本模块不反向依赖 db.js，
 * 避免 db.js ↔ settings.js 的循环引用。
 */
module.exports = function createSettings({ getDb, saveDatabase }) {
  return {
    getSettings() {
      const db = getDb();
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
      const db = getDb();
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

        // 原来是字符串拼接 SQL（靠手工转义单引号）。改成参数化绑定，
        // 既消除注入面，也避免值里出现反斜杠等字符时的边界情况。
        const exists = db.exec('SELECT key FROM settings WHERE key = ?', [key]);

        if (exists.length > 0 && exists[0].values.length > 0) {
          db.run("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?", [strValue, key]);
        } else {
          db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, strValue]);
        }
      });

      saveDatabase();
      return true;
    }
  };
};