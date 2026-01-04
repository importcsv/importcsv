/**
 * Core styles for the CSV Importer
 * These styles ensure consistent appearance across all screens
 * Can be overridden via the theme prop
 */

export const styles = {
  // Typography
  typography: {
    title: 'text-xl font-semibold text-gray-900 dark:text-white',
    subtitle: 'text-sm text-gray-600 dark:text-[#a1a1a1]',
    label: 'text-sm font-medium text-gray-700 dark:text-[#e5e5e5]',
    body: 'text-sm text-gray-900 dark:text-[#e5e5e5]',
    caption: 'text-xs text-gray-500 dark:text-[#6b6b6b]',
  },

  // Spacing
  spacing: {
    page: 'p-0',
    header: 'px-6 py-4',
    content: 'px-6 py-4',
    footer: 'px-6 py-4',
    section: 'mb-4',
  },

  // Layout
  layout: {
    header: 'px-6 py-4 bg-white dark:bg-[#121212]',
    subHeader: 'px-6 py-4 bg-white dark:bg-[#121212]',
    content: 'flex-1 overflow-auto',
    footer: 'px-6 py-4 bg-white dark:bg-[#121212] flex justify-between items-center',
    container: 'flex flex-col h-full',
  },

  // Colors (as Tailwind classes)
  colors: {
    borderDefault: 'border-gray-200 dark:border-[#3a3a3a]',
    bgPrimary: 'bg-white dark:bg-[#121212]',
    bgSecondary: 'bg-gray-50 dark:bg-[#1a1a1a]',
    bgSurface: 'bg-white dark:bg-[#1a1a1a]',
    bgElevated: 'bg-white dark:bg-[#242424]',
    bgHover: 'hover:bg-gray-100 dark:hover:bg-[#1e1e1e]',
    textPrimary: 'text-gray-900 dark:text-white',
    textSecondary: 'text-gray-600 dark:text-[#a1a1a1]',
    textMuted: 'text-gray-500 dark:text-[#6b6b6b]',
  },

  // Semantic colors
  semantic: {
    warning: {
      bg: 'bg-amber-50 dark:bg-[#2a1f0a]',
      border: 'border-amber-200 dark:border-[#5c4813]',
      text: 'text-amber-800 dark:text-[#fbbf24]',
      icon: 'text-amber-600 dark:text-[#fbbf24]',
    },
    error: {
      bg: 'bg-red-50 dark:bg-[#2a0a0a]',
      border: 'border-red-200 dark:border-[#5c1313]',
      text: 'text-red-800 dark:text-[#f87171]',
      icon: 'text-red-600 dark:text-[#f87171]',
    },
    success: {
      bg: 'bg-green-50 dark:bg-[#0a2a0a]',
      border: 'border-green-200 dark:border-[#135c13]',
      text: 'text-green-800 dark:text-[#4ade80]',
      icon: 'text-green-600 dark:text-[#4ade80]',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-[#0a1a2a]',
      border: 'border-blue-200 dark:border-[#1e3a5f]',
      text: 'text-blue-700 dark:text-[#60a5fa]',
      icon: 'text-blue-600 dark:text-[#60a5fa]',
    },
  },

  // Components
  components: {
    card: 'border border-gray-200 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1a1a1a]',
    input: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#3a3a3a] rounded bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-[#e5e5e5] placeholder:text-gray-400 dark:placeholder:text-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-blue-500',
    table: 'min-w-full border-collapse',
    tableHeader: 'bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-gray-200 dark:border-[#2a2a2a]',
    tableRow: 'border-b border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]',
  },

  // Buttons (consistent with Button component)
  buttons: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 dark:bg-[#242424] text-gray-900 dark:text-[#e5e5e5] hover:bg-gray-200 dark:hover:bg-[#2a2a2a]',
    outline: 'border border-gray-300 dark:border-[#3a3a3a] bg-white dark:bg-transparent text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-[#242424]',
  },
};

// CSS variables for dynamic theming
export const cssVariables = {
  // Colors - refined slate palette
  '--csv-color-primary': '#2563eb',
  '--csv-color-primary-hover': '#1d4ed8',
  '--csv-color-primary-foreground': '#ffffff',
  '--csv-color-secondary': '#f1f5f9',
  '--csv-color-secondary-foreground': '#0f172a',
  '--csv-color-background': '#ffffff',
  '--csv-color-foreground': '#0f172a',
  '--csv-color-border': '#e2e8f0',
  '--csv-color-muted': '#f8fafc',
  '--csv-color-muted-foreground': '#64748b',

  // Typography
  '--csv-font-family': '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  '--csv-font-family-display': '"DM Sans", sans-serif',
  '--csv-font-size-xs': '0.75rem',
  '--csv-font-size-sm': '0.875rem',
  '--csv-font-size-base': '1rem',
  '--csv-font-size-lg': '1.125rem',
  '--csv-font-size-xl': '1.25rem',

  // Spacing
  '--csv-spacing-xs': '0.25rem',
  '--csv-spacing-sm': '0.5rem',
  '--csv-spacing-md': '1rem',
  '--csv-spacing-lg': '1.5rem',
  '--csv-spacing-xl': '2rem',

  // Borders
  '--csv-radius-sm': '0.375rem',
  '--csv-radius-md': '0.5rem',
  '--csv-radius-lg': '0.75rem',
  '--csv-radius-xl': '1rem',

  // Shadows
  '--csv-shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  '--csv-shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  '--csv-shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
};

// Backward compatibility export
export const designTokens = styles;
