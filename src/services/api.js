const API_BASE_URL = 'http://localhost:3002/api';

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

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API 请求失败');
  }

  return data;
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
  updateStatus: (id, status) => apiRequest(`/comments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  delete: (id) => apiRequest(`/comments/${id}`, {
    method: 'DELETE',
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
  getCount: () => apiRequest('/notifications/count'),
  createDemo: () => apiRequest('/notifications/demo', {
    method: 'POST',
  }),
};

