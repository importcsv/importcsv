import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [preact()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'build', 'examples'],
    testTimeout: process.env.CI ? 30000 : 10000,
    hookTimeout: process.env.CI ? 30000 : 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '**/node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        // Exclude all test files
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/**',
        // Examples and scripts are not library code
        'examples/**',
        'scripts/**',
        // Entry points are thin wrappers
        'src/App.jsx',
        'src/main.tsx',
        'src/js.tsx',
        'src/index.ts',
        'src/styles.ts',
        'src/bundled-styles.ts',
        // UI component wrappers (thin layers over external libs)
        'src/importer/components/ui/**',
        'src/components/Modal/**',
        // Feature pages (integration-tested, not unit-tested)
        'src/importer/features/main/index.tsx',
        'src/importer/features/complete/**',
        'src/importer/features/uploader/**',
        'src/importer/features/map-columns/**',
        'src/importer/features/row-selection/**',
        'src/importer/features/configure-import/**',
        // Infrastructure - these paths need ** at end
        'src/importer/providers/**',
        'src/importer/stores/**',
        'src/importer/theme/runtime.ts',
        'src/settings/**',
        'src/config/**',
        'src/shims/**',
        'src/i18n/**',
        'src/services/**',
      ],
      // Only report files that are actually tested
      all: false,
      // Per-file thresholds for core modules that must maintain high coverage
      thresholds: {
        // Global thresholds (relaxed - catches regressions)
        statements: 70,
        branches: 75,
        functions: 55,
        lines: 70,
        // Strict thresholds for core tested modules
        'src/headless/*.{ts,tsx}': {
          statements: 90,
          branches: 80,
          functions: 90,
          lines: 90,
        },
        'src/headless/utils/*.ts': {
          statements: 95,
          branches: 85,
          functions: 95,
          lines: 95,
        },
        'src/importer/utils/*.ts': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        'src/importer/services/mapping.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/importer/services/transformation.ts': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
        },
      },
    },
  },
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
});
