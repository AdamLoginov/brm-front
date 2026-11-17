import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // --------- новый код chat: локальные API и файлы доступны на адресе фронтенда
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8080', changeOrigin: false } } },
  // --------- конец нового кода chat
})
