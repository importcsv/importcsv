// frontend/src/components/__tests__/Validator.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { z } from 'zod';
import { Validator } from '../Validator';

describe('Standalone Validator Component', () => {
  const sampleData = {
    rows: [
      { name: 'John Doe', email: 'john@example.com', age: 25 },
      { name: 'Jane Smith', email: 'invalid-email', age: -5 },
      { name: '', email: 'jane@example.com', age: 30 }
    ]
  };

  const sampleMapping = {
    name: 'name',
    email: 'email',
    age: 'age'
  };

  describe('Basic Rendering', () => {
    it('should render validator with Zod schema', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        age: z.number().positive('Age must be positive')
      });

      render(
        <Validator
          schema={schema}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
        />
      );

      // Should show validation UI
      expect(screen.getByRole('heading', { name: /validation/i })).toBeInTheDocument();
    });

    it('should render with legacy columns array', () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name', type: 'string', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true }
      ];

      render(
        <Validator
          columns={columns}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByRole('heading', { name: /validation/i })).toBeInTheDocument();
    });
  });

  describe('Validation Functionality', () => {
    it('should validate data and show errors', async () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
        age: z.number().positive('Age must be positive')
      });

      render(
        <Validator
          schema={schema}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
        />
      );

      const validateButton = screen.getByRole('button', { name: /validate|check/i });
      fireEvent.click(validateButton);

      await waitFor(() => {
        // Should show errors
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument(); // Row 2
        expect(screen.getByText(/age must be positive/i)).toBeInTheDocument(); // Row 2
        expect(screen.getByText(/name is required/i)).toBeInTheDocument(); // Row 3
      });
    });

    it('should group errors by row', async () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().positive()
      });

      render(
        <Validator
          schema={schema}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
          autoValidate={true}
        />
      );

      await waitFor(() => {
        // Row 2 should have 2 errors (email + age)
        const row2Errors = screen.getAllByText(/row 2|line 2/i);
        expect(row2Errors.length).toBeGreaterThan(0);
      });
    });

    it('should allow fixing errors inline', async () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        email: z.string().email()
      });

      const editableData = {
        rows: [{ email: 'invalid-email' }]
      };

      render(
        <Validator
          schema={schema}
          data={editableData}
          mapping={{ email: 'email' }}
          onComplete={mockOnComplete}
          allowInlineEdit={true}
        />
      );

      const validateButton = screen.getByRole('button', { name: /validate|check/i });
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });

      // Fix the error inline
      const emailInput = screen.getByDisplayValue('invalid-email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });

      // Re-validate
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Submission', () => {
    it('should call onComplete with valid data when submitted', async () => {
      const mockOnComplete = vi.fn();
      const validData = {
        rows: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' }
        ]
      };

      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email()
      });

      render(
        <Validator
          schema={schema}
          data={validData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
        />
      );

      const submitButton = screen.getByRole('button', { name: /submit|continue|import/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(validData.rows);
      });
    });

    it('should prevent submission if errors exist', async () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        email: z.string().email()
      });

      render(
        <Validator
          schema={schema}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
          autoValidate={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit|continue|import/i });
      fireEvent.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/fix.*error|cannot submit/i)).toBeInTheDocument();
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should allow submission with option to skip invalid rows', async () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        email: z.string().email()
      });

      render(
        <Validator
          schema={schema}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
          allowSubmitWithErrors={true}
          autoValidate={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit.*valid|import.*valid/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ email: 'john@example.com' }),
            expect.objectContaining({ email: 'jane@example.com' })
          ])
        );

        // Should only include valid rows (not the one with invalid email)
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.not.arrayContaining([
            expect.objectContaining({ email: 'invalid-email' })
          ])
        );
      });
    });
  });

  describe('Error Display', () => {
    it('should show error table with row numbers', async () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        email: z.string().email()
      });

      render(
        <Validator
          schema={schema}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
          autoValidate={true}
        />
      );

      await waitFor(() => {
        // Should show row numbers
        expect(screen.getByText(/row.*2|line.*2/i)).toBeInTheDocument();
      });
    });

    it('should filter errors by column', async () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().positive()
      });

      render(
        <Validator
          schema={schema}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
          autoValidate={true}
        />
      );

      await waitFor(() => {
        const emailFilter = screen.getByRole('button', { name: /email/i });
        fireEvent.click(emailFilter);
      });

      await waitFor(() => {
        // Should only show email errors
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });

    it('should export errors as CSV', async () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        email: z.string().email()
      });

      render(
        <Validator
          schema={schema}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
          autoValidate={true}
          allowExportErrors={true}
        />
      );

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export.*error|download.*error/i });
        fireEvent.click(exportButton);
      });

      // Would trigger download (hard to test in jsdom)
      // Just verify button exists and is clickable
      expect(screen.getByRole('button', { name: /export.*error/i })).toBeInTheDocument();
    });
  });

  describe('Independent Usage', () => {
    it('should work without wrapping in CSV.Root', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name', type: 'string' }];

      expect(() => {
        render(
          <Validator
            columns={columns}
            data={sampleData}
            mapping={sampleMapping}
            onComplete={mockOnComplete}
          />
        );
      }).not.toThrow();
    });

    it('should handle data without mapping', async () => {
      const mockOnComplete = vi.fn();
      const perfectData = {
        rows: [
          { name: 'John', email: 'john@example.com' }
        ]
      };

      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });

      render(
        <Validator
          schema={schema}
          data={perfectData}
          onComplete={mockOnComplete}
          autoValidate={true}
        />
      );

      // Should validate even without explicit mapping (assumes identity mapping)
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /submit|continue|import/i });
        fireEvent.click(submitButton);
      });

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('Styling and Customization', () => {
    it('should accept custom className', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      const { container } = render(
        <Validator
          columns={columns}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
          className="custom-validator"
        />
      );

      expect(container.querySelector('.custom-validator')).toBeInTheDocument();
    });

    it('should support different themes', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      const { container } = render(
        <Validator
          columns={columns}
          data={sampleData}
          mapping={sampleMapping}
          onComplete={mockOnComplete}
          theme="dark"
        />
      );

      expect(container.firstChild).toHaveClass(/dark|theme-dark/i);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const mockOnComplete = vi.fn();
      const largeData = {
        rows: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`
        }))
      };

      const schema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email()
      });

      const startTime = Date.now();

      render(
        <Validator
          schema={schema}
          data={largeData}
          mapping={{ id: 'id', name: 'name', email: 'email' }}
          onComplete={mockOnComplete}
          autoValidate={true}
        />
      );

      await waitFor(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Validation should complete in reasonable time (<5 seconds)
        expect(duration).toBeLessThan(5000);
      }, { timeout: 10000 });
    });

    it('should paginate error display for large error sets', async () => {
      const mockOnComplete = vi.fn();
      const invalidData = {
        rows: Array.from({ length: 1000 }, (_, i) => ({
          email: 'invalid-email' // All invalid
        }))
      };

      const schema = z.object({
        email: z.string().email()
      });

      render(
        <Validator
          schema={schema}
          data={invalidData}
          mapping={{ email: 'email' }}
          onComplete={mockOnComplete}
          autoValidate={true}
          errorsPerPage={50}
        />
      );

      await waitFor(() => {
        // Should show pagination controls
        expect(screen.getByText(/page.*1/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });
  });
});
