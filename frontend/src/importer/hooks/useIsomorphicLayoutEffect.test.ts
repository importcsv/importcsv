import { describe, it, expect } from 'vitest';
import { useLayoutEffect } from 'preact/hooks';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';

describe('useIsomorphicLayoutEffect', () => {
  it('exports useLayoutEffect in browser environment', () => {
    // In a browser environment (vitest with jsdom), useIsomorphicLayoutEffect should be useLayoutEffect
    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });

  it('is a function', () => {
    expect(typeof useIsomorphicLayoutEffect).toBe('function');
  });
});
