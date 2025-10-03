import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';
import Checkbox from './index';

describe('Checkbox component', () => {
  it('renders with label', () => {
    render(h(Checkbox, { label: 'Accept terms', name: 'terms' }));
    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
  });

  it('toggles checked state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(h(Checkbox, { label: 'Check me', name: 'test', onChange }));
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ checked: true }),
    }));
  });

  it('respects checked prop', () => {
    const { rerender } = render(h(Checkbox, { label: 'Test', name: 'test', checked: false }));
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    rerender(h(Checkbox, { label: 'Test', name: 'test', checked: true }));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('handles disabled state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(h(Checkbox, { label: 'Test', name: 'test', disabled: true, onChange }));
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).toBeDisabled();

    await user.click(checkbox);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(h(Checkbox, {
      label: 'Test',
      name: 'test',
      className: 'custom-checkbox'
    }));
    expect(container.querySelector('.custom-checkbox')).toBeInTheDocument();
  });

  it('spreads additional props to input', () => {
    render(h(Checkbox, {
      label: 'Test',
      name: 'test',
      'data-testid': 'my-checkbox'
    } as any));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-testid', 'my-checkbox');
  });

  it('renders without label', () => {
    render(h(Checkbox, { name: 'test' }));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });
});
