import { describe, it, expect } from 'vitest';
import {
  mergeThemes,
  generateThemeVariables,
  applyThemeToElement,
  getThemeValue,
} from './themeUtils';
import { ThemeConfig } from '../../types/theme';

describe('themeUtils', () => {
  describe('mergeThemes', () => {
    it('merges two simple themes', () => {
      const base: ThemeConfig = {
        colors: { primary: '#000000' },
      } as ThemeConfig;

      const override: ThemeConfig = {
        colors: { secondary: '#FFFFFF' },
      } as ThemeConfig;

      const merged = mergeThemes(base, override);

      expect(merged.colors?.primary).toBe('#000000');
      expect(merged.colors?.secondary).toBe('#FFFFFF');
    });

    it('overrides base theme values', () => {
      const base: ThemeConfig = {
        colors: { primary: '#000000' },
      } as ThemeConfig;

      const override: ThemeConfig = {
        colors: { primary: '#FF0000' },
      } as ThemeConfig;

      const merged = mergeThemes(base, override);

      expect(merged.colors?.primary).toBe('#FF0000');
    });

    it('handles nested objects', () => {
      const base: ThemeConfig = {
        typography: {
          fontSize: { sm: '12px', md: '14px' },
        },
      } as ThemeConfig;

      const override: ThemeConfig = {
        typography: {
          fontSize: { lg: '16px' },
        },
      } as ThemeConfig;

      const merged = mergeThemes(base, override);

      expect(merged.typography?.fontSize?.sm).toBe('12px');
      expect(merged.typography?.fontSize?.lg).toBe('16px');
    });

    it('preserves base theme when override is empty', () => {
      const base: ThemeConfig = {
        colors: { primary: '#000000' },
      } as ThemeConfig;

      const merged = mergeThemes(base, {} as ThemeConfig);

      expect(merged.colors?.primary).toBe('#000000');
    });
  });

  describe('generateThemeVariables', () => {
    it('generates CSS variables from colors', () => {
      const theme: ThemeConfig = {
        colors: { primary: '#3B82F6', secondary: '#10B981' },
      } as ThemeConfig;

      const variables = generateThemeVariables(theme);

      expect(variables['--csv-color-primary']).toBe('#3B82F6');
      expect(variables['--csv-color-secondary']).toBe('#10B981');
    });

    it('converts camelCase to kebab-case', () => {
      const theme: ThemeConfig = {
        colors: { primaryLight: '#ABCDEF' },
      } as ThemeConfig;

      const variables = generateThemeVariables(theme);

      expect(variables['--csv-color-primary-light']).toBe('#ABCDEF');
    });

    it('generates typography variables', () => {
      const theme: ThemeConfig = {
        typography: {
          fontFamily: 'Inter, sans-serif',
          fontSize: { sm: '12px', md: '14px' },
        },
      } as ThemeConfig;

      const variables = generateThemeVariables(theme);

      expect(variables['--csv-font-family']).toBe('Inter, sans-serif');
      expect(variables['--csv-text-sm']).toBe('12px');
      expect(variables['--csv-text-md']).toBe('14px');
    });

    it('generates spacing variables', () => {
      const theme: ThemeConfig = {
        spacing: { xs: '4px', sm: '8px', md: '16px' },
      } as ThemeConfig;

      const variables = generateThemeVariables(theme);

      expect(variables['--csv-spacing-xs']).toBe('4px');
      expect(variables['--csv-spacing-sm']).toBe('8px');
    });

    it('generates border variables', () => {
      const theme: ThemeConfig = {
        borders: {
          radius: { sm: '4px', md: '8px' },
          width: { thin: '1px', thick: '2px' },
        },
      } as ThemeConfig;

      const variables = generateThemeVariables(theme);

      expect(variables['--csv-radius-sm']).toBe('4px');
      expect(variables['--csv-border-thin']).toBe('1px');
    });

    it('generates shadow variables', () => {
      const theme: ThemeConfig = {
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.05)',
        },
      } as ThemeConfig;

      const variables = generateThemeVariables(theme);

      expect(variables['--csv-shadow-sm']).toBe('0 1px 2px rgba(0,0,0,0.05)');
    });

    it('generates animation variables', () => {
      const theme: ThemeConfig = {
        animations: {
          duration: { fast: '150ms', normal: '300ms' },
          easing: 'ease-in-out',
        },
      } as ThemeConfig;

      const variables = generateThemeVariables(theme);

      expect(variables['--csv-duration-fast']).toBe('150ms');
      expect(variables['--csv-easing']).toBe('ease-in-out');
    });

    it('handles empty theme', () => {
      const variables = generateThemeVariables({} as ThemeConfig);
      expect(Object.keys(variables).length).toBe(0);
    });
  });

  describe('applyThemeToElement', () => {
    it('applies CSS variables to element', () => {
      const element = document.createElement('div');
      const variables = {
        '--csv-color-primary': '#3B82F6',
        '--csv-spacing-md': '16px',
      };

      applyThemeToElement(element, variables);

      expect(element.style.getPropertyValue('--csv-color-primary')).toBe('#3B82F6');
      expect(element.style.getPropertyValue('--csv-spacing-md')).toBe('16px');
    });

    it('handles empty variables object', () => {
      const element = document.createElement('div');
      applyThemeToElement(element, {});

      expect(element.style.cssText).toBe('');
    });

    it('overwrites existing variables', () => {
      const element = document.createElement('div');
      element.style.setProperty('--csv-color-primary', '#000000');

      applyThemeToElement(element, { '--csv-color-primary': '#FFFFFF' });

      expect(element.style.getPropertyValue('--csv-color-primary')).toBe('#FFFFFF');
    });
  });

  describe('getThemeValue', () => {
    it('returns computed CSS variable value', () => {
      const element = document.createElement('div');
      element.style.setProperty('--csv-color-primary', '#3B82F6');
      document.body.appendChild(element);

      const value = getThemeValue(element, '--csv-color-primary');

      expect(value).toBe('#3B82F6');
      document.body.removeChild(element);
    });

    it('returns fallback for missing variable', () => {
      const element = document.createElement('div');
      const fallback = '#000000';

      const value = getThemeValue(element, '--csv-missing-var', fallback);

      expect(value).toBe(fallback);
    });

    it('returns empty string when no fallback provided', () => {
      const element = document.createElement('div');

      const value = getThemeValue(element, '--csv-missing-var');

      expect(value).toBe('');
    });
  });
});
