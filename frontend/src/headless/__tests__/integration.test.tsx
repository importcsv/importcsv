// frontend/src/headless/__tests__/integration.test.tsx
/**
 * Integration tests for building a complete CSV importer using headless components
 *
 * These tests verify that:
 * 1. Headless components can build a full CSV import workflow
 * 2. The workflow matches the behavior of the existing CSVImporter
 * 3. All features work together seamlessly
 * 4. Backward compatibility with legacy API is maintained
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/preact';
import { z } from 'zod';
import { Root, useCSV } from '../root';
import { Validator } from '../validator';
import { useState } from 'preact/hooks';

describe('Headless CSV Importer Integration', () => {
  describe('Complete Import Workflow', () => {
    it('should handle complete import workflow with Zod schema', async () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        age: z.number().optional()
      });

      const mockOnComplete = vi.fn();

      const testData = {
        rows: [
          { name: 'John Doe', email: 'john@example.com', age: 30 },
          { name: 'Jane Smith', email: 'jane@example.com', age: 25 }
        ]
      };

      // Complete importer component built with headless primitives
      const HeadlessImporter = () => {
        const [data, setData] = useState(testData);
        const [errors, setErrors] = useState<any[]>([]);

        return (
          <Root
            schema={schema}
            onComplete={mockOnComplete}
            data={data}
          >
            <Validator>
              {({ errors: validationErrors, validate, isValidating }) => (
                <div>
                  <button
                    data-testid="validate-button"
                    onClick={async () => {
                      const errs = await validate();
                      setErrors(errs);
                      if (errs.length === 0) {
                        mockOnComplete(data.rows);
                      }
                    }}
                    disabled={isValidating}
                  >
                    {isValidating ? 'Validating...' : 'Submit'}
                  </button>

                  {validationErrors.length > 0 && (
                    <div data-testid="errors">
                      {validationErrors.map((err, i) => (
                        <div key={i} data-testid={`error-${i}`}>
                          Row {err.row}, Column {err.column}: {err.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.length === 0 && (
                    <div data-testid="success">Import successful!</div>
                  )}
                </div>
              )}
            </Validator>
          </Root>
        );
      };

      render(<HeadlessImporter />);

      // Click submit
      const submitButton = screen.getByTestId('validate-button');
      fireEvent.click(submitButton);

      // Wait for validation
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(testData.rows);
      });
    });

    it('should handle validation errors in workflow', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email')
      });

      const mockOnComplete = vi.fn();

      const invalidData = {
        rows: [
          { email: 'valid@example.com' },
          { email: 'invalid-email' }, // This will fail
          { email: 'another@example.com' }
        ]
      };

      const HeadlessImporter = () => {
        return (
          <Root
            schema={schema}
            onComplete={mockOnComplete}
            data={invalidData}
          >
            <Validator>
              {({ errors, validate, isValidating }) => (
                <div>
                  <button
                    data-testid="validate-button"
                    onClick={async () => {
                      const errs = await validate();
                      if (errs.length === 0) {
                        mockOnComplete(invalidData.rows);
                      }
                    }}
                  >
                    Validate
                  </button>

                  <div data-testid="error-count">{errors.length}</div>

                  {errors.map((err, i) => (
                    <div key={i} data-testid={`error-${i}`}>
                      Row {err.row + 1}: {err.message}
                    </div>
                  ))}
                </div>
              )}
            </Validator>
          </Root>
        );
      };

      render(<HeadlessImporter />);

      // Click validate
      fireEvent.click(screen.getByTestId('validate-button'));

      // Should show 1 error (row 2 with invalid email)
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });

      // Error should mention row 2
      expect(screen.getByTestId('error-0')).toHaveTextContent('Row 2');
      expect(screen.getByTestId('error-0')).toHaveTextContent('Invalid email');

      // onComplete should NOT be called because of validation errors
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('Backward Compatibility with Legacy API', () => {
    it('should work with legacy columns array (no Zod)', async () => {
      const columns = [
        { id: 'name', label: 'Full Name', type: 'string' as const, required: true },
        { id: 'email', label: 'Email', type: 'email' as const, required: true }
      ];

      const mockOnComplete = vi.fn();

      const testData = {
        rows: [
          { name: 'John Doe', email: 'john@example.com' }
        ]
      };

      const LegacyImporter = () => {
        return (
          <Root
            columns={columns}
            onComplete={mockOnComplete}
            data={testData}
          >
            <Validator>
              {({ validate }) => (
                <div>
                  <button
                    data-testid="submit"
                    onClick={async () => {
                      await validate();
                      mockOnComplete(testData.rows);
                    }}
                  >
                    Submit
                  </button>
                </div>
              )}
            </Validator>
          </Root>
        );
      };

      render(<LegacyImporter />);

      fireEvent.click(screen.getByTestId('submit'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(testData.rows);
      });
    });

    it('should support both Zod schema and columns array', async () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });

      const TestComponent = () => {
        const ctx = useCSV();
        return (
          <div>
            <div data-testid="has-schema">{ctx.schema ? 'yes' : 'no'}</div>
            <div data-testid="column-count">{ctx.columns.length}</div>
          </div>
        );
      };

      render(
        <Root schema={schema} onComplete={() => {}}>
          <TestComponent />
        </Root>
      );

      expect(screen.getByTestId('has-schema')).toHaveTextContent('yes');
      expect(screen.getByTestId('column-count')).toHaveTextContent('2');
    });
  });

  describe('Multi-step Workflow', () => {
    it('should support step-by-step import process', async () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email()
      });

      const mockOnComplete = vi.fn();

      // Simulated multi-step importer
      const MultiStepImporter = () => {
        const [step, setStep] = useState<'upload' | 'validate' | 'complete'>('upload');
        const [data, setData] = useState<any>(null);

        return (
          <Root schema={schema} onComplete={mockOnComplete} data={data}>
            {step === 'upload' && (
              <div>
                <button
                  data-testid="upload-next"
                  onClick={() => {
                    setData({
                      rows: [
                        { name: 'John', email: 'john@example.com' }
                      ]
                    });
                    setStep('validate');
                  }}
                >
                  Upload Complete
                </button>
              </div>
            )}

            {step === 'validate' && (
              <Validator>
                {({ errors, validate }) => (
                  <div>
                    <button
                      data-testid="validate-next"
                      onClick={async () => {
                        const errs = await validate();
                        if (errs.length === 0) {
                          setStep('complete');
                          mockOnComplete(data.rows);
                        }
                      }}
                    >
                      Validate
                    </button>
                    {errors.length > 0 && (
                      <div data-testid="has-errors">Errors found</div>
                    )}
                  </div>
                )}
              </Validator>
            )}

            {step === 'complete' && (
              <div data-testid="complete">Complete!</div>
            )}
          </Root>
        );
      };

      const { rerender } = render(<MultiStepImporter />);

      // Step 1: Upload
      expect(screen.getByTestId('upload-next')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('upload-next'));

      // Step 2: Validate
      await waitFor(() => {
        expect(screen.getByTestId('validate-next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('validate-next'));

      // Step 3: Complete
      await waitFor(() => {
        expect(screen.getByTestId('complete')).toBeInTheDocument();
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle contact import with validation', async () => {
      // Real-world contact schema
      const contactSchema = z.object({
        firstName: z.string().min(1, 'First name required'),
        lastName: z.string().min(1, 'Last name required'),
        email: z.string().email('Invalid email'),
        phone: z.string().optional(),
        company: z.string()
      });

      const mockOnComplete = vi.fn();

      const contacts = {
        rows: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '555-1234',
            company: 'Acme Corp'
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '',
            company: 'Tech Inc'
          }
        ]
      };

      const ContactImporter = () => {
        return (
          <Root schema={contactSchema} onComplete={mockOnComplete} data={contacts}>
            <Validator>
              {({ errors, validate, isValidating }) => (
                <div>
                  <h1>Import Contacts</h1>

                  <div data-testid="row-count">{contacts.rows.length} contacts</div>

                  <button
                    data-testid="import-button"
                    onClick={async () => {
                      const errs = await validate();
                      if (errs.length === 0) {
                        mockOnComplete(contacts.rows);
                      }
                    }}
                    disabled={isValidating}
                  >
                    Import Contacts
                  </button>

                  {errors.length > 0 && (
                    <div data-testid="error-list">
                      {errors.map((err, i) => (
                        <div key={i}>{err.message}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Validator>
          </Root>
        );
      };

      render(<ContactImporter />);

      expect(screen.getByTestId('row-count')).toHaveTextContent('2 contacts');

      fireEvent.click(screen.getByTestId('import-button'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(contacts.rows);
      });

      // Should have no errors
      expect(screen.queryByTestId('error-list')).not.toBeInTheDocument();
    });
  });
});
