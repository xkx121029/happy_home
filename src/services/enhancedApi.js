/**
 * 增强版 API 服务
 * - 自动错误转换
 * - 请求重试
 * - 离线队列
 * - 请求取消
 * - 详细日志
 */

const API_BASE_URL = 'http://localhost:3002/api';
const API_TIMEOUT = 30000; // 30秒超时
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

let authToken = null;

// ==================== Token 管理 ====================

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

// ==================== 离线队列管理 ====================

const OFFLINE_QUEUE_KEY = 'happyhome_offline_queue';

export const getOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const addToOfflineQueue = (request) => {
  const queue = getOfflineQueue();
  queue.push({
    ...request,
    timestamp: new Date().toISOString(),
    id: Date.now() + Math.random(),
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const removeFromOfflineQueue = (id) => {
  const queue = getOfflineQueue();
  const filtered = queue.filter(item => item.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
};

export const clearOfflineQueue = () => {
  localStorage.setItem(OFFLINE_QUEUE_KEY, '[]');
};

// ==================== 错误类型 ====================

export class ApiError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  // 工厂方法
  static networkError(details = {}) {
    return new ApiError('网络连接失败，请检查您的网络设置', 0, 'NETWORK_ERROR', details);
  }

  static timeout(details = {}) {
    return new ApiError('请求超时，请稍后重试', 0, 'TIMEOUT', details);
  }

  static unauthorized(details = {}) {
    return new ApiError('登录已过期，请重新登录', 401, 'UNAUTHORIZED', details);
  }

  static forbidden(details = {}) {
    return new ApiError('您没有权限执行此操作', 403, 'FORBIDDEN', details);
  }

  static notFound(resource = '资源', details = {}) {
    return new ApiError(`${resource}不存在或已被删除`, 404, 'NOT_FOUND', details);
  }

  static validationError(message, details = {}) {
    return new ApiError(message, 400, 'VALIDATION_ERROR', details);
  }

  static serverError(details = {}) {
    return new ApiError('服务器出现了一些问题，请稍后重试', 500, 'SERVER_ERROR', details);
  }

  static offline(details = {}) {
    return new ApiError('当前处于离线状态', 0, 'OFFLINE', details);
  }
}

// ==================== 辅助函数 ====================

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 检查是否应该重试
const shouldRetry = (error, retryCount) => {
  // 超过最大重试次数
  if (retryCount >= MAX_RETRIES) return false;
  
  // 网络错误、超时、5xx服务器错误可以重试
  if (error.status === 0 || error.status >= 500) return true;
  
  // 429 Too Many Requests 可以重试
  if (error.status === 429) return true;
  
  return false;
};

// 获取重试延迟
const getRetryDelay = (retryCount, error) => {
  // 指数退避：1s, 2s, 4s
  let delayMs = RETRY_DELAY * Math.pow(2, retryCount);
  
  // 如果是429，增加额外延迟
  if (error.status === 429) {
    delayMs = Math.max(delayMs, 5000); // 至少等5秒
  }
  
  return delayMs;
};

// 解析响应数据
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

// ==================== 核心请求函数 ====================

/**
 * 带重试的API请求
 */
async function apiRequestWithRetry(endpoint, options = {}, retryCount = 0) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await parseResponse(response);
    
    // 检查响应状态
    if (!response.ok) {
      // 根据状态码转换错误
      let error;
      
      switch (response.status) {
        case 400:
          error = ApiError.validationError(data.message || '数据验证失败', { response: data });
          break;
        case 401:
          error = ApiError.unauthorized({ response: data });
          // 触发登出
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          break;
        case 403:
          error = ApiError.forbidden({ response: data });
          break;
        case 404:
          error = ApiError.notFound(data.message || '请求的资源', { response: data });
          break;
        case 429:
          error = new ApiError('请求过于频繁，请稍后重试', 429, 'RATE_LIMIT', { response: data });
          break;
        case 500:
        case 502:
        case 503:
          error = ApiError.serverError({ response: data, status: response.status });
          break;
        default:
          error = new ApiError(data.message || '请求失败', response.status, 'UNKNOWN_ERROR', { response: data });
      }
      
      // 抛出转换后的错误
      throw error;
    }
    
    return data;
    
  } catch (err) {
    clearTimeout(timeoutId);
    
    // 如果是AbortError（超时）
    if (err.name === 'AbortError') {
      throw ApiError.timeout({ endpoint, options });
    }
    
    // 如果是Fetch错误（网络问题）
    if (err instanceof TypeError && err.message.includes('fetch')) {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        throw ApiError.offline({ endpoint, options });
      }
      throw ApiError.networkError({ endpoint, options, originalError: err.message });
    }
    
    // 如果已经是ApiError，直接抛出
    if (err instanceof ApiError) {
      // 检查是否应该重试
      if (shouldRetry(err, retryCount)) {
        const retryDelay = getRetryDelay(retryCount, err);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] Retrying request to ${endpoint} in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        }
        await delay(retryDelay);
        return apiRequestWithRetry(endpoint, options, retryCount + 1);
      }
      throw err;
    }
    
    // 其他错误转换为ApiError
    const apiError = new ApiError(err.message || '未知错误', 0, 'UNKNOWN', { originalError: err });
    
    if (shouldRetry(apiError, retryCount)) {
      const retryDelay = getRetryDelay(retryCount, apiError);
      await delay(retryDelay);
      return apiRequestWithRetry(endpoint, options, retryCount + 1);
    }
    
    throw apiError;
  }
}

