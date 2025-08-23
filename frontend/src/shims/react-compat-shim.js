// Re-export everything from React
export * from 'react';

// Explicitly export forwardRef since Preact code imports it from preact/compat
export { forwardRef } from 'react';

// If we need createPortal later, we can add:
// export { createPortal } from 'react-dom';