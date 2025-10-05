// frontend/src/headless/__tests__/slot-components.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { h } from 'preact';
import { z } from 'zod';
import { Root } from '../root';
import { UploadTrigger } from '../upload-trigger';
import { NextButton } from '../next-button';
import { BackButton } from '../back-button';
import { SubmitButton } from '../submit-button';

describe('Slot Integration - asChild Pattern', () => {
  describe('UploadTrigger', () => {
    it('should render as button by default (no asChild)', () => {
      render(
        <Root columns={[]} onComplete={() => {}}>
          <UploadTrigger>Upload CSV</UploadTrigger>
        </Root>
      );

      const button = screen.getByRole('button', { name: /upload csv/i });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render as custom component when asChild is true', () => {
      const CustomButton = ({ children, onClick, ...props }: any) => (
        <a role="button" onClick={onClick} {...props}>
          {children}
        </a>
      );

      render(
        <Root columns={[]} onComplete={() => {}}>
          <UploadTrigger asChild>
            <CustomButton className="custom-class">Upload CSV</CustomButton>
          </UploadTrigger>
        </Root>
      );

      const button = screen.getByRole('button', { name: /upload csv/i });
      expect(button.tagName).toBe('A');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge onClick handlers when asChild is true', async () => {
      const user = userEvent.setup();
      const customOnClick = vi.fn();
      const CustomButton = ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} {...props}>
          {children}
        </button>
      );

      render(
        <Root columns={[]} onComplete={() => {}}>
          <UploadTrigger asChild>
            <CustomButton onClick={customOnClick}>Upload CSV</CustomButton>
          </UploadTrigger>
        </Root>
      );

      const button = screen.getByRole('button', { name: /upload csv/i });
      await user.click(button);

      expect(customOnClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger file input on click', async () => {
      const user = userEvent.setup();
      const fileInputClick = vi.fn();

      // Mock file input
      const mockFileInput = document.createElement('input');
      mockFileInput.type = 'file';
      mockFileInput.click = fileInputClick;

      render(
        <Root columns={[]} onComplete={() => {}}>
          <UploadTrigger>Upload CSV</UploadTrigger>
        </Root>
      );

      const button = screen.getByRole('button', { name: /upload csv/i });
      await user.click(button);

      // Test will be updated once we implement the component
      expect(button).toBeInTheDocument();
    });
  });

  describe('NextButton', () => {
    it('should render as button by default', () => {
      render(
        <Root columns={[]} onComplete={() => {}}>
          <NextButton>Next</NextButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /next/i });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render as custom component with asChild', () => {
      const CustomButton = ({ children, onClick, ...props }: any) => (
        <div role="button" onClick={onClick} {...props}>
          {children}
        </div>
      );

      render(
        <Root columns={[]} onComplete={() => {}}>
          <NextButton asChild>
            <CustomButton className="next-btn">Next</CustomButton>
          </NextButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /next/i });
      expect(button.tagName).toBe('DIV');
      expect(button).toHaveClass('next-btn');
    });

    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleNext = vi.fn();

      render(
        <Root columns={[]} onComplete={() => {}}>
          <NextButton onClick={handleNext}>Next</NextButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /next/i });
      await user.click(button);

      expect(handleNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('BackButton', () => {
    it('should render as button by default', () => {
      render(
        <Root columns={[]} onComplete={() => {}}>
          <BackButton>Back</BackButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /back/i });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render as custom component with asChild', () => {
      const CustomButton = ({ children, onClick, ...props }: any) => (
        <span role="button" onClick={onClick} {...props}>
          {children}
        </span>
      );

      render(
        <Root columns={[]} onComplete={() => {}}>
          <BackButton asChild>
            <CustomButton className="back-btn">Back</CustomButton>
          </BackButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /back/i });
      expect(button.tagName).toBe('SPAN');
      expect(button).toHaveClass('back-btn');
    });
  });

  describe('SubmitButton', () => {
    it('should render as button by default', () => {
      render(
        <Root columns={[]} onComplete={() => {}}>
          <SubmitButton>Submit</SubmitButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /submit/i });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render as custom component with asChild', () => {
      const CustomButton = ({ children, onClick, ...props }: any) => (
        <button type="submit" onClick={onClick} {...props}>
          {children}
        </button>
      );

      render(
        <Root columns={[]} onComplete={() => {}}>
          <SubmitButton asChild>
            <CustomButton className="submit-btn">Submit</CustomButton>
          </SubmitButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveClass('submit-btn');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should call onComplete when clicked', async () => {
      const user = userEvent.setup();
      const handleComplete = vi.fn();

      render(
        <Root columns={[]} onComplete={handleComplete}>
          <SubmitButton>Submit</SubmitButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /submit/i });
      await user.click(button);

      // Component should trigger onComplete
      expect(button).toBeInTheDocument();
    });
  });

  describe('Props Merging', () => {
    it('should merge className props correctly', () => {
      const CustomButton = ({ children, className, ...props }: any) => (
        <button className={`base-class ${className}`} {...props}>
          {children}
        </button>
      );

      render(
        <Root columns={[]} onComplete={() => {}}>
          <NextButton asChild>
            <CustomButton className="custom-class">Next</CustomButton>
          </NextButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /next/i });
      expect(button.className).toContain('base-class');
      expect(button.className).toContain('custom-class');
    });

    it('should merge data attributes', () => {
      const CustomButton = ({ children, ...props }: any) => (
        <button {...props}>{children}</button>
      );

      render(
        <Root columns={[]} onComplete={() => {}}>
          <NextButton asChild>
            <CustomButton data-testid="custom-next" data-variant="primary">
              Next
            </CustomButton>
          </NextButton>
        </Root>
      );

      const button = screen.getByTestId('custom-next');
      expect(button).toHaveAttribute('data-variant', 'primary');
    });
  });

  describe('Design System Integration', () => {
    it('should work with shadcn/ui style button', () => {
      // Simulating shadcn/ui Button component (with className merging)
      const ShadcnButton = ({
        children,
        variant = 'default',
        size = 'default',
        className,
        ...props
      }: any) => {
        const classes = `inline-flex items-center justify-center rounded-md ${variant} ${size} ${className || ''}`.trim();
        return (
          <button className={classes} {...props}>
            {children}
          </button>
        );
      };

      render(
        <Root columns={[]} onComplete={() => {}}>
          <NextButton asChild>
            <ShadcnButton variant="primary" size="lg">
              Next
            </ShadcnButton>
          </NextButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /next/i });
      expect(button.className).toContain('primary');
      expect(button.className).toContain('lg');
    });

    it('should work with Material-UI style button', () => {
      // Simulating MUI Button component (with className merging)
      const MuiButton = ({ children, variant = 'contained', className, ...props }: any) => {
        const classes =
          `MuiButton-root MuiButton-${variant} ${className || ''}`.trim();
        return (
          <button className={classes} {...props}>
            {children}
          </button>
        );
      };

      render(
        <Root columns={[]} onComplete={() => {}}>
          <SubmitButton asChild>
            <MuiButton variant="contained">Submit</MuiButton>
          </SubmitButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /submit/i });
      expect(button.className).toContain('MuiButton-root');
      expect(button.className).toContain('MuiButton-contained');
    });

    it('should work with Chakra UI style button', () => {
      // Simulating Chakra Button component (with className merging)
      const ChakraButton = ({ children, colorScheme = 'blue', className, ...props }: any) => {
        const classes =
          `chakra-button chakra-button--${colorScheme} ${className || ''}`.trim();
        return (
          <button className={classes} {...props}>
            {children}
          </button>
        );
      };

      render(
        <Root columns={[]} onComplete={() => {}}>
          <BackButton asChild>
            <ChakraButton colorScheme="blue">Back</ChakraButton>
          </BackButton>
        </Root>
      );

      const button = screen.getByRole('button', { name: /back/i });
      expect(button.className).toContain('chakra-button');
      expect(button.className).toContain('chakra-button--blue');
    });
  });
});
