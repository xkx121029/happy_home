import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_TARGET = process.env.BACKEND_ORIGIN || 'http://localhost:3002'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 前端统一用相对路径 /api 请求，由 dev server 转发到后端。
      // 这样代码里不再硬编码 http://localhost:3002，部署时换反代即可，
      // 也顺带修掉了页面里直接 fetch('/api/...') 会打到 Vite 端口而 404 的问题。
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
      },
    },
  },
})