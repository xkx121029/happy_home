/**
 * 环境配置的唯一读取点。
 *
 * 原来 api.js 与 enhancedApi.js 各自硬编码了 http://localhost:3002/api，
 * 部署到任何其它机器上都会全站请求失败。
 */

// 默认走相对路径 /api：
//   开发环境由 vite.config.js 的 server.proxy 转发到后端；
//   生产环境由同源反向代理接住。
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

// 请求超时（毫秒）
export const REQUEST_TIMEOUT = Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 15000;