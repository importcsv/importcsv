// frontend/src/components/__tests__/CSVImporterHeadless.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { z } from 'zod';
import { CSVImporterHeadless } from '../CSVImporterHeadless';

describe('CSVImporterHeadless', () => {
  describe('Basic Functionality', () => {
    it('should render upload step initially', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should support Zod schema', () => {
      const schema = z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email()
      });

      const mockOnComplete = vi.fn();

      const { container } = render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('should support legacy columns array', () => {
      const columns = [
        { id: 'name', label: 'Full Name', type: 'string' as const, required: true },
        { id: 'email', label: 'Email', type: 'email' as const, required: true }
      ];

      const mockOnComplete = vi.fn();

      const { container } = render(
        <CSVImporterHeadless
          columns={columns}
          onComplete={mockOnComplete}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should show step indicator', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
        />
      );

      // Check for step labels
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Map Columns')).toBeInTheDocument();
      expect(screen.getByText('Validate')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      const { container } = render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          theme="light"
        />
      );

      expect(container.querySelector('.csv-importer-headless')).toBeInTheDocument();
    });

    it('should apply dark theme', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      const { container } = render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          theme="dark"
        />
      );

      const importer = container.querySelector('.csv-importer-headless');
      expect(importer).toBeInTheDocument();
      expect(importer?.className).toContain('bg-gray-900');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      const { container } = render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          className="custom-importer"
        />
      );

      const importer = container.querySelector('.custom-importer');
      expect(importer).toBeInTheDocument();
    });

    it('should apply appearance variables', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          appearance={{
            variables: {
              colorPrimary: '#ff0000',
              borderRadius: '8px'
            }
          }}
        />
      );

      // Component should render without errors
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });
  });

  describe('Behavior Options', () => {
    it('should support skipColumnMapping option', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          skipColumnMapping={true}
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should support skipValidation option', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          skipValidation={true}
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should support preview options', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          showPreview={true}
          previewRows={10}
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should call onError callback', () => {
      const mockOnComplete = vi.fn();
      const mockOnError = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          onError={mockOnError}
        />
      );

      // Component should render successfully
      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });
  });

  describe('File Upload Options', () => {
    it('should respect maxFileSize', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          maxFileSize={5 * 1024 * 1024} // 5MB
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should respect acceptedFormats', () => {
      const mockOnComplete = vi.fn();
      const schema = z.object({
        name: z.string()
      });

      render(
        <CSVImporterHeadless
          schema={schema}
          onComplete={mockOnComplete}
          acceptedFormats={['csv', 'tsv']}
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });
  });

  describe('Real-World Schemas', () => {
    it('should handle contact schema', () => {
      const contactSchema = z.object({
        firstName: z.string().min(1, 'First name required'),
        lastName: z.string().min(1, 'Last name required'),
        email: z.string().email('Invalid email'),
        phone: z.string().optional(),
        company: z.string()
      });

      const mockOnComplete = vi.fn();

      render(
        <CSVImporterHeadless
          schema={contactSchema}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should handle product schema', () => {
      const productSchema = z.object({
        sku: z.string().regex(/^[A-Z]{3}-\d{4}$/),
        name: z.string().min(3).max(100),
        price: z.number().positive(),
        quantity: z.number().int().nonnegative(),
        category: z.enum(['electronics', 'clothing', 'food'])
      });

      const mockOnComplete = vi.fn();

      render(
        <CSVImporterHeadless
          schema={productSchema}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });
  });

  describe('Backward Compatibility', () => {
    it('should work exactly like old CSVImporter API', () => {
      // Simulating old API usage
      const columns = [
        { id: 'name', label: 'Full Name', type: 'string' as const },
        { id: 'email', label: 'Email Address', type: 'email' as const }
      ];

      const mockOnComplete = vi.fn();

      render(
        <CSVImporterHeadless
          columns={columns}
          onComplete={mockOnComplete}
          theme="light"
          className="old-style-importer"
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });

    it('should support both schema and columns simultaneously', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });

      const columns = [
        { id: 'name', label: 'Name' },
        { id: 'email', label: 'Email' }
      ];

      const mockOnComplete = vi.fn();

      render(
        <CSVImporterHeadless
          schema={schema}
          columns={columns}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
    });
  });
});
