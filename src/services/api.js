// 默认走相对路径 /api：开发环境由 vite.config.js 的 server.proxy 转发到后端，
// 生产环境由同源反向代理接住。这样代码里不再硬编码 http://localhost:3002，
// 部署到其它机器时不用再改前端源码（原来这是"一部署就全站报错"的根源）。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

// 后端返回的是数据库原始行（snake_case，且布尔位列是 0/1），而全部页面读的是
// camelCase（post.updatedAt / post.publishDate / comment.parentId ...）。
// 两边一直没有对齐，于是排序、分页、定时发布提示、评论嵌套读到的都是 undefined。
// 这里在响应解析的唯一入口统一规整，所有消费者（含直接调 API 的页面）一次性受益。
// （Phase 5 拆分后端时会改由各模块 dto.js 承担转换，这一层随之简化）
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

// 只规整 data 载荷，不动 success/message/count 这类外层信封字段
function normalizeResponse(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const result = { ...payload };
  if (Array.isArray(payload.data)) {
    result.data = payload.data.map(normalizeEntity);
  } else if (payload.data && typeof payload.data === 'object') {
    result.data = normalizeEntity(payload.data);
  }
  return result;
}

export const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 说明 token 已失效：清掉它，避免后续请求继续带着废 token 打空转。
  // 路由跳转交给 PrivateRoute 处理，这里不直接动 location。
  if (response.status === 401) {
    authToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('isLoggedIn');
  }

  // 204 或空响应体时 response.json() 会抛错，先取文本再尝试解析
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `API 请求失败（HTTP ${response.status}）`);
  }

  return normalizeResponse(data);
};

// Auth
export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  sendRegisterCode: (data) => apiRequest('/auth/send-register-code', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  verify: (data) => apiRequest('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  resendVerification: (data) => apiRequest('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => apiRequest('/auth/me'),
};

// Posts
export const postsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/posts${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => apiRequest(`/posts/${id}`),
  create: (postData) => apiRequest('/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  }),
  update: (id, postData) => apiRequest(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  }),
  delete: (id) => apiRequest(`/posts/${id}`, {
    method: 'DELETE',
  }),
  getPublicAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/public/posts${queryString ? '?' + queryString : ''}`);
  },
  getPublicById: (id) => apiRequest(`/public/posts/${id}`),
};

// Pages
export const pagesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/pages${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => apiRequest(`/pages/${id}`),
  create: (pageData) => apiRequest('/pages', {
    method: 'POST',
    body: JSON.stringify(pageData),
  }),
  update: (id, pageData) => apiRequest(`/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(pageData),
  }),
  delete: (id) => apiRequest(`/pages/${id}`, {
    method: 'DELETE',
  }),
};

// Users
export const usersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => apiRequest(`/users/${id}`),
  create: (userData) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  update: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  delete: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Categories
export const categoriesAPI = {
  getAll: () => apiRequest('/categories'),
  create: (categoryData) => apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }),
  update: (id, categoryData) => apiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  }),
  delete: (id) => apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  }),
};

// Tags
export const tagsAPI = {
  getAll: () => apiRequest('/tags'),
  create: (tagData) => apiRequest('/tags', {
    method: 'POST',
    body: JSON.stringify(tagData),
  }),
  update: (id, tagData) => apiRequest(`/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tagData),
  }),
  delete: (id) => apiRequest(`/tags/${id}`, {
    method: 'DELETE',
  }),
};

// Menus
export const menusAPI = {
  getAll: () => apiRequest('/menus'),
  create: (menuData) => apiRequest('/menus', {
    method: 'POST',
    body: JSON.stringify(menuData),
  }),
  update: (id, menuData) => apiRequest(`/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(menuData),
  }),
  delete: (id) => apiRequest(`/menus/${id}`, {
    method: 'DELETE',
  }),
};

