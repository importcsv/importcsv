// Named exports from React to avoid Vite interop issues
export {
  // Core React exports
  Component,
  PureComponent,
  memo,
  createElement,
  cloneElement,
  isValidElement,
  createContext,
  forwardRef,
  lazy,
  Suspense,
  Fragment,
  StrictMode,
  Profiler,

  // Hooks
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useDebugValue,
  useTransition,
  useDeferredValue,
  useId,
  useSyncExternalStore,

  // Types and utilities
  Children,
  version,

  // Re-export default
  default
} from 'react';

// Export createPortal from react-dom for Modal component
export { createPortal } from 'react-dom';