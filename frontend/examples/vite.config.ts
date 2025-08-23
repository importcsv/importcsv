import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@importcsv/react': resolve(__dirname, '../src/index.ts'),
      // Use our React compat shim for preact/compat imports
      'preact/compat': resolve(__dirname, '../src/shims/react-compat-shim.js'),
      // Map other Preact imports to React
      'preact/hooks': 'react',
      'preact/jsx-runtime': 'react/jsx-runtime',
      'preact/jsx-dev-runtime': 'react/jsx-dev-runtime',
      'preact': 'react'
    }
  },
  optimizeDeps: {
    // Don't pre-optimize our local package
    exclude: ['@importcsv/react'],
    // Force include React to avoid issues
    include: ['react', 'react-dom']
  },
  server: {
    port: 3001,
    // Allow Vite dev server to serve and watch files from parent frontend/src
    fs: {
      allow: [resolve(__dirname, '..')],
    },
  }
})