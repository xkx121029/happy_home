/**
 * API 端点声明层。
 *
 * 这里只负责「路径 + 方法 + 请求体」，超时、重试、错误归一化、字段命名转换
 * 全部在 lib/http.js 里统一处理。页面不应直接调用 fetch。
 */
import { http, request, ApiError } from '../lib/http';
import { API_BASE_URL } from '../lib/env';

export { setAuthToken, getAuthToken, ApiError } from '../lib/http';

// ------------------------------------------------------------------ 字段归一化
//
// 后端返回的是数据库原始行（snake_case，且布尔位列是 0/1），而全部页面读的是
// camelCase（post.updatedAt / post.publishDate / comment.parentId ...）。
// 两边长期没有对齐，于是排序、分页、定时发布提示、评论嵌套读到的都是 undefined。
//
// 转换放在响应入口，所有消费者（含直接调 API 的页面）一次性受益。
// Phase 5 拆分后端时会改由各模块的 dto.js 承担，这一层随之简化。

const toCamelCase = (key) => key.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());

// 这些列在库里的类型是 INTEGER，但语义是布尔
const BOOLEAN_FIELDS = new Set(['sticky', 'enabled', 'isRead']);

// 这两个字段在库里以 JSON 字符串存储
const JSON_FIELDS = new Set(['items', 'config']);

