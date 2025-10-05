// frontend/src/components/__tests__/Uploader.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { z } from 'zod';
import { Uploader } from '../Uploader';

describe('Standalone Uploader Component', () => {
  describe('Basic Rendering', () => {
    it('should render uploader with default UI', () => {
      const mockOnUpload = vi.fn();
      const columns = [
        { id: 'name', label: 'Name', type: 'string', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true }
      ];

      render(<Uploader columns={columns} onUpload={mockOnUpload} />);

      // Should show upload area
      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    });

    it('should render with Zod schema', () => {
      const mockOnUpload = vi.fn();
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });

      render(<Uploader schema={schema} onUpload={mockOnUpload} />);

      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    });

    it('should show custom placeholder text', () => {
      const mockOnUpload = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      render(
        <Uploader
          columns={columns}
          onUpload={mockOnUpload}
          placeholder="Upload your contacts CSV"
        />
      );

      expect(screen.getByText(/upload your contacts csv/i)).toBeInTheDocument();
    });
  });

  describe('Independent Usage', () => {
    it('should work without wrapping in CSV.Root', () => {
      const mockOnUpload = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      // Should not throw error when used standalone
      expect(() => {
        render(<Uploader columns={columns} onUpload={mockOnUpload} />);
      }).not.toThrow();
    });
  });

  describe('Styling and Customization', () => {
    it('should accept custom className', () => {
      const mockOnUpload = vi.fn();
      const columns = [{ id: 'name', label: 'Name' }];

      const { container } = render(
        <Uploader
          columns={columns}
          onUpload={mockOnUpload}
          className="custom-uploader"
        />
      );

      expect(container.querySelector('.custom-uploader')).toBeInTheDocument();
    });
  });
});
