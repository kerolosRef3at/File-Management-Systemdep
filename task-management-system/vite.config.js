import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})