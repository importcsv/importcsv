import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/preact';
import { useRef } from 'preact/hooks';
import useEventListener from './useEventListener';

describe('useEventListener', () => {
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = vi.fn();
  });

  it('attaches event listener to window by default', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useEventListener('resize', handler));

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('calls handler when window event fires', () => {
    renderHook(() => useEventListener('resize', handler));

    window.dispatchEvent(new Event('resize'));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('attaches event listener to element when ref provided', () => {
    const { result } = renderHook(() => {
      const elementRef = useRef<HTMLDivElement>(null);
      // Create a mock element
      elementRef.current = document.createElement('div') as any;
      return { elementRef };
    });

    const addEventListenerSpy = vi.spyOn(result.current.elementRef.current!, 'addEventListener');

    renderHook(() => useEventListener('click', handler, result.current.elementRef));

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('calls handler when element event fires', () => {
    const { result } = renderHook(() => {
      const elementRef = useRef<HTMLDivElement>(null);
      elementRef.current = document.createElement('div') as any;
      return { elementRef };
    });

    renderHook(() => useEventListener('click', handler, result.current.elementRef));

    result.current.elementRef.current!.dispatchEvent(new Event('click'));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('updates handler without re-attaching listener', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(
      ({ h }) => useEventListener('resize', h),
      { initialProps: { h: handler1 } }
    );

    window.dispatchEvent(new Event('resize'));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    rerender({ h: handler2 });

    window.dispatchEvent(new Event('resize'));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useEventListener('resize', handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('falls back to window if element is null', () => {
    const elementRef = { current: null } as any;
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useEventListener('click', handler, elementRef));

    // Falls back to window when element is null
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });
});
