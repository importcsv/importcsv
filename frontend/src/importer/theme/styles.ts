/**
 * Core styles for the CSV Importer
 * These styles ensure consistent appearance across all screens
 * Can be overridden via the theme prop
 */

export const styles = {
  // Typography
  typography: {
    title: 'text-xl font-semibold text-gray-900',
    subtitle: 'text-sm text-gray-600',
    label: 'text-sm font-medium text-gray-700',
    body: 'text-sm text-gray-900',
    caption: 'text-xs text-gray-500',
  },

  // Spacing
  spacing: {
    page: 'p-0', // No padding on main container
    header: 'px-6 py-4',
    content: 'px-6 py-4',
    footer: 'px-6 py-4',
    section: 'mb-4',
  },

  // Layout
  layout: {
    header: 'px-6 py-4 bg-white',
    subHeader: 'px-6 py-4 bg-white',
    content: 'flex-1 overflow-auto',
    footer: 'px-6 py-4 bg-white flex justify-between items-center',
    container: 'flex flex-col h-full',
  },

  // Colors (as Tailwind classes)
  colors: {
    borderDefault: 'border-gray-200',
    bgPrimary: 'bg-white',
    bgSecondary: 'bg-gray-50',
    bgHover: 'hover:bg-gray-100',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
  },

  // Components
  components: {
    card: 'border border-gray-200 rounded-lg bg-white',
    input: 'w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
    table: 'min-w-full border-collapse',
    tableHeader: 'bg-gray-50 border-b-2 border-gray-200',
    tableRow: 'border-b border-gray-200 hover:bg-gray-50',
  },

  // Buttons (consistent with Button component)
  buttons: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  },
};

// CSS variables for dynamic theming
export const cssVariables = {
  // Colors
  '--csv-color-primary': '#2563eb',
  '--csv-color-primary-hover': '#1d4ed8',
  '--csv-color-primary-foreground': '#ffffff',
  '--csv-color-secondary': '#f3f4f6',
  '--csv-color-secondary-foreground': '#111827',
  '--csv-color-background': '#ffffff',
  '--csv-color-foreground': '#111827',
  '--csv-color-border': '#e5e7eb',
  '--csv-color-muted': '#f9fafb',
  '--csv-color-muted-foreground': '#6b7280',
  
  // Typography
  '--csv-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  '--csv-radius-sm': '0.25rem',
  '--csv-radius-md': '0.5rem',
  '--csv-radius-lg': '0.75rem',
  '--csv-radius-xl': '1rem',
};

// Backward compatibility export
export const designTokens = styles;