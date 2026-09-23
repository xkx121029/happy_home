/**
 * 站点设置的下发白名单。
 *
 * 设置的读取有三种身份，返回的内容必须按身份裁剪 —— 原始 getSettings() 里
 * 含 SMTP 凭据，直接返回等于把发信通道的密码交给任何能读这个端点的人。
 *
 * 改造前这里有个洞：GET /api/settings 只要求「已登录」，而它返回的是原始
 * getSettings()，也就是说 author 角色就能读到 smtpPass。开放 API 之后
 * API Key 也会踩同一个洞，所以在鉴权层收敛的同时把裁剪也补上。
 */

/** 前台与匿名访客需要的键。 */
const PUBLIC_SETTING_KEYS = [
  'siteName', 'siteDescription', 'siteUrl', 'timezone',
  'theme', 'seo', 'socialShare',
  'customCSS', 'customJS', 'headCode', 'footerCode',
  'enableComments', 'postsPerPage', 'excerptLength',
];

/**
 * 敏感键：非管理员一律不下发。
 * 这三个拼起来就是一台可用的发信机，泄露即可被拿去发钓鱼邮件。
 */
const SENSITIVE_SETTING_KEYS = ['smtpPass', 'smtpUser', 'smtpHost'];

/**
 * 按身份裁剪设置。
 *
 * @param {object} all             getSettings() 的原始结果
 * @param {{ isAdmin?: boolean, isPublic?: boolean }} options
 *        isPublic 匿名（或角色不够的登录用户）→ 只给前台白名单
 *        isAdmin  管理员 → 全量；否则剔除敏感键
 */
function pickSettings(all, { isAdmin = false, isPublic = false } = {}) {
  const source = all || {};

  if (isPublic) {
    const out = {};
    for (const key of PUBLIC_SETTING_KEYS) {
      if (source[key] !== undefined) out[key] = source[key];
    }
    return out;
  }

  if (isAdmin) return { ...source };

  const out = {};
  for (const [key, value] of Object.entries(source)) {
    if (!SENSITIVE_SETTING_KEYS.includes(key)) out[key] = value;
  }
  return out;
}

module.exports = {
  PUBLIC_SETTING_KEYS,
  SENSITIVE_SETTING_KEYS,
  pickSettings,
};
