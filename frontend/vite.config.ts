import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import preact from '@preact/preset-vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(({ mode }) => {
  // Determine build mode
  const isReact = mode === 'react';
  const isBundled = mode === 'bundled';
  const isPreact = !isReact && !isBundled; // Default to Preact

  console.log(`Building in ${mode || 'preact'} mode`);

  return {
    plugins: [
      // Use React plugin for React mode, Preact plugin otherwise
      isReact ? react() : preact(),
      // Inject CSS directly into JavaScript for self-contained component
      cssInjectedByJsPlugin(),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'CSVImporter',
        formats: isBundled ? ['es', 'cjs', 'umd'] : ['es', 'cjs'],
        fileName: (format) => {
          if (format === 'umd') return 'index.umd.js';
          return format === 'es' ? 'index.esm.js' : 'index.js';
        },
      },
      rollupOptions: {
        // Different externals based on build mode
        external: isBundled 
          ? ['xlsx'] // Bundled mode includes Preact
          : isReact 
            ? ['react', 'react-dom', 'react/jsx-runtime', 'xlsx']
            : ['preact', 'preact/hooks', 'preact/compat', 'preact/jsx-runtime', 'xlsx'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'jsx',
            preact: 'preact',
            'preact/hooks': 'preactHooks',
            'preact/compat': 'preactCompat',
            'preact/jsx-runtime': 'preactJsx',
            xlsx: 'XLSX',
          },
          // CSS will be extracted as a separate file
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'index.css';
            return assetInfo.name;
          },
        },
        onwarn(warning, warn) {
          // Suppress "use client" directive warnings
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
          }
          warn(warning);
        },
      },
      sourcemap: true,
      // Ensure CSS is extracted as a single file
      cssCodeSplit: false,
      // Different output directories for different modes
      outDir: isReact ? 'build/react' : isBundled ? 'build/bundled' : 'build/preact',
      emptyOutDir: true,
    },
    css: {
      // PostCSS config is loaded from postcss.config.js
    },
    resolve: {
      alias: isReact ? {
        // For React mode, we need to handle imports differently
        // Since our code uses preact/hooks but React doesn't have that path
        'preact/hooks': resolve(__dirname, 'src/shims/react-hooks-shim.js'),
        'preact/compat': resolve(__dirname, 'src/shims/react-compat-shim.js'),
        'preact/jsx-runtime': 'react/jsx-runtime',
        // Map dev runtime to production runtime - React 19's jsxDEV calls getOwner() which doesn't exist in prod
        'preact/jsx-dev-runtime': 'react/jsx-runtime',
        // Map preact to compat shim (not directly to react) to get toChildArray etc.
        'preact': resolve(__dirname, 'src/shims/react-compat-shim.js'),
      } : {
        // For Preact/Bundled mode, map React imports to Preact compat
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
        'react/jsx-dev-runtime': 'preact/jsx-dev-runtime',
      },
    },
    define: {
      // Always use 'production' for library builds to avoid dev-only code paths
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.NPM_PACKAGE_BUILD': JSON.stringify(process.env.NPM_PACKAGE_BUILD || 'false'),
    },
  };
});