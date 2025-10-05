// frontend/src/components/__tests__/ColumnMapper.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { z } from 'zod';
import { ColumnMapper } from '../ColumnMapper';

describe('Standalone ColumnMapper Component', () => {
  const sampleData = {
    rows: [
      { first_name: 'John', email_address: 'john@example.com', phone_number: '555-1234' },
      { first_name: 'Jane', email_address: 'jane@example.com', phone_number: '555-5678' }
    ]
  };

  describe('Basic Rendering', () => {
    it('should render mapper with columns from schema', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional()
      });

      render(
        <ColumnMapper
          schema={schema}
          data={sampleData}
          onComplete={mockOnComplete}
        />
      );

      // Should show expected columns as labels
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    it('should render mapper with legacy columns array', () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Full Name', required: true },
        { id: 'email', label: 'Email Address', required: true },
        { id: 'phone', label: 'Phone Number' }
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/full name/i)).toBeInTheDocument();
      expect(screen.getByText(/email address/i)).toBeInTheDocument();
    });

    it('should show available CSV columns from data', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
        />
      );

      // Should show CSV columns as options
      expect(screen.getByText(/first_name/i)).toBeInTheDocument();
      expect(screen.getByText(/email_address/i)).toBeInTheDocument();
      expect(screen.getByText(/phone_number/i)).toBeInTheDocument();
    });
  });

  describe('Column Mapping Functionality', () => {
    it('should allow mapping CSV columns to expected columns', async () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name', required: true },
        { id: 'email', label: 'Email', required: true }
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
        />
      );

      // Map first_name -> name
      const nameSelect = screen.getByLabelText(/name/i) as HTMLSelectElement;
      fireEvent.change(nameSelect, { target: { value: 'first_name' } });

      // Map email_address -> email
      const emailSelect = screen.getByLabelText(/email/i) as HTMLSelectElement;
      fireEvent.change(emailSelect, { target: { value: 'email_address' } });

      expect(nameSelect.value).toBe('first_name');
      expect(emailSelect.value).toBe('email_address');
    });

    it('should call onComplete with mapping when submitted', async () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name' },
        { id: 'email', label: 'Email' }
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
        />
      );

      // Map columns
      const nameSelect = screen.getByLabelText(/name/i);
      fireEvent.change(nameSelect, { target: { value: 'first_name' } });

      const emailSelect = screen.getByLabelText(/email/i);
      fireEvent.change(emailSelect, { target: { value: 'email_address' } });

      // Submit mapping
      const submitButton = screen.getByRole('button', { name: /continue|next|submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'first_name',
            email: 'email_address'
          })
        );
      });
    });

    it('should validate required columns are mapped', async () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name', required: true },
        { id: 'email', label: 'Email', required: true }
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
        />
      );

      // Only map one required field
      const nameSelect = screen.getByLabelText(/name/i);
      fireEvent.change(nameSelect, { target: { value: 'first_name' } });

      // Try to submit without mapping email
      const submitButton = screen.getByRole('button', { name: /continue|next|submit/i });
      fireEvent.click(submitButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/required|must be mapped/i)).toBeInTheDocument();
      });

      // Should not call onComplete
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('Data Preview', () => {
    it('should show preview of mapped data', () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name' },
        { id: 'email', label: 'Email' }
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
          showPreview={true}
        />
      );

      // Map columns
      const nameSelect = screen.getByLabelText(/name/i);
      fireEvent.change(nameSelect, { target: { value: 'first_name' } });

      // Should show preview
      expect(screen.getByText(/preview/i)).toBeInTheDocument();
      expect(screen.getByText(/john/i)).toBeInTheDocument();
    });

    it('should update preview when mapping changes', async () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name' },
        { id: 'email', label: 'Email' }
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
          showPreview={true}
        />
      );

      const nameSelect = screen.getByLabelText(/name/i);

      // Map to first_name
      fireEvent.change(nameSelect, { target: { value: 'first_name' } });
      expect(screen.getByText(/john/i)).toBeInTheDocument();

      // Change mapping to email_address
      fireEvent.change(nameSelect, { target: { value: 'email_address' } });

      await waitFor(() => {
        expect(screen.getByText(/john@example\.com/i)).toBeInTheDocument();
      });
    });

    it('should limit preview rows', () => {
      const largeData = {
        rows: Array.from({ length: 100 }, (_, i) => ({
          name: `User ${i}`,
          email: `user${i}@example.com`
        }))
      };

      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      render(
        <ColumnMapper
          columns={columns}
          data={largeData}
          onComplete={mockOnComplete}
          showPreview={true}
          previewRows={5}
        />
      );

      // Should only show 5 rows in preview
      const previewRows = screen.getAllByText(/user \d+/i);
      expect(previewRows.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Independent Usage', () => {
    it('should work without wrapping in CSV.Root', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      expect(() => {
        render(
          <ColumnMapper
            columns={columns}
            data={sampleData}
            onComplete={mockOnComplete}
          />
        );
      }).not.toThrow();
    });

    it('should handle unmapped optional columns', async () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name', required: true },
        { id: 'email', label: 'Email', required: true },
        { id: 'phone', label: 'Phone' } // optional
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
        />
      );

      // Map only required fields
      const nameSelect = screen.getByLabelText(/name/i);
      fireEvent.change(nameSelect, { target: { value: 'first_name' } });

      const emailSelect = screen.getByLabelText(/email/i);
      fireEvent.change(emailSelect, { target: { value: 'email_address' } });

      // Submit without mapping optional phone
      const submitButton = screen.getByRole('button', { name: /continue|next|submit/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'first_name',
            email: 'email_address'
            // phone is undefined - that's ok
          })
        );
      });
    });

    it('should allow skipping mapper if columns already match', async () => {
      const perfectData = {
        rows: [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'jane@example.com' }
        ]
      };

      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name' },
        { id: 'email', label: 'Email' }
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={perfectData}
          onComplete={mockOnComplete}
          autoSkipIfPerfectMatch={true}
        />
      );

      // Should auto-skip and call onComplete with identity mapping
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'name',
            email: 'email'
          })
        );
      });
    });
  });

  describe('Styling and Customization', () => {
    it('should accept custom className', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      const { container } = render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
          className="custom-mapper"
        />
      );

      expect(container.querySelector('.custom-mapper')).toBeInTheDocument();
    });

    it('should support custom styling via appearance prop', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
          appearance={{
            variables: {
              colorPrimary: '#2563eb'
            }
          }}
        />
      );

      const submitButton = screen.getByRole('button', { name: /continue|next|submit/i });
      expect(submitButton).toHaveStyle({ backgroundColor: '#2563eb' });
    });

    it('should support different themes', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      const { container } = render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
          theme="dark"
        />
      );

      expect(container.firstChild).toHaveClass(/dark|theme-dark/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      const mockOnComplete = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      render(
        <ColumnMapper
          columns={columns}
          data={{ rows: [] }}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/no.*data|empty/i)).toBeInTheDocument();
    });

    it('should show error when no CSV columns available', () => {
      const mockOnComplete = vi.fn();
      const mockOnError = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      render(
        <ColumnMapper
          columns={columns}
          data={{ rows: [{}] }} // empty objects
          onComplete={mockOnComplete}
          onError={mockOnError}
        />
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NO_COLUMNS',
          message: expect.stringMatching(/column/i)
        })
      );
    });

    it('should handle duplicate column mappings', async () => {
      const mockOnComplete = vi.fn();
      const columns = [
        { id: 'name', label: 'Name' },
        { id: 'email', label: 'Email' }
      ];

      render(
        <ColumnMapper
          columns={columns}
          data={sampleData}
          onComplete={mockOnComplete}
        />
      );

      // Map both to same CSV column
      const nameSelect = screen.getByLabelText(/name/i);
      fireEvent.change(nameSelect, { target: { value: 'first_name' } });

      const emailSelect = screen.getByLabelText(/email/i);
      fireEvent.change(emailSelect, { target: { value: 'first_name' } });

      const submitButton = screen.getByRole('button', { name: /continue|next|submit/i });
      fireEvent.click(submitButton);

      // Should show warning
      await waitFor(() => {
        expect(screen.getByText(/duplicate|same column/i)).toBeInTheDocument();
      });
    });
  });
});
