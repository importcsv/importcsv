import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import useMutableLocalStorage from './useMutableLocalStorage';

describe('useMutableLocalStorage', () => {
  const TEST_KEY = 'test-key';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns initial value when no stored value exists', () => {
    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('returns stored value when it exists', () => {
    localStorage.setItem(TEST_KEY, JSON.stringify('stored-value'));

    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, 'initial'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('updates stored value when setter is called', () => {
    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify('new-value'));
  });

  it('supports function updater', () => {
    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, 5));

    act(() => {
      result.current[1]((prev: number) => prev + 10);
    });

    expect(result.current[0]).toBe(15);
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(15));
  });

  it('handles objects', () => {
    const initialObject = { name: 'John', age: 30 };
    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, initialObject));

    expect(result.current[0]).toEqual(initialObject);

    const updatedObject = { name: 'Jane', age: 25 };
    act(() => {
      result.current[1](updatedObject);
    });

    expect(result.current[0]).toEqual(updatedObject);
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(updatedObject));
  });

  it('handles arrays', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, initialArray));

    expect(result.current[0]).toEqual(initialArray);

    const updatedArray = [4, 5, 6];
    act(() => {
      result.current[1](updatedArray);
    });

    expect(result.current[0]).toEqual(updatedArray);
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(updatedArray));
  });

  it('returns initial value on parse error', () => {
    localStorage.setItem(TEST_KEY, 'invalid-json{');

    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('updates value when key changes', () => {
    const key1 = 'key1';
    const key2 = 'key2';
    localStorage.setItem(key1, JSON.stringify('value1'));
    localStorage.setItem(key2, JSON.stringify('value2'));

    const { result, rerender } = renderHook(
      ({ key }) => useMutableLocalStorage(key, 'initial'),
      { initialProps: { key: key1 } }
    );

    expect(result.current[0]).toBe('value1');

    rerender({ key: key2 });

    expect(result.current[0]).toBe('value2');
  });

  it('handles null values', () => {
    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, null));

    expect(result.current[0]).toBe(null);

    act(() => {
      result.current[1]('not-null');
    });

    expect(result.current[0]).toBe('not-null');
  });

  it('handles boolean values', () => {
    const { result } = renderHook(() => useMutableLocalStorage(TEST_KEY, false));

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(true));
  });
});
