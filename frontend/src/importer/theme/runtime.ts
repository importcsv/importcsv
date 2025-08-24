/**
 * Runtime theme utilities for dynamic styling
 * Allows changing themes without re-rendering components
 */

import { presets } from './presets';
import { styles } from './styles';

export interface SimpleTheme {
  // Core colors
  colors?: {
    primary?: string;
    primaryHover?: string;
    background?: string;
    foreground?: string;
    border?: string;
    error?: string;
    success?: string;
    warning?: string;
  };
  
  // Typography
  typography?: {
    fontFamily?: string;
    fontSize?: {
      base?: string;
      small?: string;
      large?: string;
    };
  };
  
  // Spacing multiplier
  spacing?: {
    compact?: boolean;
    scale?: number; // Multiplier for all spacing
  };
  
  // Component styles
  components?: {
    button?: {
      variant?: 'solid' | 'outline' | 'ghost';
      rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    };
    table?: {
      striped?: boolean;
      bordered?: boolean;
      compact?: boolean;
    };
    modal?: {
      blur?: boolean;
      shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    };
    input?: {
      variant?: 'outline' | 'filled' | 'underline';
      rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    };
  };
}

/**
 * Apply a theme to the importer
 * Can accept preset name, theme object, or partial overrides
 */
export function applyTheme(
  container: HTMLElement,
  theme: string | SimpleTheme | typeof styles
) {
  // Get the base theme
  let themeStyles = styles;
  
  if (typeof theme === 'string') {
    // Use a preset
    themeStyles = presets[theme as keyof typeof presets] || styles;
  } else if (typeof theme === 'object') {
    // Check if it's a full theme (has typography, layout, etc.) or simple theme
    if ('typography' in theme && 'layout' in theme) {
      // Full theme object
      themeStyles = theme as typeof styles;
    } else {
      // Simple theme - convert to CSS variables
      applySimpleTheme(container, theme as SimpleTheme);
      return;
    }
  }
  
  // Apply CSS classes (for full themes)
  container.setAttribute('data-theme', typeof theme === 'string' ? theme : 'custom');
}

/**
 * Apply a simple theme using CSS variables
 */
function applySimpleTheme(container: HTMLElement, theme: SimpleTheme) {
  const root = container;
  
  // Apply colors
  if (theme.colors) {
    if (theme.colors.primary) {
      root.style.setProperty('--csv-color-primary', theme.colors.primary);
    }
    if (theme.colors.primaryHover) {
      root.style.setProperty('--csv-color-primary-hover', theme.colors.primaryHover);
    }
    if (theme.colors.background) {
      root.style.setProperty('--csv-color-background', theme.colors.background);
    }
    if (theme.colors.foreground) {
      root.style.setProperty('--csv-color-foreground', theme.colors.foreground);
    }
    if (theme.colors.border) {
      root.style.setProperty('--csv-color-border', theme.colors.border);
    }
    if (theme.colors.error) {
      root.style.setProperty('--csv-color-error', theme.colors.error);
    }
    if (theme.colors.success) {
      root.style.setProperty('--csv-color-success', theme.colors.success);
    }
    if (theme.colors.warning) {
      root.style.setProperty('--csv-color-warning', theme.colors.warning);
    }
  }
  
  // Apply typography
  if (theme.typography) {
    if (theme.typography.fontFamily) {
      root.style.setProperty('--csv-font-family', theme.typography.fontFamily);
    }
    if (theme.typography.fontSize) {
      if (theme.typography.fontSize.base) {
        root.style.setProperty('--csv-font-size-base', theme.typography.fontSize.base);
      }
      if (theme.typography.fontSize.small) {
        root.style.setProperty('--csv-font-size-sm', theme.typography.fontSize.small);
      }
      if (theme.typography.fontSize.large) {
        root.style.setProperty('--csv-font-size-lg', theme.typography.fontSize.large);
      }
    }
  }
  
  // Apply spacing
  if (theme.spacing) {
    if (theme.spacing.scale) {
      // Apply scale multiplier to all spacing values
      const scale = theme.spacing.scale;
      root.style.setProperty('--csv-spacing-xs', `${0.25 * scale}rem`);
      root.style.setProperty('--csv-spacing-sm', `${0.5 * scale}rem`);
      root.style.setProperty('--csv-spacing-md', `${1 * scale}rem`);
      root.style.setProperty('--csv-spacing-lg', `${1.5 * scale}rem`);
      root.style.setProperty('--csv-spacing-xl', `${2 * scale}rem`);
    }
    if (theme.spacing.compact) {
      // Apply compact spacing
      root.style.setProperty('--csv-spacing-xs', '0.125rem');
      root.style.setProperty('--csv-spacing-sm', '0.25rem');
      root.style.setProperty('--csv-spacing-md', '0.5rem');
      root.style.setProperty('--csv-spacing-lg', '0.75rem');
      root.style.setProperty('--csv-spacing-xl', '1rem');
    }
  }
  
  // Apply component styles as data attributes
  if (theme.components) {
    if (theme.components.button) {
      root.setAttribute('data-button-variant', theme.components.button.variant || 'solid');
      root.setAttribute('data-button-rounded', theme.components.button.rounded || 'md');
    }
    if (theme.components.table) {
      root.setAttribute('data-table-striped', String(theme.components.table.striped || false));
      root.setAttribute('data-table-bordered', String(theme.components.table.bordered || false));
      root.setAttribute('data-table-compact', String(theme.components.table.compact || false));
    }
    if (theme.components.modal) {
      root.setAttribute('data-modal-blur', String(theme.components.modal.blur || false));
      root.setAttribute('data-modal-shadow', theme.components.modal.shadow || 'lg');
    }
    if (theme.components.input) {
      root.setAttribute('data-input-variant', theme.components.input.variant || 'outline');
      root.setAttribute('data-input-rounded', theme.components.input.rounded || 'md');
    }
  }
}

/**
 * Get the current theme from a container
 */
export function getCurrentTheme(container: HTMLElement): string | null {
  return container.getAttribute('data-theme');
}

/**
 * Reset theme to default
 */
export function resetTheme(container: HTMLElement) {
  // Remove all CSS variables
  const computedStyle = getComputedStyle(container);
  for (const property of Array.from(computedStyle)) {
    if (property.startsWith('--csv-')) {
      container.style.removeProperty(property);
    }
  }
  
  // Remove data attributes
  const attributes = Array.from(container.attributes);
  for (const attr of attributes) {
    if (attr.name.startsWith('data-') && attr.name !== 'data-theme') {
      container.removeAttribute(attr.name);
    }
  }
  
  // Set to default theme
  container.setAttribute('data-theme', 'default');
}

/**
 * Create a theme from a primary color
 * Generates a full theme based on a single color
 */
export function createThemeFromColor(primaryColor: string): SimpleTheme {
  // Generate hover color (darken by 10%)
  const primaryHover = darkenColor(primaryColor, 10);
  
  return {
    colors: {
      primary: primaryColor,
      primaryHover: primaryHover,
      background: '#ffffff',
      foreground: '#111827',
      border: '#e5e7eb',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
    },
  };
}

/**
 * Helper function to darken a color
 */
function darkenColor(color: string, percent: number): string {
  // Simple darkening - in production, use a proper color library
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return `#${(
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)}`;
  }
  return color;
}