import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn (className utility)', () => {
  it('merges class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active');
    expect(cn('base', false && 'active')).toBe('base');
  });

  it('merges Tailwind classes correctly', () => {
    // Should keep the last conflicting class
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('handles objects', () => {
    expect(cn({ class1: true, class2: false })).toBe('class1');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });
});
