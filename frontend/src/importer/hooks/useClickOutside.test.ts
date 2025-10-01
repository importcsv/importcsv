import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/preact';
import { useRef } from 'preact/hooks';
import { h } from 'preact';
import { render } from '@testing-library/preact';
import useClickOutside from './useClickOutside';

describe('useClickOutside', () => {
  let callback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    callback = vi.fn();
  });

  it('calls handler when clicking outside element', () => {
    const TestComponent = () => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, callback);
      return h('div', { ref }, 'Inside element');
    };

    const { container } = render(h(TestComponent));
    const insideElement = container.querySelector('div');

    // Click outside
    const outsideElement = document.body;
    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: outsideElement, enumerable: true });
    document.dispatchEvent(event);

    expect(callback).toHaveBeenCalledWith(false);
  });

  it('does not call handler when clicking inside element', () => {
    const TestComponent = () => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, callback);
      return h('div', { ref }, 'Inside element');
    };

    const { container } = render(h(TestComponent));
    const insideElement = container.querySelector('div')!;

    // Click inside
    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { value: insideElement, enumerable: true });
    document.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it('does not call handler when ref is null', () => {
    renderHook(() => useClickOutside(null, callback));

    const event = new MouseEvent('mousedown', { bubbles: true });
    document.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, callback);
      return ref;
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
