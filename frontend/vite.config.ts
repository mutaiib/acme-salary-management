/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8000' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // A screen test types in a dialog and takes 1 to 2 seconds. The default limit of
    // 5 seconds was too short when the computer was busy.
    testTimeout: 15_000,
  },
})
