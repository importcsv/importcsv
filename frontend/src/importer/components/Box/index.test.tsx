import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { h } from 'preact';
import Box from './index';

describe('Box component', () => {
  it('renders children', () => {
    render(h(Box, {}, 'Test content'));
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    const { container } = render(h(Box, { className: 'custom-class' }));
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies style prop', () => {
    const { container } = render(h(Box, { style: { color: 'red' } }));
    expect(container.firstChild).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('applies variant classes', () => {
    const { container } = render(h(Box, { variants: ['fluid', 'space-l'] }));
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('max-w-none');
    expect(element).toHaveClass('p-8');
  });

  it('spreads additional props', () => {
    const { container } = render(h(Box, { 'data-testid': 'test-box' } as any));
    expect(container.firstChild).toHaveAttribute('data-testid', 'test-box');
  });

  it('renders with default classes', () => {
    const { container } = render(h(Box, {}));
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('block');
    expect(element).toHaveClass('mx-auto');
    expect(element).toHaveClass('bg-white');
    expect(element).toHaveClass('rounded-lg');
    expect(element).toHaveClass('shadow-lg');
  });

  it('combines variants with custom className', () => {
    const { container } = render(h(Box, {
      className: 'custom-class',
      variants: ['mid']
    }));
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('custom-class');
    expect(element).toHaveClass('max-w-[440px]');
  });
});
