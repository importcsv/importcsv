import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import useStepNavigation, { StepEnum } from './useStepNavigation';

// Mock dependencies
vi.mock('../../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../components/Stepper/hooks/useStepper', () => ({
  default: vi.fn((steps, initialStep) => ({
    steps,
    current: initialStep,
    step: steps[initialStep],
    setCurrent: vi.fn(),
    skipHeader: false,
  })),
}));

describe('useStepNavigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with given step', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      expect(result.current.currentStep).toBe(StepEnum.Upload);
    });

    it('initializes at MapColumns step', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.MapColumns, false, true));

      expect(result.current.currentStep).toBe(StepEnum.MapColumns);
    });
  });

  describe('navigation', () => {
    it('advances to next step with goNext', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      act(() => {
        result.current.goNext();
      });

      expect(result.current.currentStep).toBe(StepEnum.RowSelection);
    });

    it('goes back to previous step with goBack', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.MapColumns, false, true));

      act(() => {
        result.current.goBack();
      });

      expect(result.current.currentStep).toBe(StepEnum.RowSelection);
    });

    it('does not go below step 0 with goBack', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      act(() => {
        result.current.goBack();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('sets specific step with setStep', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      act(() => {
        result.current.setStep(StepEnum.Validation);
      });

      expect(result.current.currentStep).toBe(StepEnum.Validation);
    });

    it('allows passing custom step to goBack', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Validation, false, true));

      act(() => {
        result.current.goBack(StepEnum.Upload);
      });

      expect(result.current.currentStep).toBe(StepEnum.Upload);
    });

    it('allows passing custom step to goNext', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      act(() => {
        result.current.goNext(StepEnum.Validation);
      });

      expect(result.current.currentStep).toBe(StepEnum.Validation);
    });
  });

  describe('skipHeader behavior', () => {
    it('skips RowSelection when skipHeader is true', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.RowSelection, true, true));

      act(() => {
        result.current.goNext(StepEnum.RowSelection);
      });

      expect(result.current.currentStep).toBe(StepEnum.MapColumns);
    });

    it('does not skip RowSelection when skipHeader is false', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      act(() => {
        result.current.goNext(StepEnum.RowSelection);
      });

      expect(result.current.currentStep).toBe(StepEnum.RowSelection);
    });
  });

  describe('demo mode', () => {
    it('uses state instead of localStorage in demo mode', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      act(() => {
        result.current.setStep(StepEnum.MapColumns);
      });

      expect(result.current.currentStep).toBe(StepEnum.MapColumns);
      // In demo mode, localStorage should not be used
      expect(localStorage.getItem('tf_steps')).toBeNull();
    });

    it('uses localStorage when not in demo mode', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, false));

      act(() => {
        result.current.setStep(StepEnum.MapColumns);
      });

      expect(localStorage.getItem('tf_steps')).toBe(JSON.stringify(StepEnum.MapColumns));
    });
  });

  describe('stepper integration', () => {
    it('provides stepper object', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      expect(result.current.stepper).toBeDefined();
      expect(result.current.stepper.steps).toBeDefined();
    });

    it('provides stepId from stepper', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      expect(result.current.stepId).toBeDefined();
    });
  });

  describe('step mapping', () => {
    it('maps Upload step to stepper index 0', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Upload, false, true));

      expect(result.current.stepper.current).toBe(0);
    });

    it('maps MapColumns step to stepper index 1', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.MapColumns, false, true));

      expect(result.current.stepper.current).toBe(1);
    });

    it('maps Validation step to stepper index 2', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Validation, false, true));

      expect(result.current.stepper.current).toBe(2);
    });

    it('maps Complete step to stepper index 3', () => {
      const { result } = renderHook(() => useStepNavigation(StepEnum.Complete, false, true));

      expect(result.current.stepper.current).toBe(3);
    });
  });
});
