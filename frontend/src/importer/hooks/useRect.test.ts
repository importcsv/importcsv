import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/preact';
import useRect from './useRect';

describe('useRect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial size of zero', () => {
    const { result } = renderHook(() => useRect());

    const [, size] = result.current;

    expect(size).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it('returns setRef callback', () => {
    const { result } = renderHook(() => useRect());

    const [setRef] = result.current;

    expect(typeof setRef).toBe('function');
  });

  it('updates size when ref is set', async () => {
    const { result } = renderHook(() => useRect<HTMLDivElement>());

    const mockElement = document.createElement('div');
    const mockRect = {
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      top: 20,
      right: 110,
      bottom: 220,
      left: 10,
      toJSON: () => {},
    };

    vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
    Object.defineProperty(mockElement, 'offsetWidth', { value: 100, configurable: true });
    Object.defineProperty(mockElement, 'offsetHeight', { value: 200, configurable: true });

    act(() => {
      const [setRef] = result.current;
      setRef(mockElement);
    });

    await waitFor(() => {
      const [, size] = result.current;
      expect(size.width).toBe(100);
      expect(size.height).toBe(200);
    });
  });

  it('returns updateRect function', () => {
    const { result } = renderHook(() => useRect());

    const [, , updateRect] = result.current;

    expect(typeof updateRect).toBe('function');
  });

  it('updates size when updateRect is called', async () => {
    const { result } = renderHook(() => useRect<HTMLDivElement>());

    const mockElement = document.createElement('div');
    const mockRect = {
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      top: 20,
      right: 110,
      bottom: 220,
      left: 10,
      toJSON: () => {},
    };

    vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue(mockRect as DOMRect);
    Object.defineProperty(mockElement, 'offsetWidth', { value: 100, configurable: true });
    Object.defineProperty(mockElement, 'offsetHeight', { value: 200, configurable: true });

    act(() => {
      const [setRef] = result.current;
      setRef(mockElement);
    });

    await waitFor(() => {
      const [, size] = result.current;
      expect(size.width).toBe(100);
    });

    // Update the mock rect
    const updatedRect = {
      x: 10,
      y: 20,
      width: 150,
      height: 250,
      top: 20,
      right: 160,
      bottom: 270,
      left: 10,
      toJSON: () => {},
    };
    vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue(updatedRect as DOMRect);
    Object.defineProperty(mockElement, 'offsetWidth', { value: 150, configurable: true });
    Object.defineProperty(mockElement, 'offsetHeight', { value: 250, configurable: true });

    act(() => {
      const [, , updateRect] = result.current;
      updateRect();
    });

    await waitFor(() => {
      const [, size] = result.current;
      expect(size.width).toBe(150);
      expect(size.height).toBe(250);
    });
  });

  it('listens to window resize event', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useRect());

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('listens to window mresize event', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useRect());

    expect(addEventListenerSpy).toHaveBeenCalledWith('mresize', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useRect());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mresize', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