/**
 * 离线友好的API请求
 * 如果离线，会将请求加入队列，等网络恢复后自动执行
 */
async function apiRequestOffline(endpoint, options = {}, queueIfOffline = true) {
  if (!navigator.onLine && queueIfOffline) {
    // 添加到离线队列
    addToOfflineQueue({ endpoint, options });
    
    // 抛出离线错误
    throw ApiError.offline({ endpoint, options });
  }
  
  return apiRequestWithRetry(endpoint, options);
}

// ==================== API 方法 ====================

// Auth
export const authAPI = {
  login: (credentials) => apiRequestWithRetry('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiRequestWithRetry('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  getMe: () => apiRequestWithRetry('/auth/me'),
  logout: () => {
    setAuthToken(null);
  },
};

// Posts
export const postsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequestWithRetry(`/posts${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => apiRequestWithRetry(`/posts/${id}`),
  create: (postData) => apiRequestOffline('/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  }),
  update: (id, postData) => apiRequestOffline(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  }),
  delete: (id) => apiRequestWithRetry(`/posts/${id}`, {
    method: 'DELETE',
  }, false), // 删除操作不加入离线队列
};

// Pages
export const pagesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequestWithRetry(`/pages${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => apiRequestWithRetry(`/pages/${id}`),
  create: (pageData) => apiRequestOffline('/pages', {
    method: 'POST',
    body: JSON.stringify(pageData),
  }),
  update: (id, pageData) => apiRequestOffline(`/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(pageData),
  }),
  delete: (id) => apiRequestWithRetry(`/pages/${id}`, {
    method: 'DELETE',
  }, false),
};

// Users
export const usersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequestWithRetry(`/users${queryString ? '?' + queryString : ''}`);
  },
  getById: (id) => apiRequestWithRetry(`/users/${id}`),
  create: (userData) => apiRequestWithRetry('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  update: (id, userData) => apiRequestWithRetry(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  delete: (id) => apiRequestWithRetry(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Categories
export const categoriesAPI = {
  getAll: () => apiRequestWithRetry('/categories'),
  create: (categoryData) => apiRequestOffline('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }),
  update: (id, categoryData) => apiRequestOffline(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  }),
  delete: (id) => apiRequestWithRetry(`/categories/${id}`, {
    method: 'DELETE',
  }),
};

// Tags
export const tagsAPI = {
  getAll: () => apiRequestWithRetry('/tags'),
  create: (tagData) => apiRequestOffline('/tags', {
    method: 'POST',
    body: JSON.stringify(tagData),
  }),
  update: (id, tagData) => apiRequestOffline(`/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tagData),
  }),
  delete: (id) => apiRequestWithRetry(`/tags/${id}`, {
    method: 'DELETE',
  }),
};

// Menus
export const menusAPI = {
  getAll: () => apiRequestWithRetry('/menus'),
  create: (menuData) => apiRequestOffline('/menus', {
    method: 'POST',
    body: JSON.stringify(menuData),
  }),
  update: (id, menuData) => apiRequestOffline(`/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(menuData),
  }),
  delete: (id) => apiRequestWithRetry(`/menus/${id}`, {
    method: 'DELETE',
  }),
};

// Widgets
export const widgetsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequestWithRetry(`/widgets${queryString ? '?' + queryString : ''}`);
  },
  create: (widgetData) => apiRequestOffline('/widgets', {
    method: 'POST',
    body: JSON.stringify(widgetData),
  }),
  update: (id, widgetData) => apiRequestOffline(`/widgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(widgetData),
  }),
  delete: (id) => apiRequestWithRetry(`/widgets/${id}`, {
    method: 'DELETE',
  }),
};

