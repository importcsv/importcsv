import { render as preactRender, RenderOptions } from '@testing-library/preact';
import { VNode } from 'preact';

/**
 * Custom render function that wraps components with common providers
 */
export function render(ui: VNode<any>, options?: RenderOptions) {
  return preactRender(ui, { ...options });
}

/**
 * Re-export everything from testing library
 */
export * from '@testing-library/preact';
export { default as userEvent } from '@testing-library/user-event';