export function normalizeEntity(entity) {
  if (Array.isArray(entity)) return entity.map(normalizeEntity);
  if (!entity || typeof entity !== 'object') return entity;

  const result = {};
  for (const [rawKey, value] of Object.entries(entity)) {
    const key = toCamelCase(rawKey);
    if (BOOLEAN_FIELDS.has(key)) {
      result[key] = value === 1 || value === true;
    } else if (JSON_FIELDS.has(key) && typeof value === 'string') {
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

// 只规整数据载荷，不动 success/message/count 这类外层信封字段。
// notifications 类端点用的是 notifications 而不是 data，一并处理。
// revisions 详情会额外带一个 current（当前版本），同样要规整 ——
// 漏掉它的话对比视图右列读到的 updated_at / publish_date 全是 undefined。
export function normalizeResponse(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const result = { ...payload };
  if (Array.isArray(payload.data)) {
    result.data = payload.data.map(normalizeEntity);
  } else if (payload.data && typeof payload.data === 'object') {
    result.data = normalizeEntity(payload.data);
  }
  if (payload.current && typeof payload.current === 'object') {
    result.current = normalizeEntity(payload.current);
  }
  if (Array.isArray(payload.notifications)) {
    result.notifications = payload.notifications.map(normalizeEntity);
  }
  return result;
}

/**
 * 发请求并按契约规整响应。保持与原先 apiRequest 一致的调用方式，
 * 让既有页面无需改动即可继续工作。
 */
export async function apiRequest(endpoint, options = {}) {
  const response = await request(endpoint, options);
  return normalizeResponse(response);
}

const toQuery = (params = {}) => {
  // 过滤掉空值，避免出现 ?status=undefined
  const cleaned = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const qs = new URLSearchParams(cleaned).toString();
  return qs ? `?${qs}` : '';
};

// ---------------------------------------------------------------------- Auth

export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  sendRegisterCode: (data) => apiRequest('/auth/send-register-code', { method: 'POST', body: data }),
  verify: (data) => apiRequest('/auth/verify', { method: 'POST', body: data }),
  resendVerification: (data) => apiRequest('/auth/resend-verification', { method: 'POST', body: data }),
  getMe: () => apiRequest('/auth/me'),
};

// --------------------------------------------------------------------- Posts

export const postsAPI = {
  // 后台列表页：全量模式。显式传 all=1 而不是「不传 page 就不分页」——
  // 同一个 URL 出现两种响应形状会让契约没法写文档，也让客户端没法预期。
  getAll: (params) => apiRequest(`/posts${toQuery({ all: 1, ...params })}`),
  // 前台列表页：分页模式，响应带 total / page / perPage / totalPages
  getPage: (params) => apiRequest(`/posts${toQuery(params)}`),
  getById: (id) => apiRequest(`/posts/${id}`),
  create: (data) => apiRequest('/posts', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/posts/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
  // 某篇文章的已审核评论（访客也能读）
  getComments: (id) => apiRequest(`/posts/${id}/comments`),
};

// ----------------------------------------------------------------- Revisions

export const revisionsAPI = {
  // 列表不含正文，只用来渲染「什么时候谁改了什么」
  listForPost: (postId) => apiRequest(`/posts/${postId}/revisions`),
  // 详情会一并带上当前版本，对比视图不必再发一次请求
  getById: (id) => apiRequest(`/revisions/${id}`),
  restore: (id) => apiRequest(`/revisions/${id}/restore`, { method: 'POST' }),
  delete: (id) => apiRequest(`/revisions/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------- Pages

export const pagesAPI = {
  getAll: (params) => apiRequest(`/pages${toQuery(params)}`),
  // :id 同时接受 id 与 slug —— 合并前 /pages/:id 与 /public/pages/:slug 是两条路径
  getById: (idOrSlug) => apiRequest(`/pages/${idOrSlug}`),
  create: (data) => apiRequest('/pages', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/pages/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/pages/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------------- Users

export const usersAPI = {
  getAll: (params) => apiRequest(`/users${toQuery(params)}`),
  getById: (id) => apiRequest(`/users/${id}`),
  create: (data) => apiRequest('/users', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
};

// ---------------------------------------------------------------- Taxonomy

export const categoriesAPI = {
  getAll: () => apiRequest('/categories'),
  // 只返回已被已发布文章实际用到的分类（前台列表的下拉用）。
  // 返回的仍是分类行对象，不是分类名数组。
  getUsed: () => apiRequest('/categories?usedOnly=1'),
  create: (data) => apiRequest('/categories', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),
};

export const tagsAPI = {
  getAll: () => apiRequest('/tags'),
  create: (data) => apiRequest('/tags', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/tags/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/tags/${id}`, { method: 'DELETE' }),
};

// --------------------------------------------------------------- Menus/Widgets

export const menusAPI = {
  getAll: () => apiRequest('/menus'),
  create: (data) => apiRequest('/menus', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/menus/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/menus/${id}`, { method: 'DELETE' }),
};

export const widgetsAPI = {
  getAll: (params) => apiRequest(`/widgets${toQuery(params)}`),
  create: (data) => apiRequest('/widgets', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/widgets/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/widgets/${id}`, { method: 'DELETE' }),
  // 页面需要「启用/停用」与「拖拽排序」，但 api 层一直没提供，页面却在调用，
  // 一用就崩。这里补上。
  toggleEnabled: (id, enabled) => apiRequest(`/widgets/${id}`, { method: 'PUT', body: { enabled } }),
  // 后端没有批量排序端点，部件数量在个位数，逐个串行更新即可。
  reorder: async (orderedIds = []) => {
    const results = [];
    for (let index = 0; index < orderedIds.length; index += 1) {
      results.push(await apiRequest(`/widgets/${orderedIds[index]}`, {
        method: 'PUT',
        body: { order_num: index + 1 },
      }));
    }
    return results;
  },
};

// --------------------------------------------------------------------- Media

export const mediaAPI = {
  getAll: () => apiRequest('/media'),
  create: (data) => apiRequest('/media', { method: 'POST', body: data }),
  delete: (id) => apiRequest(`/media/${id}`, { method: 'DELETE' }),
};

// ------------------------------------------------------------------ Comments

export const commentsAPI = {
  getAll: (params) => apiRequest(`/comments${toQuery(params)}`),
  create: (data) => apiRequest('/comments', { method: 'POST', body: data }),
  updateStatus: (id, status) => apiRequest(`/comments/${id}/status`, { method: 'PUT', body: { status } }),
  delete: (id) => apiRequest(`/comments/${id}`, { method: 'DELETE' }),

  // 下面两个是前台用的。合并之后不再有「公开专用」的路径 —— 同一个端点按身份
  // 决定返回什么（匿名只看到已审核评论、提交走限流），所以这里只是语义化别名。
  getApprovedForPost: (postId) => apiRequest(`/posts/${postId}/comments`),
  submit: (data) => apiRequest('/comments', { method: 'POST', body: data }),
  // 侧栏「最新评论」：已发布文章下的已审核评论
  getRecent: (limit = 5) => apiRequest(`/comments/recent?limit=${limit}`),
};

// ------------------------------------------------------------------ Settings

export const settingsAPI = {
  // 一个端点按身份返回不同的键子集：匿名拿前台白名单，管理员拿全量，
  // 其余登录用户拿全量但剔除 SMTP 凭据。所以不再需要 publicSettingsAPI。
  getAll: () => apiRequest('/settings'),
  update: (data) => apiRequest('/settings', { method: 'PUT', body: data }),
};

// --------------------------------------------------------------------- Misc

export const healthAPI = {
  // 存活探针刻意不版本化，走不带版本号的基址
  check: () => apiRequest('/health', { auth: false, unversioned: true }),
};

export const smtpAPI = {
  test: (useSavedConfig = true, testConfig = null) =>
    apiRequest('/smtp/test', { method: 'POST', body: { useSavedConfig, testConfig } }),
  refresh: () => apiRequest('/smtp/refresh', { method: 'POST', body: {} }),
};

export const passwordResetAPI = {
  sendCode: (email) => apiRequest('/auth/send-verification-code', { method: 'POST', body: { email } }),
  verifyCode: (email, code) => apiRequest('/auth/verify-code', { method: 'POST', body: { email, code } }),
  reset: (email, code, newPassword) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: { email, code, newPassword } }),
};

export const notificationsAPI = {
  getAll: () => apiRequest('/notifications'),
  getUnread: () => apiRequest('/notifications/unread'),
  getCount: () => apiRequest('/notifications/count'),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  delete: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
  clearAll: () => apiRequest('/notifications/clear', { method: 'DELETE' }),
  createDemo: () => apiRequest('/notifications/demo', { method: 'POST' }),
};

export const analyticsAPI = {
  getStats: () => apiRequest('/analytics/stats'),
  track: (data) => apiRequest('/analytics/track', { method: 'POST', body: data }),
};

// ------------------------------------------------------------------ Backups
//
// 备份页此前是个空壳：10 个操作全是「暂未实现」的提示，后端也没有备份端点。
// 这一组对应后端新增的 /api/backups。
export const backupsAPI = {
  getAll: () => apiRequest('/backups'),
  create: (data) => apiRequest('/backups', { method: 'POST', body: data || {} }),
  delete: (id) => apiRequest(`/backups/${id}`, { method: 'DELETE' }),
  restore: (id) => apiRequest(`/backups/${id}/restore`, { method: 'POST' }),
  // 下载交给浏览器直接打开，避免把整个库读进内存再塞给前端
  getDownloadUrl: (id) => `${API_BASE_URL}/backups/${id}/download`,
};

// ----------------------------------------------------------------- API 密钥
//
// 对外开放 API 的长期凭据。明文只在 create / rotate 的响应里出现一次，
// 所以这两个方法的返回值里带 key 字段，其余方法都没有 —— 页面据此决定
// 是否弹一次性横幅。
export const apiKeysAPI = {
  getAll: () => apiRequest('/api-keys'),
  // scope 目录（分组、标签、默认勾选项）由后端下发，前端不抄一份
  getScopes: () => apiRequest('/api-keys/scopes'),
  create: (data) => apiRequest('/api-keys', { method: 'POST', body: data }),
  revoke: (id) => apiRequest(`/api-keys/${id}/revoke`, { method: 'POST' }),
  rotate: (id) => apiRequest(`/api-keys/${id}/rotate`, { method: 'POST' }),
  remove: (id) => apiRequest(`/api-keys/${id}`, { method: 'DELETE' }),
};

export { http };
export default http;