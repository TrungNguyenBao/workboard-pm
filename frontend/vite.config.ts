import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'

const vitestConfig = defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})

export default mergeConfig(
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
          changeOrigin: true,
        },
        '/uploads': {
          target: process.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
          changeOrigin: true,
        },
        '/guides-static': {
          target: process.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }),
  vitestConfig,
)

