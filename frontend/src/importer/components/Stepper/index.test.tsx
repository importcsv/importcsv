import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { h } from 'preact';
import Stepper from './index';

describe('Stepper component', () => {
  const steps = [
    { label: 'Upload', disabled: false },
    { label: 'Map Columns', disabled: false },
    { label: 'Validate', disabled: false },
    { label: 'Complete', disabled: false },
  ];

  it('renders all steps', () => {
    render(h(Stepper, { steps, current: 0 }));

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Map Columns')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    render(h(Stepper, { steps, current: 1 }));

    const mapStep = screen.getByText('Map Columns');
    expect(mapStep).toHaveClass('text-blue-600');
    expect(mapStep).toHaveClass('font-semibold');
  });

  it('shows completed steps with checkmark', () => {
    const { container } = render(h(Stepper, { steps, current: 2 }));

    // First step (Upload) should be marked as done
    const uploadLabel = screen.getByText('Upload');
    expect(uploadLabel).toHaveClass('font-medium');

    // Completed steps should have check icon styling (border-blue-600)
    const stepCircles = container.querySelectorAll('.border-blue-600');
    expect(stepCircles.length).toBeGreaterThan(0);
  });

  it('shows step numbers for uncompleted steps', () => {
    render(h(Stepper, { steps, current: 0 }));

    // Step numbers should be visible for non-completed steps
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('filters out disabled steps', () => {
    const stepsWithDisabled = [
      { label: 'Upload', disabled: false },
      { label: 'Skip Me', disabled: true },
      { label: 'Map Columns', disabled: false },
      { label: 'Complete', disabled: false },
    ];

    render(h(Stepper, { steps: stepsWithDisabled, current: 0 }));

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.queryByText('Skip Me')).not.toBeInTheDocument();
    expect(screen.getByText('Map Columns')).toBeInTheDocument();
  });

  it('renders connector lines between steps', () => {
    const { container } = render(h(Stepper, { steps, current: 0 }));

    // Connector lines should exist between steps (there should be 3 connectors for 4 steps)
    const connectors = container.querySelectorAll('.mx-3');
    expect(connectors.length).toBe(3);
  });

  it('hides when hide prop is true', () => {
    const { container } = render(h(Stepper, { steps, current: 0, hide: true }));

    expect(container.firstChild).toBeNull();
  });

  it('applies different styles to active, done, and pending steps', () => {
    render(h(Stepper, { steps, current: 1 }));

    const uploadStep = screen.getByText('Upload');
    const mapStep = screen.getByText('Map Columns');
    const validateStep = screen.getByText('Validate');

    // Active step (Map Columns)
    expect(mapStep).toHaveClass('text-blue-600', 'font-semibold');

    // Done step (Upload)
    expect(uploadStep).toHaveClass('text-gray-700', 'font-medium');

    // Pending step (Validate)
    expect(validateStep).toHaveClass('text-gray-500');
  });

  it('shows all steps as pending when current is 0', () => {
    render(h(Stepper, { steps, current: 0 }));

    const uploadStep = screen.getByText('Upload');
    expect(uploadStep).toHaveClass('text-blue-600');

    // All other steps should be pending
    const mapStep = screen.getByText('Map Columns');
    const validateStep = screen.getByText('Validate');
    const completeStep = screen.getByText('Complete');

    expect(mapStep).toHaveClass('text-gray-500');
    expect(validateStep).toHaveClass('text-gray-500');
    expect(completeStep).toHaveClass('text-gray-500');
  });

  it('shows all steps as completed when current is last step', () => {
    render(h(Stepper, { steps, current: 3 }));

    const completeStep = screen.getByText('Complete');
    expect(completeStep).toHaveClass('text-blue-600', 'font-semibold');

    // Previous steps should be marked as done
    const uploadStep = screen.getByText('Upload');
    const mapStep = screen.getByText('Map Columns');
    const validateStep = screen.getByText('Validate');

    expect(uploadStep).toHaveClass('font-medium');
    expect(mapStep).toHaveClass('font-medium');
    expect(validateStep).toHaveClass('font-medium');
  });
});