// Widgets
export const widgetsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/widgets${queryString ? '?' + queryString : ''}`);
  },
  create: (widgetData) => apiRequest('/widgets', {
    method: 'POST',
    body: JSON.stringify(widgetData),
  }),
  update: (id, widgetData) => apiRequest(`/widgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(widgetData),
  }),
  delete: (id) => apiRequest(`/widgets/${id}`, {
    method: 'DELETE',
  }),
  // 页面需要「启用/停用」与「拖拽排序」两个动作，但 api 层一直没提供，
  // Widgets.jsx 却在调用，结果一用就崩。这里补上。
  toggleEnabled: (id, enabled) => apiRequest(`/widgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  }),
  // 后端没有批量排序端点，部件数量在个位数，逐个串行更新即可，
  // 避免为了排序单独加一个接口。（Phase 5 拆分后端时可再评估批量端点）
  reorder: async (orderedIds = []) => {
    const results = [];
    for (let index = 0; index < orderedIds.length; index += 1) {
      results.push(await apiRequest(`/widgets/${orderedIds[index]}`, {
        method: 'PUT',
        body: JSON.stringify({ order_num: index + 1 }),
      }));
    }
    return results;
  },
};

// Media
export const mediaAPI = {
  getAll: () => apiRequest('/media'),
  create: (mediaData) => apiRequest('/media', {
    method: 'POST',
    body: JSON.stringify(mediaData),
  }),
  delete: (id) => apiRequest(`/media/${id}`, {
    method: 'DELETE',
  }),
};

// Comments
export const commentsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/comments${queryString ? '?' + queryString : ''}`);
  },
  create: (data) => apiRequest('/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status) => apiRequest(`/comments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  delete: (id) => apiRequest(`/comments/${id}`, {
    method: 'DELETE',
  }),
  // 前台专用：访客没有 token，走后端新开的公开端点（已审核列表 + 提交待审）。
  // 原来前台调用的是需要登录的 /api/comments，访客必然 401；
  // 而 commentsAPI.reply 更是在 api 层和后端都不存在，一调用就抛错。
  getPublicForPost: (postId) => apiRequest(`/public/posts/${postId}/comments`),
  createPublic: (data) => apiRequest('/public/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  reply: (parentId, data) => apiRequest('/public/comments', {
    method: 'POST',
    body: JSON.stringify({ ...data, parentId }),
  }),
};

// Settings
export const settingsAPI = {
  getAll: () => apiRequest('/settings'),
  update: (settingsData) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData),
  }),
};

// Public
export const publicAPI = {
  getPosts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/public/posts${queryString ? '?' + queryString : ''}`);
  },
  getPostById: (id) => apiRequest(`/public/posts/${id}`),
  getPages: () => apiRequest('/public/pages'),
  getPageBySlug: (slug) => apiRequest(`/public/pages/${slug}`),
  getSettings: () => apiRequest('/public/settings'),
};

// Settings - 公开版本（无需认证）
export const publicSettingsAPI = {
  getAll: () => apiRequest('/public/settings'),
};

// Health
export const healthAPI = {
  check: () => apiRequest('/health'),
};

// SMTP
export const smtpAPI = {
  test: (useSavedConfig = true, testConfig = null) => apiRequest('/smtp/test', {
    method: 'POST',
    body: JSON.stringify({ useSavedConfig, testConfig }),
  }),
  refresh: () => apiRequest('/smtp/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
};

// Password Reset
export const passwordResetAPI = {
  sendCode: (email) => apiRequest('/auth/send-verification-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyCode: (email, code) => apiRequest('/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  }),
  reset: (email, code, newPassword) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  }),
};

// Notifications
export const notificationsAPI = {
  getAll: () => apiRequest('/notifications'),
  getUnread: () => apiRequest('/notifications/unread'),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
  markAllAsRead: () => apiRequest('/notifications/read-all', {
    method: 'PUT',
  }),
  delete: (id) => apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
  }),
  clearAll: () => apiRequest('/notifications/clear', {
    method: 'DELETE',
  }),
  getCount: () => apiRequest('/notifications/count'),
  createDemo: () => apiRequest('/notifications/demo', {
    method: 'POST',
  }),
};

// Analytics
export const analyticsAPI = {
  getStats: () => apiRequest('/analytics/stats'),
  track: (data) => apiRequest('/analytics/track', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Backups
// 备份页此前是个空壳：10 个操作全是「暂未实现」的提示，后端也没有任何备份端点。
// 这里对应后端新增的 /api/backups 一组接口。
export const backupsAPI = {
  getAll: () => apiRequest('/backups'),
  create: (data) => apiRequest('/backups', {
    method: 'POST',
    body: JSON.stringify(data || {}),
  }),
  delete: (id) => apiRequest(`/backups/${id}`, {
    method: 'DELETE',
  }),
  restore: (id) => apiRequest(`/backups/${id}/restore`, {
    method: 'POST',
  }),
  // 下载走浏览器直接打开，避免把整个库读进内存再塞给前端
  getDownloadUrl: (id) => `${API_BASE_URL}/backups/${id}/download`,
};

