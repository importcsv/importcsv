// Shim to re-export React hooks for Preact compatibility
// This allows us to import from 'preact/hooks' but use React's hooks
export {
  useState,
  useEffect,
  useContext,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useDebugValue,
  useId,
} from 'react';

// Also export types that might be used
export * from 'react';