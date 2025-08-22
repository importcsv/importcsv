import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@importcsv/react': resolve(__dirname, '../src/index.ts')
    }
  },
  server: {
    port: 3001,
    // Allow Vite dev server to serve and watch files from parent frontend/src
    fs: {
      allow: [resolve(__dirname, '..')],
    },
  }
})