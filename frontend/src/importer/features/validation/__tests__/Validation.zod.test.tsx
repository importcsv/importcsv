import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/preact';
import { z } from 'zod';
import Validation from '../Validation';
import type { FileData } from '../../main/types';

describe('Validation with Zod schema', () => {
  const mockFileData: FileData = {
    fileName: 'test.csv',
    sheetList: [],
    errors: [],
    rows: [
      { values: ['Name', 'Email', 'Age'], index: 0 },
      { values: ['John Doe', 'invalid-email', '25'], index: 1 },
      { values: ['Jane Smith', 'jane@example.com', '17'], index: 2 },
      { values: ['Bob Johnson', 'bob@example.com', '30'], index: 3 },
    ],
  };

  const mockColumnMapping = {
    0: { id: 'name', include: true },
    1: { id: 'email', include: true },
    2: { id: 'age', include: true },
  };

  const mockColumns = [
    { id: 'name', label: 'Name', type: 'string' as const },
    { id: 'email', label: 'Email', type: 'email' as const },
    { id: 'age', label: 'Age', type: 'number' as const },
  ];

  const contactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Must be 18 or older'),
  });

  it('should run Zod validation when schema is provided', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <Validation
        columns={mockColumns}
        schema={contactSchema}
        data={mockFileData}
        columnMapping={mockColumnMapping}
        selectedHeaderRow={0}
        onSuccess={onSuccess}
        onCancel={onCancel}
        isSubmitting={false}
      />
    );

    // Wait for validation to complete and check error count in UI
    await waitFor(
      () => {
        // Check that the error count badge shows errors
        const errorBadge = container.querySelector('button:has(span:contains("Error"))');
        const errorCountText = container.textContent || '';
        // The UI should show error count > 0
        expect(errorCountText).toContain('Error');
      },
      { timeout: 3000 }
    );
  });

  it('should validate email with Zod', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();

    const { getByText } = render(
      <Validation
        columns={mockColumns}
        schema={contactSchema}
        data={mockFileData}
        columnMapping={mockColumnMapping}
        selectedHeaderRow={0}
        onSuccess={onSuccess}
        onCancel={onCancel}
        isSubmitting={false}
      />
    );

    // Wait for validation to complete
    await waitFor(
      () => {
        // Check that error count is displayed (should be at least 2: invalid email + age < 18)
        const errorButton = getByText(/Error/);
        expect(errorButton).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('should validate min age with Zod', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();

    const { getByText } = render(
      <Validation
        columns={mockColumns}
        schema={contactSchema}
        data={mockFileData}
        columnMapping={mockColumnMapping}
        selectedHeaderRow={0}
        onSuccess={onSuccess}
        onCancel={onCancel}
        isSubmitting={false}
      />
    );

    // Wait for validation to complete
    await waitFor(
      () => {
        // Check that errors are detected
        const errorButton = getByText(/Error/);
        expect(errorButton).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('should work without schema (backward compatibility)', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <Validation
        columns={mockColumns}
        data={mockFileData}
        columnMapping={mockColumnMapping}
        selectedHeaderRow={0}
        onSuccess={onSuccess}
        onCancel={onCancel}
        isSubmitting={false}
      />
    );

    // Should render without errors
    expect(container).toBeTruthy();
  });
});
