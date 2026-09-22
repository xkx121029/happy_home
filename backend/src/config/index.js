/**
 * 集中读取环境变量并给出默认值。
 *
 * 必须在任何模块读取 process.env 之前先加载 backend/.env —— 这里在文件顶部
 * 就调用 dotenv，谁先 require 到本文件谁就顺带完成了 .env 的加载。
 * （原来 .env 根本没有被加载，配置实际全部来自代码里的硬编码，这里把它接回来。）
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const DEFAULT_JWT_SECRET = 'happyhome_jwt_secret_key';

const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (JWT_SECRET === DEFAULT_JWT_SECRET) {
  console.warn('[警告] JWT_SECRET 仍是默认值，请修改 backend/.env 中的 JWT_SECRET（见 .env.example）');
}

module.exports = {
  PORT: process.env.PORT || 3002,

  // CORS 白名单：原来是 cors() 全开放（Access-Control-Allow-Origin: *），
  // 任何站点都能带着用户凭证调这些接口。改为按配置放行。
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  JWT_SECRET,
  JWT_EXPIRES_IN,
  DEFAULT_JWT_SECRET,

  // 访客评论限流阈值（本地反复跑冒烟测试时可以通过环境变量把上限调高）
  COMMENT_RATE_LIMIT: {
    windowMs: Number(process.env.COMMENT_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
    max: Number(process.env.COMMENT_RATE_LIMIT_MAX) || 10,
  },
};