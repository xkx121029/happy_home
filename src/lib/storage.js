/**
 * localStorage 访问的唯一入口。
 *
 * 项目里原本散落着 happyhome_* / hh.* 等不同前缀的字符串键，
 * 且每处都各自写一遍 try/catch。统一到这里，键名集中登记，
 * 避免改名字符串时漏改某一处导致状态读不到。
 */

const PREFIX = 'happyhome';

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  isLoggedIn: 'isLoggedIn',
  currentUser: 'currentUser',
  theme: `${PREFIX}_theme`,
  tutorial: `${PREFIX}_tutorial`,
};

// 自定义 CSS / JS / 头尾代码与社交分享设置原来也存在这里，但设置页写的是数据库 ——
// 两套互不通气，改哪边都只生效一半，换台电脑还会丢。已统一为 settings 里的键
// （customCSS / customJS / headCode / footerCode / socialShare），不再走 localStorage。

/**
 * 读取并反序列化。解析失败或不存在时返回 fallback。
 */
export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // 隐私模式或配额用尽时会抛错，静默失败即可，不值得打断用户操作
    return false;
  }
}

export function readRaw(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
}

export function writeRaw(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}