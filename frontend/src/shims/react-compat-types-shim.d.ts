// TypeScript type shim to bridge Preact and React types
// This allows Preact code to use React type definitions
// Based on HelloCSV's approach: https://github.com/HelloCSV/HelloCSV

// Declare that Preact modules export React types
declare module 'preact' {
  export * from 'react';
}

declare module 'preact/hooks' {
  export * from 'react';
}

declare module 'preact/compat' {
  export * from 'react';
  export { createPortal } from 'react-dom';
}

declare module 'preact/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

declare module 'preact/jsx-dev-runtime' {
  export * from 'react/jsx-dev-runtime';
}

// Type augmentations to handle Preact-specific types
declare module 'preact' {
  import type { ReactNode, ReactElement } from 'react';

  // Map Preact's ComponentChildren to React's ReactNode
  export interface ComponentChildren extends ReactNode {}

  // Ensure VNode is compatible with ReactElement
  export interface VNode extends ReactElement {}
}

// Extend global JSX namespace to include React types
declare global {
  namespace JSX {
    // Import React's JSX types
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
    interface Element extends React.ReactElement {}
    interface ElementClass extends React.Component<any> {}
    interface ElementAttributesProperty extends React.Component<any> {}
    interface ElementChildrenAttribute extends React.Component<any> {}

    // HTML attribute interfaces
    interface HTMLAttributes<T> extends React.HTMLAttributes<T> {}
    interface SVGAttributes<T> extends React.SVGAttributes<T> {}
    interface DOMAttributes<T> extends React.DOMAttributes<T> {}
    interface CSSProperties extends React.CSSProperties {}
  }
}

// Make common React types globally available for files that use them without imports
declare global {
  type ReactElement = React.ReactElement;
  type ReactNode = React.ReactNode;
  type PropsWithChildren<P = {}> = P & { children?: React.ReactNode };
  type ComponentChildren = React.ReactNode;
  type FunctionComponent<P = {}> = React.FC<P>;
  type FC<P = {}> = React.FC<P>;
}

// Export to make this a module
export {};