import { useRef, useCallback, useState, useEffect } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  error: string | null;
  retry: () => void;
  save: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1500,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T>(data);
  const initialDataRef = useRef<T>(data);
  const isFirstRender = useRef(true);
  const isMountedRef = useRef(true);

  // Update data ref when data changes
  dataRef.current = data;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const performSave = useCallback(async () => {
    if (!enabled) return;

    // Clear any pending reset timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    setStatus('saving');
    setError(null);

    try {
      await onSave(dataRef.current);
      if (!isMountedRef.current) return;
      setStatus('saved');
      // Reset to idle after showing "saved" briefly
      resetTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setStatus('idle');
        }
      }, 2000);
    } catch (err) {
      if (!isMountedRef.current) return;
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
    }
  }, [onSave, enabled]);

  const retry = useCallback(() => {
    performSave();
  }, [performSave]);

  const save = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    performSave();
  }, [performSave]);

  // Debounced save on data change
  useEffect(() => {
    // Skip first render (initial data load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      initialDataRef.current = data;
      return;
    }

    // Skip if data hasn't actually changed from initial
    if (JSON.stringify(data) === JSON.stringify(initialDataRef.current)) {
      return;
    }

    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, performSave]);

  return { status, error, retry, save };
}
