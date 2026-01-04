/**
 * Pre-built theme presets for the CSV Importer
 * Use these as starting points or use them directly
 */

import { styles } from './styles';

export const presets = {
  // Default theme - clean and professional
  default: styles,

  // Minimal theme - black and white, clean lines
  minimal: {
    ...styles,
    typography: {
      ...styles.typography,
      title: 'text-lg font-medium text-black',
      subtitle: 'text-sm text-gray-700',
      label: 'text-sm font-normal text-black',
      body: 'text-sm text-black',
      caption: 'text-xs text-gray-600',
    },
    colors: {
      ...styles.colors,
      borderDefault: 'border-gray-300',
      bgPrimary: 'bg-white',
      bgSecondary: 'bg-gray-50',
      bgHover: 'hover:bg-gray-50',
      textPrimary: 'text-black',
      textSecondary: 'text-gray-700',
      textMuted: 'text-gray-500',
    },
    buttons: {
      primary: 'bg-black text-white hover:bg-gray-800',
      secondary: 'bg-white text-black hover:bg-gray-50 border border-black',
      outline: 'border border-gray-400 bg-white text-black hover:bg-gray-50',
    },
  },

  // Modern theme - rounded corners, gradients, shadows
  modern: {
    ...styles,
    typography: {
      ...styles.typography,
      title: 'text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent',
      subtitle: 'text-sm text-gray-600',
    },
    components: {
      card: 'border border-gray-200 rounded-xl bg-white shadow-lg',
      input: 'w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all',
      table: 'min-w-full border-collapse rounded-lg overflow-hidden',
      tableHeader: 'bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-gray-200',
      tableRow: 'border-b border-gray-100 hover:bg-gray-50 transition-colors',
    },
    buttons: {
      primary: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-lg transition-all',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-lg',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg',
    },
  },

  // Compact theme - less spacing for data-heavy interfaces
  compact: {
    ...styles,
    spacing: {
      page: 'p-0',
      header: 'px-4 py-2',
      content: 'px-4 py-2',
      footer: 'px-4 py-2',
      section: 'mb-2',
    },
    typography: {
      ...styles.typography,
      title: 'text-lg font-semibold text-gray-900',
      subtitle: 'text-xs text-gray-600',
      label: 'text-xs font-medium text-gray-700',
      body: 'text-xs text-gray-900',
      caption: 'text-xs text-gray-500',
    },
    components: {
      ...styles.components,
      input: 'w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500',
    },
  },

  // Dark theme - Linear-inspired forced dark mode
  // Uses the same hex values as styles.ts dark: variants for consistency
  // This preset forces dark mode regardless of system preference
  dark: {
    ...styles,
    typography: {
      title: 'text-xl font-semibold text-white',
      subtitle: 'text-sm text-[#a1a1a1]',
      label: 'text-sm font-medium text-[#e5e5e5]',
      body: 'text-sm text-[#e5e5e5]',
      caption: 'text-xs text-[#6b6b6b]',
    },
    spacing: styles.spacing,
    layout: {
      header: 'px-6 py-4 bg-[#121212]',
      subHeader: 'px-6 py-4 bg-[#121212]',
      content: 'flex-1 overflow-auto bg-[#121212]',
      footer: 'px-6 py-4 bg-[#121212] flex justify-between items-center',
      container: 'flex flex-col h-full bg-[#121212]',
    },
    colors: {
      borderDefault: 'border-[#3a3a3a]',
      bgPrimary: 'bg-[#121212]',
      bgSecondary: 'bg-[#1a1a1a]',
      bgSurface: 'bg-[#1a1a1a]',
      bgElevated: 'bg-[#242424]',
      bgHover: 'hover:bg-[#1e1e1e]',
      textPrimary: 'text-white',
      textSecondary: 'text-[#a1a1a1]',
      textMuted: 'text-[#6b6b6b]',
    },
    semantic: {
      warning: {
        bg: 'bg-[#2a1f0a]',
        border: 'border-[#5c4813]',
        text: 'text-[#fbbf24]',
        icon: 'text-[#fbbf24]',
      },
      error: {
        bg: 'bg-[#2a0a0a]',
        border: 'border-[#5c1313]',
        text: 'text-[#f87171]',
        icon: 'text-[#f87171]',
      },
      success: {
        bg: 'bg-[#0a2a0a]',
        border: 'border-[#135c13]',
        text: 'text-[#4ade80]',
        icon: 'text-[#4ade80]',
      },
      info: {
        bg: 'bg-[#0a1a2a]',
        border: 'border-[#1e3a5f]',
        text: 'text-[#60a5fa]',
        icon: 'text-[#60a5fa]',
      },
    },
    components: {
      card: 'border border-[#3a3a3a] rounded-lg bg-[#1a1a1a]',
      input: 'w-full px-3 py-2 text-sm border border-[#3a3a3a] rounded bg-[#1e1e1e] text-[#e5e5e5] placeholder:text-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-blue-500',
      table: 'min-w-full border-collapse',
      tableHeader: 'bg-[#1a1a1a] border-b-2 border-[#2a2a2a]',
      tableRow: 'border-b border-[#2a2a2a] hover:bg-[#1e1e1e]',
    },
    buttons: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-[#242424] text-[#e5e5e5] hover:bg-[#2a2a2a]',
      outline: 'border border-[#3a3a3a] bg-transparent text-[#e5e5e5] hover:bg-[#242424]',
    },
  },

  // Corporate theme - professional, trustworthy
  corporate: {
    ...styles,
    typography: {
      ...styles.typography,
      title: 'text-xl font-bold text-slate-800',
      subtitle: 'text-sm text-slate-600',
      label: 'text-sm font-semibold text-slate-700',
    },
    colors: {
      ...styles.colors,
      borderDefault: 'border-slate-300',
      bgPrimary: 'bg-white',
      bgSecondary: 'bg-slate-50',
      bgHover: 'hover:bg-slate-100',
      textPrimary: 'text-slate-800',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-500',
    },
    buttons: {
      primary: 'bg-slate-700 text-white hover:bg-slate-800',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
      outline: 'border border-slate-400 bg-white text-slate-700 hover:bg-slate-50',
    },
  },

  // Playful theme - colorful and friendly
  playful: {
    ...styles,
    typography: {
      ...styles.typography,
      title: 'text-2xl font-bold text-purple-700',
      subtitle: 'text-sm text-pink-600',
    },
    components: {
      card: 'border-2 border-purple-300 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50',
      input: 'w-full px-3 py-2 text-sm border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500',
      table: 'min-w-full border-collapse rounded-xl overflow-hidden',
      tableHeader: 'bg-gradient-to-r from-pink-100 to-purple-100 border-b-2 border-purple-300',
      tableRow: 'border-b border-purple-200 hover:bg-purple-50',
    },
    buttons: {
      primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-full',
      secondary: 'bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full',
      outline: 'border-2 border-purple-400 bg-white text-purple-700 hover:bg-purple-50 rounded-full',
    },
  },
};
