import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/preact';
import useCustomStyles from './useCustomStyles';

describe('useCustomStyles', () => {
  it('applies custom styles to target element', () => {
    const targetElement = document.createElement('div');
    const customStyles = JSON.stringify({
      'primary-color': '#ff0000',
      'secondary-color': '#00ff00',
    });

    renderHook(() => useCustomStyles(customStyles, targetElement));

    expect(targetElement.style.getPropertyValue('--primary-color')).toBe('#ff0000');
    expect(targetElement.style.getPropertyValue('--secondary-color')).toBe('#00ff00');
  });

  it('does nothing when customStyles is undefined', () => {
    const targetElement = document.createElement('div');
    const setPropertySpy = vi.spyOn(targetElement.style, 'setProperty');

    renderHook(() => useCustomStyles(undefined, targetElement));

    expect(setPropertySpy).not.toHaveBeenCalled();

    setPropertySpy.mockRestore();
  });

  it('does nothing when targetElement is null', () => {
    const customStyles = JSON.stringify({ 'primary-color': '#ff0000' });

    // Should not throw
    expect(() => {
      renderHook(() => useCustomStyles(customStyles, null));
    }).not.toThrow();
  });

  it('updates styles when customStyles change', () => {
    const targetElement = document.createElement('div');
    const customStyles1 = JSON.stringify({ 'primary-color': '#ff0000' });
    const customStyles2 = JSON.stringify({ 'primary-color': '#0000ff' });

    const { rerender } = renderHook(
      ({ styles }) => useCustomStyles(styles, targetElement),
      { initialProps: { styles: customStyles1 } }
    );

    expect(targetElement.style.getPropertyValue('--primary-color')).toBe('#ff0000');

    rerender({ styles: customStyles2 });

    expect(targetElement.style.getPropertyValue('--primary-color')).toBe('#0000ff');
  });

  it('handles empty styles object', () => {
    const targetElement = document.createElement('div');
    const customStyles = JSON.stringify({});
    const setPropertySpy = vi.spyOn(targetElement.style, 'setProperty');

    renderHook(() => useCustomStyles(customStyles, targetElement));

    expect(setPropertySpy).not.toHaveBeenCalled();

    setPropertySpy.mockRestore();
  });
});
