/**
 * 全站唯一的 HTTP 封装。
 *
 * 取代两套并存且互不知晓的实现：
 *   - services/api.js：简单 fetch，无超时、无重试、错误只保留 message
 *   - services/enhancedApi.js：有超时/重试/离线队列，但全项目只有一处动态引用，
 *     其余是死代码，而且离线队列的 key 与另外两处读写的地方对不上，
 *     队列永远不会被真正消费
 * 现在能力与实现都收敛在这里，services/api.js 只负责声明路径与方法。
 */
import { API_BASE_URL, REQUEST_TIMEOUT } from './env';
import { STORAGE_KEYS, readRaw, remove } from './storage';

/**
 * 统一错误类型。相比原始 Error 多带了状态码与错误码，
 * 调用方可以据此区分「未授权」「校验失败」「网络不通」等情况。
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details = null, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = isNetworkError;
  }
}

// token 缓存在模块内，避免每次都读 localStorage
let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
  if (token) {
    localStorage.setItem(STORAGE_KEYS.authToken, token);
  } else {
    remove(STORAGE_KEYS.authToken);
  }
}

export function getAuthToken() {
  if (!authToken) {
    authToken = readRaw(STORAGE_KEYS.authToken, null);
  }
  return authToken;
}

function clearAuthState() {
  authToken = null;
  remove(STORAGE_KEYS.authToken);
  remove(STORAGE_KEYS.isLoggedIn);
}

const STATUS_CODE_MAP = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_FAILED',
  429: 'RATE_LIMITED',
};

// 只读且为网络错误/服务端错误时才重试：写操作重试可能造成重复提交
const RETRY_DELAYS = [300, 900];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function rawRequest(endpoint, { method = 'GET', body, headers = {}, auth = true, signal } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  // 外部传入的 signal 也要能取消（例如组件卸载）
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const finalHeaders = { ...headers };
  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getAuthToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      // 401 说明 token 已失效：清掉它，避免后续请求继续带着废 token 空转。
      // 跳转登录交给路由守卫处理，这里不直接动 location。
      if (response.status === 401) {
        clearAuthState();
      }
      throw new ApiError(payload?.message || `请求失败（HTTP ${response.status}）`, {
        status: response.status,
        code: payload?.error?.code || STATUS_CODE_MAP[response.status] || 'HTTP_ERROR',
        details: payload?.details || null,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const aborted = error.name === 'AbortError';
    throw new ApiError(
      aborted ? '请求超时，请检查网络后重试' : '网络连接失败，请检查后端服务是否已启动',
      { code: aborted ? 'TIMEOUT' : 'NETWORK_ERROR', isNetworkError: true }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const retryable = method === 'GET';
  let lastError;

  for (let attempt = 0; attempt <= (retryable ? RETRY_DELAYS.length : 0); attempt += 1) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS[attempt - 1]);
    }
    try {
      return await rawRequest(endpoint, options);
    } catch (error) {
      lastError = error;
      const worthRetrying = error.isNetworkError || (error.status >= 500 && error.status < 600);
      if (!retryable || !worthRetrying) throw error;
    }
  }

  throw lastError;
}

export const http = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default http;