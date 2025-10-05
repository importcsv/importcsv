// frontend/src/components/Validator.tsx
import { h } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { z } from 'zod';
import type { Column, ValidationError } from '../headless/types';
import { cn } from '../utils/cn';

interface ValidatorProps {
  schema?: z.ZodSchema<any>;
  columns?: Column[];
  data: { rows: any[] };
  mapping?: Record<string, string>;
  onComplete: (validData: any[]) => void;
  autoValidate?: boolean;
  allowInlineEdit?: boolean;
  allowRemoveRows?: boolean;
  allowSubmitWithErrors?: boolean;
  allowExportErrors?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  appearance?: {
    variables?: {
      colorError?: string;
      colorSuccess?: string;
    };
  };
  errorsPerPage?: number;
}

export const Validator = ({
  schema,
  columns,
  data,
  mapping,
  onComplete,
  autoValidate = false,
  allowInlineEdit = false,
  allowRemoveRows = false,
  allowSubmitWithErrors = false,
  allowExportErrors = false,
  className,
  theme = 'light',
  appearance,
  errorsPerPage = 50
}: ValidatorProps) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [editedData, setEditedData] = useState(data.rows);
  const [removedRows, setRemovedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilter, setColumnFilter] = useState<string | null>(null);

  // Apply mapping to data
  const mappedData = useMemo(() => {
    if (!mapping) return editedData;

    return editedData.map(row => {
      const mapped: any = {};
      Object.entries(mapping).forEach(([targetCol, sourceCol]) => {
        mapped[targetCol] = row[sourceCol];
      });
      return mapped;
    });
  }, [editedData, mapping]);

  // Validate data
  const validate = async () => {
    setIsValidating(true);
    const errors: ValidationError[] = [];

    try {
      for (let i = 0; i < mappedData.length; i++) {
        if (removedRows.has(i)) continue;

        const row = mappedData[i];

        if (schema) {
          // Validate with Zod
          const result = schema.safeParse(row);
          if (!result.success) {
            result.error.issues.forEach(issue => {
              errors.push({
                row: i + 1, // 1-indexed for display
                column: issue.path.join('.'),
                message: issue.message
              });
            });
          }
        } else if (columns) {
          // Validate with columns (legacy)
          columns.forEach(col => {
            if (col.required && !row[col.id]) {
              errors.push({
                row: i + 1,
                column: col.id,
                message: `${col.label || col.id} is required`
              });
            }
          });
        }
      }

      setValidationErrors(errors);
    } finally {
      setIsValidating(false);
    }

    return errors;
  };

  // Auto-validate on mount
  useEffect(() => {
    if (autoValidate) {
      validate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle inline edit
  const handleEdit = (rowIndex: number, column: string, value: string) => {
    const newData = [...editedData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [column]: value
    };
    setEditedData(newData);
  };

  // Handle remove row
  const handleRemoveRow = (rowIndex: number) => {
    setRemovedRows(prev => {
      const newSet = new Set(prev);
      newSet.add(rowIndex);
      return newSet;
    });
    // Re-validate after removing row
    setTimeout(validate, 100);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (validationErrors.length > 0 && !allowSubmitWithErrors) {
      alert('Please fix all errors before submitting');
      return;
    }

    let finalData = mappedData;

    // Filter out removed rows
    if (removedRows.size > 0) {
      finalData = finalData.filter((_, i) => !removedRows.has(i));
    }

    // Filter out invalid rows if allowSubmitWithErrors
    if (allowSubmitWithErrors && validationErrors.length > 0) {
      const invalidRows = new Set(validationErrors.map(e => e.row - 1));
      finalData = finalData.filter((_, i) => !invalidRows.has(i));
    }

    onComplete(finalData);
  };

  // Export errors as CSV
  const handleExportErrors = () => {
    const headers = ['Row', 'Column', 'Error'];
    const rows = validationErrors.map(e => [e.row, e.column, e.message]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'validation-errors.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter errors by column
  const filteredErrors = useMemo(() => {
    let errors = validationErrors;
    if (columnFilter) {
      errors = errors.filter(e => e.column === columnFilter);
    }
    return errors;
  }, [validationErrors, columnFilter]);

  // Paginate errors
  const paginatedErrors = useMemo(() => {
    const start = (currentPage - 1) * errorsPerPage;
    const end = start + errorsPerPage;
    return filteredErrors.slice(start, end);
  }, [filteredErrors, currentPage, errorsPerPage]);

  const totalPages = Math.ceil(filteredErrors.length / errorsPerPage);

  // Get unique columns with errors
  const errorColumns = useMemo(() => {
    return Array.from(new Set(validationErrors.map(e => e.column)));
  }, [validationErrors]);

  const containerClass = cn(
    'p-6 rounded-lg',
    theme === 'dark' ? 'bg-gray-800 text-white theme-dark' : 'bg-white',
    className
  );

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Validation</h2>

        <button
          onClick={validate}
          disabled={isValidating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isValidating ? 'Validating data' : 'Validate data'}
        >
          {isValidating ? 'Validating...' : 'Validate'}
        </button>
      </div>

      {/* Loading State */}
      {isValidating && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">Validating data...</p>
        </div>
      )}

      {/* Error Count */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-medium">
            {validationErrors.length} {validationErrors.length === 1 ? 'error' : 'errors'}
          </p>
        </div>
      )}

      {/* Column Filters */}
      {errorColumns.length > 1 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setColumnFilter(null)}
            className={cn(
              'px-3 py-1 rounded-md text-sm',
              !columnFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            )}
          >
            All
          </button>
          {errorColumns.map(col => (
            <button
              key={col}
              onClick={() => setColumnFilter(col)}
              className={cn(
                'px-3 py-1 rounded-md text-sm',
                columnFilter === col ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              )}
            >
              {col}
            </button>
          ))}
        </div>
      )}

      {/* Error Table */}
      {paginatedErrors.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b text-left">Row</th>
                <th className="px-4 py-2 border-b text-left">Column</th>
                <th className="px-4 py-2 border-b text-left">Error</th>
                {allowInlineEdit && <th className="px-4 py-2 border-b text-left">Value</th>}
                {allowRemoveRows && <th className="px-4 py-2 border-b text-left">Action</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedErrors.map((error, i) => (
                <tr key={i} className="border-b">
                  <td className="px-4 py-2">Row {error.row}</td>
                  <td className="px-4 py-2">{error.column}</td>
                  <td className="px-4 py-2 text-red-700">{error.message}</td>
                  {allowInlineEdit && (
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={mappedData[error.row - 1]?.[error.column] || ''}
                        onChange={(e) => handleEdit(error.row - 1, error.column, (e.target as HTMLInputElement).value)}
                        className="px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                  )}
                  {allowRemoveRows && (
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveRow(error.row - 1)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mb-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={isValidating}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {allowSubmitWithErrors && validationErrors.length > 0
            ? 'Import Valid Rows'
            : 'Submit'}
        </button>

        {allowExportErrors && validationErrors.length > 0 && (
          <button
            onClick={handleExportErrors}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Export Errors
          </button>
        )}
      </div>

      {/* Cannot submit message */}
      {validationErrors.length > 0 && !allowSubmitWithErrors && (
        <p className="mt-4 text-red-600">
          Please fix all errors before submitting
        </p>
      )}
    </div>
  );
};

export default Validator;
