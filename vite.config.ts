import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 让服务器监听所有网络接口
    port: 5174 // 更改为未使用的端口
  },
  optimizeDeps: {
    include: ['uuid'] // 添加这行来优化 uuid 包
  },
})