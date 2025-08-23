import { useEffect, useMemo } from "preact/hooks";
import type { JSX } from 'preact';
import { Toaster } from "../components/ui/toaster";
import { ThemeProps } from "./types";
import { applyColorPalette } from "../utils/colorUtils";
import { ThemeConfig, defaultTheme, presetThemes } from "../../types/theme";
import { mergeThemes, generateThemeVariables, applyThemeToElement } from "../utils/themeUtils";

export interface ThemeProviderProps extends ThemeProps {
  theme?: ThemeConfig | keyof typeof presetThemes;
  primaryColor?: string; // Backward compatibility
  customStyles?: Record<string, string> | string; // Backward compatibility
  targetElement?: HTMLElement;
}

export default function ThemeProvider({ 
  children, 
  theme, 
  primaryColor,
  customStyles,
  targetElement 
}: ThemeProviderProps): JSX.Element {
  
  // Resolve theme configuration
  const resolvedTheme = useMemo(() => {
    let baseTheme = defaultTheme;
    
    // If theme is a string, get preset
    if (typeof theme === 'string' && theme in presetThemes) {
      baseTheme = mergeThemes(defaultTheme, presetThemes[theme as keyof typeof presetThemes]);
    } 
    // If theme is an object, merge with defaults
    else if (typeof theme === 'object') {
      baseTheme = mergeThemes(defaultTheme, theme);
    }
    
    // Apply backward compatibility overrides
    if (primaryColor) {
      baseTheme = mergeThemes(baseTheme, {
        colors: { 
          primary: primaryColor,
          primaryHover: primaryColor // Will be darkened by colorUtils
        }
      });
    }
    
    return baseTheme;
  }, [theme, primaryColor]);
  
  useEffect(() => {
    // Generate CSS variables from theme
    const cssVariables = generateThemeVariables(resolvedTheme);
    
    // Apply to target element or find closest .importcsv element
    const target = targetElement || 
                  document.querySelector('.importcsv') as HTMLElement || 
                  document.documentElement;
    
    if (target) {
      applyThemeToElement(target, cssVariables);
      
      // Apply custom styles (backward compatibility)
      if (customStyles) {
        const styles = typeof customStyles === 'string' 
          ? JSON.parse(customStyles) 
          : customStyles;
          
        Object.entries(styles).forEach(([key, value]) => {
          target.style.setProperty(`--${key}`, value as string);
        });
      }
      
      // Apply color palette for backward compatibility
      if (primaryColor) {
        applyColorPalette(primaryColor, target);
      }
    }
  }, [resolvedTheme, customStyles, primaryColor, targetElement]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
