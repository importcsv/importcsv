import { describe, it, expect, vi } from 'vitest';
import {
  isValidColor,
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  generateColorPalette,
  applyColorPalette,
} from './colorUtils';

describe('colorUtils', () => {
  describe('isValidColor', () => {
    it('validates correct hex colors', () => {
      expect(isValidColor('#FF0000')).toBe(true);
      expect(isValidColor('#F00')).toBe(true);
      expect(isValidColor('#123ABC')).toBe(true);
    });

    it('rejects invalid hex colors', () => {
      expect(isValidColor('FF0000')).toBe(false); // Missing #
      expect(isValidColor('#GG0000')).toBe(false); // Invalid characters
      expect(isValidColor('#FF00')).toBe(false); // Wrong length
    });
  });

  describe('hexToRgb', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('handles lowercase hex', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('returns null for invalid hex', () => {
      expect(hexToRgb('#ZZZ')).toBeNull();
      expect(hexToRgb('invalid')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('converts RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('handles edge values', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });
  });

  describe('lightenColor', () => {
    it('lightens a color by percentage', () => {
      const lighter = lightenColor('#808080', 20);
      expect(lighter).not.toBe('#808080');
      const rgb = hexToRgb(lighter);
      expect(rgb?.r).toBeGreaterThan(128);
    });

    it('returns white when lightening white', () => {
      expect(lightenColor('#FFFFFF', 50)).toBe('#ffffff');
    });

    it('returns original for invalid hex', () => {
      expect(lightenColor('invalid', 20)).toBe('invalid');
    });
  });

  describe('darkenColor', () => {
    it('darkens a color by percentage', () => {
      const darker = darkenColor('#808080', 20);
      expect(darker).not.toBe('#808080');
      const rgb = hexToRgb(darker);
      expect(rgb?.r).toBeLessThan(128);
    });

    it('returns black when darkening black', () => {
      expect(darkenColor('#000000', 50)).toBe('#000000');
    });

    it('returns original for invalid hex', () => {
      expect(darkenColor('invalid', 20)).toBe('invalid');
    });
  });

  describe('generateColorPalette', () => {
    it('generates a full color palette', () => {
      const palette = generateColorPalette('#3B82F6');

      expect(palette).toHaveProperty('50');
      expect(palette).toHaveProperty('500');
      expect(palette).toHaveProperty('900');
      expect(palette[500]).toBe('#3B82F6'); // Base color
    });

    it('palette shades get progressively darker', () => {
      const palette = generateColorPalette('#FF0000');

      const rgb50 = hexToRgb(palette[50]);
      const rgb900 = hexToRgb(palette[900]);

      // 50 should be lighter than 900
      expect(rgb50?.r).toBeGreaterThan(rgb900?.r || 0);
    });
  });

  describe('applyColorPalette', () => {
    it('applies palette to element', () => {
      const element = document.createElement('div');
      applyColorPalette('#3B82F6', element);

      const primaryColor = element.style.getPropertyValue('--color-primary');
      expect(primaryColor).toBe('#3B82F6');
    });

    it('does not apply without target element', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      applyColorPalette('#FF0000');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
