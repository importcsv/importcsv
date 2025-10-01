import { describe, it, expect } from 'vitest';
import stringsSimilarity from './stringSimilarity';

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringsSimilarity('test', 'test')).toBe(1);
    expect(stringsSimilarity('Hello World', 'Hello World')).toBe(1);
  });

  it('returns low similarity for completely different strings', () => {
    const similarity = stringsSimilarity('abc', 'xyz');
    expect(similarity).toBeLessThan(0.5);
  });

  it('is case-insensitive', () => {
    const similarity1 = stringsSimilarity('Test', 'test');
    const similarity2 = stringsSimilarity('test', 'test');
    expect(similarity1).toBe(similarity2);
  });

  it('handles partial matches', () => {
    const similarity = stringsSimilarity('testing', 'test');
    expect(similarity).toBeGreaterThan(0.5);
    expect(similarity).toBeLessThan(1);
  });

  it('handles empty strings', () => {
    expect(stringsSimilarity('', '')).toBe(1);
  });

  it('handles multi-word strings', () => {
    const similarity = stringsSimilarity('First Name', 'first name');
    expect(similarity).toBeGreaterThan(0.9);
  });

  it('finds best word match across multiple words', () => {
    const similarity = stringsSimilarity('email address', 'email');
    expect(similarity).toBeGreaterThan(0.8);
  });
});
