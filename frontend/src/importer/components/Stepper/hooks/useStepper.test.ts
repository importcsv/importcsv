import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import useStepper from './useStepper';
import { Step } from '../types';

describe('useStepper', () => {
  const mockSteps: Step[] = [
    { label: 'Upload', id: 0 },
    { label: 'Configure', id: 1 },
    { label: 'Validation', id: 2 },
  ];

  it('initializes with first step by default', () => {
    const { result } = renderHook(() => useStepper(mockSteps, 0, false));

    expect(result.current.current).toBe(0);
    expect(result.current.step).toEqual(mockSteps[0]);
  });

  it('initializes with custom initial step', () => {
    const { result } = renderHook(() => useStepper(mockSteps, 1, false));

    expect(result.current.current).toBe(1);
    expect(result.current.step).toEqual(mockSteps[1]);
  });

  it('returns all steps', () => {
    const { result } = renderHook(() => useStepper(mockSteps, 0, false));

    expect(result.current.steps).toEqual(mockSteps);
  });

  it('updates current step when setCurrent is called', () => {
    const { result } = renderHook(() => useStepper(mockSteps, 0, false));

    act(() => {
      result.current.setCurrent(2);
    });

    expect(result.current.current).toBe(2);
    expect(result.current.step).toEqual(mockSteps[2]);
  });

  it('returns skipHeader flag', () => {
    const { result: result1 } = renderHook(() => useStepper(mockSteps, 0, true));
    expect(result1.current.skipHeader).toBe(true);

    const { result: result2 } = renderHook(() => useStepper(mockSteps, 0, false));
    expect(result2.current.skipHeader).toBe(false);
  });

  it('updates step when current changes', () => {
    const { result } = renderHook(() => useStepper(mockSteps, 0, false));

    expect(result.current.step).toEqual(mockSteps[0]);

    act(() => {
      result.current.setCurrent(1);
    });

    expect(result.current.step).toEqual(mockSteps[1]);

    act(() => {
      result.current.setCurrent(2);
    });

    expect(result.current.step).toEqual(mockSteps[2]);
  });
});
