import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        timeout: 60000,       // 60s for AI image generation
        proxyTimeout: 60000   // 60s proxy timeout
      }
    }
  }
})
