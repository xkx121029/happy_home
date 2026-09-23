/**
 * 环境配置的唯一读取点。
 *
 * 原来 api.js 与 enhancedApi.js 各自硬编码了 http://localhost:3002/api，
 * 部署到任何其它机器上都会全站请求失败。
 */

// 默认走相对路径 /api/v1：
//   开发环境由 vite.config.js 的 server.proxy 转发到后端；
//   生产环境由同源反向代理接住。
//
// 版本号写在这里而不是每个端点里：后端把版本前缀统一挂在 server.js 的
// API_PREFIX 上，前端这一行就是整个迁移的全部改动。
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// 少数端点刻意不版本化（存活探针），它们的基址是不带版本的 /api。
export const API_UNVERSIONED_URL = import.meta.env.VITE_API_UNVERSIONED_URL || '/api';

export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

// 请求超时（毫秒）
export const REQUEST_TIMEOUT = Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 15000;