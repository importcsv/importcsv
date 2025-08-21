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
    port: 3001
  }
})