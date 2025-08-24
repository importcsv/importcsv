/**
 * Theme configuration types for CSV Importer
 */

export interface ThemeConfig {
  // Color System
  colors?: {
    // Primary colors
    primary?: string;
    primaryHover?: string;
    primaryForeground?: string;
    
    // Secondary colors
    secondary?: string;
    secondaryHover?: string;
    secondaryForeground?: string;
    
    // Base colors
    background?: string;
    foreground?: string;
    
    // Component colors
    card?: string;
    cardForeground?: string;
    
    // Border and input
    border?: string;
    input?: string;
    ring?: string;
    
    // Muted colors
    muted?: string;
    mutedForeground?: string;
    
    // Accent colors
    accent?: string;
    accentForeground?: string;
    
    // Semantic colors
    destructive?: string;
    destructiveForeground?: string;
    success?: string;
    successForeground?: string;
    warning?: string;
    warningForeground?: string;
    info?: string;
    infoForeground?: string;
  };
  
  // Typography System
  typography?: {
    fontFamily?: string;
    fontFamilyMono?: string;
    
    fontSize?: {
      xs?: string;
      sm?: string;
      base?: string;
      lg?: string;
      xl?: string;
      '2xl'?: string;
      '3xl'?: string;
    };
    
    fontWeight?: {
      light?: number;
      normal?: number;
      medium?: number;
      semibold?: number;
      bold?: number;
    };
    
    lineHeight?: {
      tight?: string;
      normal?: string;
      relaxed?: string;
    };
  };
  
  // Spacing System
  spacing?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    '3xl'?: string;
  };
  
  // Border System
  borders?: {
    radius?: {
      none?: string;
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
      full?: string;
    };
    width?: {
      none?: string;
      thin?: string;
      medium?: string;
      thick?: string;
    };
  };
  
  // Component-Specific Overrides
  components?: {
    button?: {
      padding?: string;
      fontSize?: string;
      fontWeight?: string;
      borderRadius?: string;
      height?: string;
      minWidth?: string;
    };
    
    input?: {
      padding?: string;
      fontSize?: string;
      borderRadius?: string;
      borderWidth?: string;
      height?: string;
      background?: string;
    };
    
    modal?: {
      width?: string;
      maxWidth?: string;
      maxHeight?: string;
      padding?: string;
      borderRadius?: string;
      backdropOpacity?: string;
    };
    
    table?: {
      headerBackground?: string;
      headerForeground?: string;
      rowHoverBackground?: string;
      borderColor?: string;
      cellPadding?: string;
    };
    
    stepper?: {
      activeColor?: string;
      inactiveColor?: string;
      completedColor?: string;
      lineColor?: string;
      dotSize?: string;
    };
    
    dropzone?: {
      borderStyle?: string;
      borderColor?: string;
      borderColorHover?: string;
      backgroundColor?: string;
      backgroundColorHover?: string;
      padding?: string;
      borderRadius?: string;
    };
  };
  
  // Shadow System
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  
  // Animation System
  animations?: {
    duration?: {
      fast?: string;
      normal?: string;
      slow?: string;
    };
    easing?: string;
  };
}

// Default theme configuration
export const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryForeground: '#ffffff',
    secondary: '#f3f4f6',
    secondaryHover: '#e5e7eb',
    secondaryForeground: '#111827',
    background: '#ffffff',
    foreground: '#111827',
    card: '#ffffff',
    cardForeground: '#111827',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#2563eb',
    muted: '#f9fafb',
    mutedForeground: '#6b7280',
    accent: '#f3f4f6',
    accentForeground: '#111827',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    success: '#10b981',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#ffffff',
    info: '#3b82f6',
    infoForeground: '#ffffff',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borders: {
    radius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    width: {
      none: '0',
      thin: '1px',
      medium: '2px',
      thick: '4px',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  animations: {
    duration: {
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Preset themes
export const presetThemes = {
  default: defaultTheme,
  
  minimal: {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: '#000000',
      primaryHover: '#333333',
      secondary: '#ffffff',
      secondaryForeground: '#000000',
      border: '#e5e5e5',
    },
    typography: {
      ...defaultTheme.typography,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    borders: {
      ...defaultTheme.borders,
      radius: {
        none: '0',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        full: '9999px',
      }
    }
  } as ThemeConfig,
  
  modern: {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      secondary: '#f0f9ff',
      secondaryForeground: '#1e293b',
      accent: '#10b981',
      accentForeground: '#ffffff',
    },
    typography: {
      ...defaultTheme.typography,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    borders: {
      ...defaultTheme.borders,
      radius: {
        none: '0',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        full: '9999px',
      }
    },
    shadows: {
      sm: '0 2px 4px rgba(0,0,0,0.08)',
      md: '0 4px 8px rgba(0,0,0,0.12)',
      lg: '0 8px 16px rgba(0,0,0,0.16)',
      xl: '0 12px 24px rgba(0,0,0,0.20)',
    }
  } as ThemeConfig,
  
  compact: {
    ...defaultTheme,
    spacing: {
      xs: '2px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '24px',
      '3xl': '32px',
    },
    components: {
      button: {
        height: '32px',
        padding: '0 12px',
        fontSize: '13px',
      },
      input: {
        height: '32px',
        padding: '0 8px',
        fontSize: '13px',
      },
      table: {
        cellPadding: '6px 8px',
      }
    }
  } as ThemeConfig,
  
  dark: {
    ...defaultTheme,
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryForeground: '#ffffff',
      secondary: '#1f2937',
      secondaryHover: '#374151',
      secondaryForeground: '#f9fafb',
      background: '#111827',
      foreground: '#f9fafb',
      card: '#1f2937',
      cardForeground: '#f9fafb',
      border: '#374151',
      input: '#374151',
      ring: '#3b82f6',
      muted: '#1f2937',
      mutedForeground: '#9ca3af',
      accent: '#374151',
      accentForeground: '#f9fafb',
      destructive: '#dc2626',
      destructiveForeground: '#ffffff',
      success: '#10b981',
      successForeground: '#ffffff',
      warning: '#f59e0b',
      warningForeground: '#ffffff',
      info: '#3b82f6',
      infoForeground: '#ffffff',
    },
  } as ThemeConfig,
};