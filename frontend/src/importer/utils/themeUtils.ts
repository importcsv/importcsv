/**
 * Theme utility functions for the CSV Importer
 */

import { ThemeConfig } from "../../types/theme";

/**
 * Deep merge two theme configurations
 */
export function mergeThemes(base: ThemeConfig, override: ThemeConfig): ThemeConfig {
  const result: any = { ...base };
  
  Object.keys(override).forEach(key => {
    const k = key as keyof ThemeConfig;
    if (typeof override[k] === 'object' && !Array.isArray(override[k]) && override[k] !== null) {
      result[k] = mergeThemes(base[k] as any || {}, override[k] as any);
    } else {
      result[k] = override[k];
    }
  });
  
  return result;
}

/**
 * Generate CSS variables from theme configuration
 */
export function generateThemeVariables(theme: ThemeConfig): Record<string, string> {
  const variables: Record<string, string> = {};
  
  // Colors
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value) {
        variables[`--csv-color-${kebabCase(key)}`] = value;
      }
    });
  }
  
  // Typography
  if (theme.typography) {
    if (theme.typography.fontFamily) {
      variables['--csv-font-family'] = theme.typography.fontFamily;
    }
    if (theme.typography.fontFamilyMono) {
      variables['--csv-font-family-mono'] = theme.typography.fontFamilyMono;
    }
    
    // Font sizes
    if (theme.typography.fontSize) {
      Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-text-${key}`] = value;
        }
      });
    }
    
    // Font weights
    if (theme.typography.fontWeight) {
      Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-font-${key}`] = String(value);
        }
      });
    }
    
    // Line heights
    if (theme.typography.lineHeight) {
      Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-leading-${key}`] = value;
        }
      });
    }
  }
  
  // Spacing
  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      if (value) {
        variables[`--csv-spacing-${key}`] = value;
      }
    });
  }
  
  // Borders
  if (theme.borders) {
    if (theme.borders.radius) {
      Object.entries(theme.borders.radius).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-radius-${key}`] = value;
        }
      });
    }
    if (theme.borders.width) {
      Object.entries(theme.borders.width).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-border-${key}`] = value;
        }
      });
    }
  }
  
  // Shadows
  if (theme.shadows) {
    Object.entries(theme.shadows).forEach(([key, value]) => {
      if (value) {
        variables[`--csv-shadow-${key}`] = value;
      }
    });
  }
  
  // Animations
  if (theme.animations) {
    if (theme.animations.duration) {
      Object.entries(theme.animations.duration).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-duration-${key}`] = value;
        }
      });
    }
    if (theme.animations.easing) {
      variables['--csv-easing'] = theme.animations.easing;
    }
  }
  
  // Component-specific variables
  if (theme.components) {
    // Button
    if (theme.components.button) {
      Object.entries(theme.components.button).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-button-${kebabCase(key)}`] = value;
        }
      });
    }
    
    // Input
    if (theme.components.input) {
      Object.entries(theme.components.input).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-input-${kebabCase(key)}`] = value;
        }
      });
    }
    
    // Modal
    if (theme.components.modal) {
      Object.entries(theme.components.modal).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-modal-${kebabCase(key)}`] = value;
        }
      });
    }
    
    // Table
    if (theme.components.table) {
      Object.entries(theme.components.table).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-table-${kebabCase(key)}`] = value;
        }
      });
    }
    
    // Stepper
    if (theme.components.stepper) {
      Object.entries(theme.components.stepper).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-stepper-${kebabCase(key)}`] = value;
        }
      });
    }
    
    // Dropzone
    if (theme.components.dropzone) {
      Object.entries(theme.components.dropzone).forEach(([key, value]) => {
        if (value) {
          variables[`--csv-dropzone-${kebabCase(key)}`] = value;
        }
      });
    }
  }
  
  return variables;
}

/**
 * Apply CSS variables to an HTML element
 */
export function applyThemeToElement(element: HTMLElement, variables: Record<string, string>) {
  Object.entries(variables).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/**
 * Convert camelCase to kebab-case
 */
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Get computed theme value with fallback
 */
export function getThemeValue(
  element: HTMLElement, 
  variable: string, 
  fallback?: string
): string {
  const computed = getComputedStyle(element);
  return computed.getPropertyValue(variable).trim() || fallback || '';
}

/**
 * Create a theme from partial configuration
 */
export function createTheme(partial: Partial<ThemeConfig>): ThemeConfig {
  // Import at runtime to avoid circular dependency
  const { defaultTheme } = require('../../types/theme');
  return mergeThemes(defaultTheme, partial as ThemeConfig);
}