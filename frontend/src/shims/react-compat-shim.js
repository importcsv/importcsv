// Shim to make preact/compat imports work with React
// This file exports both React and ReactDOM functions as needed by Preact components

import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Export everything from React
export * from 'react';
export { default } from 'react';

// Export ReactDOM functions that preact/compat would normally provide
export const createPortal = ReactDOM.createPortal;
export const render = ReactDOM.render;
export const hydrate = ReactDOM.hydrate;
export const unmountComponentAtNode = ReactDOM.unmountComponentAtNode;
export const findDOMNode = ReactDOM.findDOMNode;