// Media
export const mediaAPI = {
  getAll: () => apiRequestWithRetry('/media'),
  create: (mediaData) => apiRequestOffline('/media', {
    method: 'POST',
    body: JSON.stringify(mediaData),
  }),
  delete: (id) => apiRequestWithRetry(`/media/${id}`, {
    method: 'DELETE',
  }),
};

// Comments
export const commentsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequestWithRetry(`/comments${queryString ? '?' + queryString : ''}`);
  },
  updateStatus: (id, status) => apiRequestOffline(`/comments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  delete: (id) => apiRequestWithRetry(`/comments/${id}`, {
    method: 'DELETE',
  }),
};

// Settings
export const settingsAPI = {
  getAll: () => apiRequestWithRetry('/settings'),
  update: (settingsData) => apiRequestWithRetry('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData),
  }),
};

// Public
export const publicAPI = {
  getPosts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequestWithRetry(`/public/posts${queryString ? '?' + queryString : ''}`);
  },
  getPostById: (id) => apiRequestWithRetry(`/public/posts/${id}`),
  getPages: () => apiRequestWithRetry('/public/pages'),
  getPageBySlug: (slug) => apiRequestWithRetry(`/public/pages/${slug}`),
  getSettings: () => apiRequestWithRetry('/public/settings'),
};

// Health
export const healthAPI = {
  check: () => apiRequestWithRetry('/health'),
};

// SMTP
export const smtpAPI = {
  test: (useSavedConfig = true, testConfig = null) => apiRequestWithRetry('/smtp/test', {
    method: 'POST',
    body: JSON.stringify({ useSavedConfig, testConfig }),
  }),
  refresh: () => apiRequestWithRetry('/smtp/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
};

// Password Reset
export const passwordResetAPI = {
  sendCode: (email) => apiRequestWithRetry('/auth/send-verification-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyCode: (email, code) => apiRequestWithRetry('/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  }),
  reset: (email, code, newPassword) => apiRequestWithRetry('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  }),
};

// ==================== 离线队列处理器 ====================

export async function processOfflineQueue(notifyProgress) {
  const queue = getOfflineQueue();
  
  if (queue.length === 0) return { processed: 0, failed: 0 };
  
  let processed = 0;
  let failed = 0;
  
  for (const item of queue) {
    try {
      if (notifyProgress) {
        notifyProgress(`正在同步离线操作 (${processed + 1}/${queue.length})...`);
      }
      
      // 重新执行请求
      await apiRequestWithRetry(item.endpoint, item.options);
      
      // 成功后从队列移除
      removeFromOfflineQueue(item.id);
      processed++;
      
    } catch (error) {
      console.error('[OfflineQueue] Failed to process item:', item, error);
      failed++;
      
      // 如果是永久性错误（如认证失败），移除该请求
      if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
        removeFromOfflineQueue(item.id);
      }
    }
  }
  
  return { processed, failed };
}

// ==================== Hooks ====================

/**
 * 离线状态Hook
 * 注意：此 hook 已废弃，请使用 NetworkContext 中的 useNetwork hook
 * 保留此函数仅为向后兼容，实际不再注册新的监听器
 */
export function useOfflineStatus() {
  // 返回默认值，实际网络状态应通过 NetworkContext 获取
  console.warn('useOfflineStatus is deprecated. Please use useNetwork from NetworkContext instead.');
  return { isOnline: navigator.onLine, pendingCount: 0 };
}

// ==================== 导出 ====================

export default {
  setAuthToken,
  getAuthToken,
  ApiError,
  authAPI,
  postsAPI,
  pagesAPI,
  usersAPI,
  categoriesAPI,
  tagsAPI,
  menusAPI,
  widgetsAPI,
  mediaAPI,
  commentsAPI,
  settingsAPI,
  publicAPI,
  healthAPI,
  smtpAPI,
  passwordResetAPI,
  processOfflineQueue,
  getOfflineQueue,
  addToOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
};
