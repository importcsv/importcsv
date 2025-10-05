// frontend/src/components/ColumnMapper.tsx
import { h } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { z } from 'zod';
import type { Column } from '../headless/types';
import { Root } from '../headless/root';
import { cn } from '../utils/cn';

interface ColumnMapperProps {
  schema?: z.ZodSchema<any>;
  columns?: Column[];
  data: { rows: any[] };
  onComplete: (mapping: Record<string, string>) => void;
  onError?: (error: { code: string; message: string }) => void;
  autoSuggest?: boolean;
  showPreview?: boolean;
  previewRows?: number;
  autoSkipIfPerfectMatch?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  appearance?: {
    variables?: {
      colorPrimary?: string;
    };
  };
}

// Calculate string similarity (for auto-suggestion)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export const ColumnMapper = ({
  schema,
  columns: propColumns,
  data,
  onComplete,
  onError,
  autoSuggest = true,
  showPreview = false,
  previewRows = 5,
  autoSkipIfPerfectMatch = false,
  className,
  theme = 'light',
  appearance
}: ColumnMapperProps) => {
  // Derive columns from schema or use provided columns
  const columns = useMemo<Column[]>(() => {
    if (schema && schema instanceof z.ZodObject) {
      const shape = (schema as any).shape;
      return Object.entries(shape).map(([key, zodType]: [string, any]) => ({
        id: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        required: !zodType.isOptional?.()
      }));
    }
    return propColumns || [];
  }, [schema, propColumns]);

  // Get available CSV columns from data
  const csvColumns = useMemo(() => {
    if (!data.rows || data.rows.length === 0) return [];
    return Object.keys(data.rows[0]);
  }, [data]);

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Auto-suggest mappings
  useEffect(() => {
    if (!autoSuggest || csvColumns.length === 0) return;

    const suggestedMapping: Record<string, string> = {};

    columns.forEach(col => {
      // Find best match
      let bestMatch = '';
      let bestScore = 0;

      csvColumns.forEach(csvCol => {
        const score = similarity(col.id, csvCol);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = csvCol;
        }
      });

      // Use suggestion if similarity is high enough (> 0.5)
      if (bestScore > 0.5) {
        suggestedMapping[col.id] = bestMatch;
      }
    });

    setMapping(suggestedMapping);
  }, [columns, csvColumns, autoSuggest]);

  // Check for perfect match and auto-skip
  useEffect(() => {
    if (!autoSkipIfPerfectMatch) return;

    const isPerfectMatch = columns.every((col: Column) =>
      csvColumns.includes(col.id)
    );

    if (isPerfectMatch) {
      const identityMapping: Record<string, string> = {};
      columns.forEach(col => {
        identityMapping[col.id] = col.id;
      });
      onComplete(identityMapping);
    }
  }, [columns, csvColumns, autoSkipIfPerfectMatch, onComplete]);

  // Handle errors
  useEffect(() => {
    if (csvColumns.length === 0) {
      onError?.({
        code: 'NO_COLUMNS',
        message: 'No columns found in CSV data'
      });
    }
  }, [csvColumns, onError]);

  const handleMappingChange = (columnId: string, csvColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [columnId]: csvColumn
    }));
    setErrors([]);
    setDuplicateWarning(null);
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];

    // Check required columns are mapped
    columns.forEach(col => {
      if (col.required && !mapping[col.id]) {
        newErrors.push(`${col.label || col.id} is required and must be mapped`);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check for duplicates
    const mappedValues = Object.values(mapping).filter(Boolean);
    const hasDuplicates = mappedValues.length !== new Set(mappedValues).size;

    if (hasDuplicates) {
      setDuplicateWarning('Warning: Same column mapped multiple times');
    }

    onComplete(mapping);
  };

  // Preview data
  const previewData = useMemo(() => {
    if (!showPreview || !data.rows) return [];

    return data.rows.slice(0, previewRows).map(row => {
      const mapped: any = {};
      Object.entries(mapping).forEach(([colId, csvCol]) => {
        if (csvCol) {
          mapped[colId] = row[csvCol];
        }
      });
      return mapped;
    });
  }, [data, mapping, showPreview, previewRows]);

  if (data.rows.length === 0) {
    return (
      <div className={cn('p-8 text-center', theme === 'dark' && 'bg-gray-800 text-white')}>
        <p className="text-gray-500">No data available to map</p>
      </div>
    );
  }

  const containerClass = cn(
    'p-6 rounded-lg',
    theme === 'dark' ? 'bg-gray-800 text-white theme-dark' : 'bg-white',
    className
  );

  const buttonStyle = appearance?.variables?.colorPrimary
    ? { backgroundColor: appearance.variables.colorPrimary }
    : undefined;

  return (
    <div className={containerClass}>
      <h2 className="text-2xl font-semibold mb-6">Map Your Columns</h2>

      {/* Mapping Interface */}
      <div className="space-y-4 mb-6">
        {columns.map(col => (
          <div key={col.id} className="flex items-center gap-4">
            <label
              htmlFor={`mapping-${col.id}`}
              className="w-1/3 font-medium"
            >
              {col.label || col.id}
              {col.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <select
              id={`mapping-${col.id}`}
              aria-label={col.label || col.id}
              value={mapping[col.id] || ''}
              onChange={(e) => handleMappingChange(col.id, (e.target as HTMLSelectElement).value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Column --</option>
              {csvColumns.map(csvCol => (
                <option key={csvCol} value={csvCol}>
                  {csvCol}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-medium mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-red-700">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateWarning && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">{duplicateWarning}</p>
        </div>
      )}

      {/* Preview */}
      {showPreview && previewData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map(col => (
                    <th key={col.id} className="px-4 py-2 border-b text-left">
                      {col.label || col.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className="border-b">
                    {columns.map(col => (
                      <td key={col.id} className="px-4 py-2">
                        {row[col.id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        style={buttonStyle}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Continue
      </button>
    </div>
  );
};

export default ColumnMapper;
