import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';
import Input from './index';

describe('Input component', () => {
  it('renders input with label', () => {
    render(h(Input, { label: 'Email', name: 'email' }));
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onInput = vi.fn();

    render(h(Input, { name: 'test', onChange, onInput }));
    const input = screen.getByRole('textbox') as HTMLInputElement;

    await user.type(input, 'Hello');

    // In Preact, onInput fires for text input events
    expect(onInput).toHaveBeenCalled();
    expect(input.value).toBe('Hello');
  });

  it('shows error message when invalid', () => {
    // Mock lucide-react icons since they may not render properly in test env
    const { container } = render(h(Input, {
      name: 'test',
      error: 'This field is required',
    }));

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    render(h(Input, { name: 'test', disabled: true }));
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('supports different input types', () => {
    const { rerender } = render(h(Input, { name: 'test', type: 'email' }));
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(h(Input, { name: 'test', type: 'password' }));
    const passwordInput = screen.getByLabelText(/^$/);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows placeholder', () => {
    render(h(Input, { name: 'test', placeholder: 'Enter value' }));
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const TestIcon = () => h('span', { 'data-testid': 'test-icon' }, '🔍');
    render(h(Input, { name: 'test', icon: h(TestIcon, {}) }));
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders with iconAfter', () => {
    const TestIcon = () => h('span', { 'data-testid': 'test-icon-after' }, '✓');
    render(h(Input, { name: 'test', iconAfter: h(TestIcon, {}) }));
    expect(screen.getByTestId('test-icon-after')).toBeInTheDocument();
  });

  it('renders select when options provided', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const options = {
      'Option 1': { value: 'opt1' },
      'Option 2': { value: 'opt2' },
    };

    render(h(Input, { name: 'test', options, onChange }));
    const input = screen.getByRole('textbox');

    // Click to open dropdown
    await user.click(input);

    // Options should be visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('handles select option change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const options = {
      'Option 1': { value: 'opt1' },
      'Option 2': { value: 'opt2' },
    };

    render(h(Input, { name: 'test', options, onChange }));
    const input = screen.getByRole('textbox');

    // Open dropdown
    await user.click(input);

    // Click option
    const option1 = screen.getByText('Option 1');
    await user.click(option1);

    expect(onChange).toHaveBeenCalledWith('opt1');
  });

  it('renders children', () => {
    render(h(Input, { name: 'test' }, h('div', {}, 'Helper text')));
    expect(screen.getByText('Helper text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(h(Input, { name: 'test', className: 'custom-input' }));
    expect(container.querySelector('.custom-input')).toBeInTheDocument();
  });
});
