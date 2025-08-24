/**
 * Theme module exports
 * Central export point for all theme-related functionality
 */

export { styles, designTokens, cssVariables } from './styles';
export { presets } from './presets';
export { 
  applyTheme, 
  getCurrentTheme, 
  resetTheme, 
  createThemeFromColor,
  type SimpleTheme 
} from './runtime';

// Re-export for backward compatibility
export { styles as default } from './styles';