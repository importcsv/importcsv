import { useState, useMemo, useRef, useEffect, useCallback } from 'preact/hooks';
import type { ComponentChildren, FunctionComponent, JSX } from 'preact';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Tooltip } from '../../components/ui/tooltip';
import StepLayout from '../../components/StepLayout';
import { Wrench, AlertTriangle } from 'lucide-react';
import { ValidationProps } from './types';
import TransformPanel from './components/TransformPanel';
import { validateColumn, validateUniqueness } from '../../../validation/validator';
import { applyTransformations, categorizeTransformations } from '../../../validation/transformer';
import VirtualTable from '../../components/VirtualTable';
import { designTokens } from '../../theme';
import { cn } from '../../../utils/cn';


// Validation component for checking imported data
export default function Validation<TSchema = unknown>({
  columns,
  schema,
  data: fileData,
  columnMapping,
  selectedHeaderRow,
  onSuccess,
  onCancel,
  isSubmitting,
  backendUrl,
  importerKey,
  filterInvalidRows,
  disableOnInvalidRows,
}: ValidationProps<TSchema>) {
  // State management
  const [errors, setErrors] = useState<Array<{rowIndex: number, columnIndex: number, message: string}>>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'error'>('all');
  const [isTransformPanelOpen, setIsTransformPanelOpen] = useState(false);
  const [validationProgress, setValidationProgress] = useState(100);
  const [isValidating, setIsValidating] = useState(false);

  // Ref for scrollable section to reset scroll position
  const scrollableSectionRef = useRef<HTMLDivElement>(null);

  // Data extraction
  const headerRowIndex = selectedHeaderRow || 0;
  const headerRow = fileData.rows[headerRowIndex];

  // Make dataRows a state variable so changes persist
  const [dataRows, setDataRows] = useState(() => {
    return fileData.rows.slice(headerRowIndex + 1);
  });

  // Column mapping
  const includedColumns = useMemo(() => {
    return Object.entries(columnMapping)
      .filter(([_, mapping]) => mapping.include)
      .map(([index]) => parseInt(index));
  }, [columnMapping]);

  // Headers
  const headers = useMemo(() => {
    return includedColumns.map(colIdx => String(headerRow.values[colIdx]));
  }, [includedColumns, headerRow]);

  // Validation tracking
  const shouldValidateRef = useRef(true);

  // Create reverse mapping for efficient column lookups (optimization for Zod validation)
  const columnIdToIndex = useMemo(() => {
    const map = new Map<string, number>();
    Object.entries(columnMapping).forEach(([idx, mapping]) => {
      if (mapping.include) {
        // Type assertion: ColumnMapping may have additional properties
        const extendedMapping = mapping as typeof mapping & { id?: string; key?: string };
        const id = extendedMapping.id || extendedMapping.key;
        if (id) {
          map.set(id, parseInt(idx));
        }
      }
    });
    return map;
  }, [columnMapping]);

  // Helper function to validate a single row
  const validateSingleRow = useCallback((
    row: typeof dataRows[0],
    rowIdx: number,
    errors: Array<{rowIndex: number, columnIndex: number, message: string}>
  ) => {
    // VALIDATION HIERARCHY: Single source of truth to avoid race conditions
    // - If schema exists: Use ONLY Zod validation
    // - If only columns exist: Use ONLY Column validation
    // This prevents duplicate/conflicting errors from both validators

    if (schema) {
      // === ZOD VALIDATION PATH ===
      const rowObject: Record<string, unknown> = {};

      includedColumns.forEach(colIdx => {
        const value = row.values[colIdx];
        const mapping = columnMapping[colIdx];
        if (!mapping || !mapping.include) return;

        const extendedMapping = mapping as typeof mapping & { id?: string; key?: string };
        const columnId = extendedMapping.id || extendedMapping.key;
        if (!columnId) return;

        const column = columns?.find(c => c.id === columnId);
        if (!column) return;

        // Apply pre-transformations before validation
        const { pre } = categorizeTransformations(column.transformations);
        const preTransformedValue = applyTransformations(value, pre);

        // Convert value to appropriate type for Zod validation
        const isRequired = column.validators?.some(v => v.type === 'required') ?? false;
        let zodValue: unknown = preTransformedValue;

        if (column.type === 'number') {
          const num = Number(preTransformedValue);
          zodValue = preTransformedValue === ''
            ? (isRequired ? '' : undefined)
            : (isNaN(num) ? preTransformedValue : num);
        } else if (column.type === 'date') {
          if (preTransformedValue === '') {
            zodValue = isRequired ? '' : undefined;
          } else {
            const date = new Date(preTransformedValue);
            zodValue = isNaN(date.getTime()) ? preTransformedValue : date;
          }
        } else if (preTransformedValue === '' && !isRequired) {
          zodValue = undefined;
        }

        rowObject[columnId] = zodValue;
      });

      // Run Zod validation
      const result = schema.safeParse(rowObject);

      if (!result.success) {
        // Convert Zod errors to ValidationError format
        result.error.issues.forEach(issue => {
          const fieldName = issue.path[0] as string;
          const column = columns?.find(c => c.id === fieldName);
          if (!column) return;

          const colIdx = columnIdToIndex.get(fieldName);

          if (colIdx !== undefined && colIdx !== null) {
            errors.push({
              rowIndex: rowIdx + headerRowIndex + 1,
              columnIndex: colIdx,
              message: issue.message
            });
          }
        });
      }
    } else {
      // === COLUMN VALIDATION PATH (Legacy) ===
      includedColumns.forEach(colIdx => {
        const value = row.values[colIdx];
        const mapping = columnMapping[colIdx];
        if (!mapping || !mapping.include) return;

        const extendedMapping = mapping as typeof mapping & { id?: string; key?: string };
        const columnId = extendedMapping.id || extendedMapping.key;
        const column = columns?.find(c => c.id === columnId);
        if (!column) return;

        // Apply pre-transformations before validation
        const { pre } = categorizeTransformations(column.transformations);
        const preTransformedValue = applyTransformations(value, pre);

        // Column validation
        const error = validateColumn(preTransformedValue, column);
        if (error) {
          errors.push({
            rowIndex: rowIdx + headerRowIndex + 1,
            columnIndex: colIdx,
            message: error
          });
        }
      });
    }
  }, [includedColumns, columnMapping, columns, schema, headerRowIndex, columnIdToIndex]);

  // Reset scroll position when component mounts
  useEffect(() => {
    if (scrollableSectionRef.current) {
      scrollableSectionRef.current.scrollTop = 0;
    }
  }, []); // Empty dependency array ensures this runs only on mount

  // Validate column mappings
  useEffect(() => {
    if (!columns) return;
    // Check if mappings match column ids
    const columnIds = columns.map(col => col.id);
    const mismatches = Object.entries(columnMapping).filter(([_, mapping]) => {
      if (!mapping.include) return false;
      const extendedMapping = mapping as typeof mapping & { id?: string; key?: string };
      return !columnIds.includes(extendedMapping.id || extendedMapping.key || '');
    });

    if (mismatches.length > 0) {
      // Handle mismatches if needed
    }
  }, [columns, columnMapping]);

  // Progressive validation - validate visible rows first, then background
  const validateData = useCallback(() => {
    if (!shouldValidateRef.current || !columns) return;

    setIsValidating(true);
    setValidationProgress(0);

    const newErrors: Array<{rowIndex: number, columnIndex: number, message: string}> = [];
    const totalRows = dataRows.length;

    // Phase 1: Validate first 50 rows immediately for quick feedback
    const immediateRows = Math.min(50, totalRows);

    for (let rowIdx = 0; rowIdx < immediateRows; rowIdx++) {
      const row = dataRows[rowIdx];
      validateSingleRow(row, rowIdx, newErrors);
    }

    // Update errors for immediate feedback
    setErrors(newErrors);
    setValidationProgress(Math.floor((immediateRows / totalRows) * 100));

    // Phase 2: Validate remaining rows in chunks using setTimeout
    if (totalRows > immediateRows) {
      let currentRow = immediateRows;
      const chunkSize = 100;

      const validateChunk = () => {
        const endRow = Math.min(currentRow + chunkSize, totalRows);

        for (let rowIdx = currentRow; rowIdx < endRow; rowIdx++) {
          const row = dataRows[rowIdx];
          validateSingleRow(row, rowIdx, newErrors);
        }

        currentRow = endRow;
        const progress = Math.floor((currentRow / totalRows) * 100);
        setValidationProgress(progress);
        setErrors([...newErrors]); // Update with accumulated errors

        if (currentRow < totalRows) {
          // Schedule next chunk
          setTimeout(validateChunk, 0);
        } else {
          // Validation complete
          setIsValidating(false);
          shouldValidateRef.current = false;
        }
      };

      // Start background validation
      setTimeout(validateChunk, 0);
    } else {
      // All rows validated immediately
      setIsValidating(false);
      shouldValidateRef.current = false;
    }
  }, [dataRows, validateSingleRow]);

  // Trigger validation when data changes
  useEffect(() => {
    if (dataRows.length > 0 && shouldValidateRef.current) {
      validateData();
    }
  }, [dataRows, validateData]);

  // Cell editing
  const handleCellEdit = useCallback((rowIdx: number, colIdx: number, value: string) => {
    // Only update if value actually changed
    if (dataRows[rowIdx]?.values[colIdx] === value) return;

    // Create a copy of dataRows and update the specific value
    setDataRows(prevRows => {
      const updatedRows = [...prevRows];
      if (updatedRows[rowIdx] && updatedRows[rowIdx].values) {
        // Deep copy the specific row to avoid mutation
        updatedRows[rowIdx] = {
          ...updatedRows[rowIdx],
          values: [...updatedRows[rowIdx].values]
        };
        updatedRows[rowIdx].values[colIdx] = value;
      }
      // Reset validation flag to trigger revalidation
      shouldValidateRef.current = true;
      return updatedRows;
    });

    shouldValidateRef.current = true;
  }, [dataRows]);

  // Pre-transformed data for display (shows what values will be validated)
  const preTransformedRows = useMemo(() => {
    if (!columns) return dataRows;
    
    return dataRows.map(row => {
      const newRow = { ...row };
      const transformedValues = [...row.values];
      
      includedColumns.forEach(colIdx => {
        const mapping = columnMapping[colIdx];
        if (!mapping || !mapping.include) return;

        const extendedMapping = mapping as typeof mapping & { id?: string; key?: string };
        const columnId = extendedMapping.id || extendedMapping.key;
        const column = columns.find(c => c.id === columnId);
        if (!column || !column.transformations) return;
        
        // Apply only pre-transformations for display
        const { pre } = categorizeTransformations(column.transformations);
        if (pre.length > 0) {
          transformedValues[colIdx] = applyTransformations(row.values[colIdx], pre);
        }
      });
      
      newRow.values = transformedValues;
      return newRow;
    });
  }, [dataRows, columns, columnMapping, includedColumns]);

  // Row filtering with counts (using pre-transformed data)
  const { visibleRows, validCount, errorCount } = useMemo(() => {

    const errorRowIndices = new Set(
      errors.map(err => err.rowIndex - headerRowIndex - 1)
    );

    const validRows = preTransformedRows.filter((_, idx) => !errorRowIndices.has(idx));
    const errorRows = preTransformedRows.filter((_, idx) => errorRowIndices.has(idx));

    let filtered: typeof preTransformedRows;
    if (filterMode === 'valid') {
      filtered = validRows;
    } else if (filterMode === 'error') {
      filtered = errorRows;
    } else {
      filtered = preTransformedRows;
    }

    return {
      visibleRows: filtered,
      validCount: validRows.length,
      errorCount: errorRows.length
    };
  }, [preTransformedRows, filterMode, errors, headerRowIndex]);

  // Error tracking
  const errorTracking = useMemo(() => {
    const indices = new Set<number>();
    const rowObjects = new Set<number>();

    errors.forEach(err => {
      // Convert from display row index to actual data row index
      const dataRowIdx = err.rowIndex - headerRowIndex - 1;
      if (dataRowIdx >= 0 && dataRowIdx < preTransformedRows.length) {
        indices.add(dataRowIdx);
        rowObjects.add(preTransformedRows[dataRowIdx]?.index || -1);
      }
    });

    return {
      indices,  // For filtering rows
      objects: Array.from(rowObjects).filter(idx => idx !== -1),  // For UI display
      count: indices.size  // For quick access to error count
    };
  }, [errors, headerRowIndex, preTransformedRows]);

  // Form submission
  const handleSubmit = (e: JSX.TargetedEvent) => {
    e.preventDefault();

    if (disableOnInvalidRows && errors.length > 0) {
      return; // Don't submit if disableOnInvalidRows is true and there are errors
    }

    // Filter out rows with errors if filterInvalidRows is enabled
    const filteredData = filterInvalidRows
      ? dataRows.filter((_, rowIdx) => !errorTracking.indices.has(rowIdx))
      : dataRows;

    // Apply transformations to the filtered data
    const transformedData = filteredData.map(row => {
      const newRow = { ...row };
      const transformedValues = row.values.map((value, colIdx) => {
        // Only transform included columns
        if (!includedColumns.includes(colIdx)) return value;

        // Get the column mapping
        const mapping = columnMapping[colIdx];
        const extendedMapping = mapping as typeof mapping & { id?: string; key?: string };
        if (!mapping || !(extendedMapping.id || extendedMapping.key)) return value;

        // Find the column definition
        const column = columns?.find(c => c.id === (extendedMapping.id || extendedMapping.key));
        if (!column || !column.transformations) return value;

        // Apply both pre and post transformations for final output
        const { pre, post } = categorizeTransformations(column.transformations);
        const preTransformed = applyTransformations(value, pre);
        const finalValue = applyTransformations(preTransformed, post);
        return finalValue;
      });

      newRow.values = transformedValues;
      return newRow;
    });

    // Call onSuccess with the transformed data
    onSuccess({
      ...fileData,
      rows: [headerRow, ...transformedData]
    });
  };

  const footerContent = (
    <>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        size="default"
      >
        Back
      </Button>
      <Button
        isLoading={isSubmitting}
        disabled={isValidating || (disableOnInvalidRows && errors.length > 0)}
        size="default"
        variant="default"
        onClick={handleSubmit}
      >
        {isValidating ? 'Validating...' : 'Submit'}
      </Button>
    </>
  );

  const headerContent = (

    <div className="">
      {/* Validation progress bar */}
      {isValidating && (
        <div className={designTokens.spacing.section}>
          <div className="flex justify-between mb-1">
            <span className={designTokens.typography.body}>Validating data...</span>
            <span className={designTokens.typography.body}>{validationProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${validationProgress}%` }}
            />
          </div>
        </div>
      )}

      {filterInvalidRows && errorTracking.count > 0 && (
        <Alert className={designTokens.spacing.section}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Rows Will Be Filtered</AlertTitle>
          <AlertDescription>
            {`${errorTracking.count} ${errorTracking.count === 1 ? 'row' : 'rows'} with validation errors will be excluded from the import. You can fix the errors to include these rows.`}
          </AlertDescription>
        </Alert>
      )}

      {!isValidating && (
        <div className="py-3">
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <button
                type="button"
                className={cn(
                  "px-4 py-2 rounded-lg transition-all",
                  designTokens.typography.body,
                  filterMode === 'all'
                    ? 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-900 dark:text-white border border-slate-300 dark:border-[#3a3a3a] font-medium shadow-sm dark:shadow-none'
                    : 'text-slate-500 dark:text-[#6b6b6b] hover:text-slate-700 dark:hover:text-[#a1a1a1] hover:bg-slate-50 dark:hover:bg-[#1e1e1e] border border-transparent'
                )}
                onClick={() => setFilterMode('all')}
              >
                All <span className={cn("ml-2 px-2 py-0.5 rounded-full text-xs font-medium", filterMode === 'all' ? 'bg-white dark:bg-[#3a3a3a] text-slate-700 dark:text-[#e5e5e5] shadow-sm dark:shadow-none' : 'bg-slate-200 dark:bg-[#2a2a2a] text-slate-600 dark:text-[#a1a1a1]')}>{dataRows.length}</span>
              </button>
              <button
                type="button"
                className={cn(
                  "px-4 py-2 rounded-lg transition-all",
                  designTokens.typography.body,
                  filterMode === 'valid'
                    ? 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-900 dark:text-white border border-slate-300 dark:border-[#3a3a3a] font-medium shadow-sm dark:shadow-none'
                    : 'text-slate-500 dark:text-[#6b6b6b] hover:text-slate-700 dark:hover:text-[#a1a1a1] hover:bg-slate-50 dark:hover:bg-[#1e1e1e] border border-transparent'
                )}
                onClick={() => setFilterMode('valid')}
              >
                Valid <span className={cn("ml-2 px-2 py-0.5 rounded-full text-xs font-medium", filterMode === 'valid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500')}>{validCount}</span>
              </button>
              <button
                type="button"
                className={cn(
                  "px-4 py-2 rounded-lg transition-all",
                  designTokens.typography.body,
                  filterMode === 'error'
                    ? 'bg-slate-100 dark:bg-[#2a2a2a] text-slate-900 dark:text-white border border-slate-300 dark:border-[#3a3a3a] font-medium shadow-sm dark:shadow-none'
                    : 'text-slate-500 dark:text-[#6b6b6b] hover:text-slate-700 dark:hover:text-[#a1a1a1] hover:bg-slate-50 dark:hover:bg-[#1e1e1e] border border-transparent'
                )}
                onClick={() => setFilterMode('error')}
              >
                Error <span className={cn("ml-2 px-2 py-0.5 rounded-full text-xs font-medium", filterMode === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500')}>{errorCount}</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {backendUrl && importerKey && errorCount > 0 && (
                <Tooltip content="Use AI to automatically fix validation errors">
                  <Button
                    size="sm"
                    onClick={() => setIsTransformPanelOpen(true)}
                    variant="default"
                    className="shadow-sm"
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Fix errors
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <StepLayout
      title="Validate Data"
      subtitle="Review and correct any errors in your data before importing."
      headerContent={headerContent}
      footerContent={footerContent}
      contentClassName="px-6 py-4 overflow-visible"
    >
      <form onSubmit={handleSubmit} className="h-full">

        <div className="h-full overflow-x-auto border border-slate-200 dark:border-[#3a3a3a] rounded-xl bg-gradient-to-b from-white to-slate-50/50 dark:from-[#1a1a1a] dark:to-[#121212] shadow-sm dark:shadow-none" ref={scrollableSectionRef}>
          {visibleRows.length > 0 ? (
            <VirtualTable
            headers={headers}
            rows={visibleRows}
            headerRowIndex={headerRowIndex}
            includedColumns={includedColumns}
            rowHeight={56}
            overscan={5}
            stickyHeader={true}
            stickyFirstColumn={true}
            getRowClassName={(row, actualRowIdx) => {
              const displayRowIndex = actualRowIdx + headerRowIndex + 1;
              const rowHasError = errors.some(err => err.rowIndex === displayRowIndex);
              return rowHasError ? 'bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100/70 dark:hover:bg-red-900/30' : '';
            }}
            renderCell={(row, colIdx, actualRowIdx) => {
              const value = row.values[colIdx];
              const displayRowIndex = actualRowIdx + headerRowIndex + 1;
              const error = errors.find(
                err => err.rowIndex === displayRowIndex && err.columnIndex === colIdx
              );

              return (
                <div className="relative">
                  <input
                    type="text"
                    value={String(value || '')}
                    onChange={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => {
                      // Find the original row index based on the pre-transformed row
                      const preTransformedIdx = preTransformedRows.indexOf(row);
                      if (preTransformedIdx !== -1 && e.target) {
                        handleCellEdit(preTransformedIdx, colIdx, (e.target as HTMLInputElement).value);
                      }
                    }}
                    tabIndex={0}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors ${error ? 'border-red-400 dark:border-red-600 bg-red-50/70 dark:bg-red-950/50 text-gray-900 dark:text-[#e5e5e5]' : 'border-slate-200 dark:border-[#3a3a3a] hover:border-slate-300 dark:hover:border-[#4a4a4a] bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-[#e5e5e5]'}`}
                  />
                  {error && (
                    <Tooltip content={error.message}>
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#DC2626"/>
                          <path d="M8 4.5V9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                          <circle cx="8" cy="11.5" r="0.75" fill="white"/>
                        </svg>
                      </span>
                    </Tooltip>
                  )}
                </div>
              );
            }}
            />
          ) : (
            <div className="p-8 text-center">
              <span className={cn(designTokens.typography.body, "text-slate-400 dark:text-[#6b6b6b]")}>
                {filterMode === 'error' ? 'No rows with errors found' :
                 filterMode === 'valid' ? 'No valid rows found' :
                 'No data to display'}
              </span>
            </div>
          )}
        </div>

        {/* Transform Panel */}
        {backendUrl && importerKey && (
          <TransformPanel
          isOpen={isTransformPanelOpen}
          onClose={() => setIsTransformPanelOpen(false)}
          data={dataRows}
          columnMapping={columnMapping}
          backendUrl={backendUrl}
          importerKey={importerKey}
          validationErrors={errors.map(e => {
            // Convert display row index to data array index
            const dataRowIndex = e.rowIndex - headerRowIndex - 1;
            const mapping = columnMapping[e.columnIndex];
            const extendedMapping = mapping as typeof mapping & { id?: string; key?: string };
            return {
              rowIndex: dataRowIndex,
              columnKey: (extendedMapping?.id || extendedMapping?.key) || '',
              message: e.message,
              value: dataRows[dataRowIndex]?.values[e.columnIndex]
            };
          })}
          onApplyTransformations={(changes) => {

            // Create a copy of dataRows and apply all changes
            const updatedRows = [...dataRows];
            let appliedCount = 0;
            let skippedCount = 0;

            changes.forEach((change) => {
              const { rowIndex, columnIndex, newValue } = change;

              // Skip if columnIndex is undefined
              if (columnIndex === undefined) {
                console.warn(`Skipping change for row ${rowIndex}: columnIndex is undefined`);
                skippedCount++;
                return;
              }

              // Validate row index
              if (rowIndex < 0 || rowIndex >= updatedRows.length) {
                console.warn(`Skipping change: rowIndex ${rowIndex} out of bounds (dataRows has ${updatedRows.length} rows)`);
                skippedCount++;
                return;
              }

              // Apply the change
              if (updatedRows[rowIndex] && updatedRows[rowIndex].values) {
                // Deep copy the row to avoid mutation issues
                if (updatedRows[rowIndex] === dataRows[rowIndex]) {
                  updatedRows[rowIndex] = {
                    ...updatedRows[rowIndex],
                    values: [...updatedRows[rowIndex].values]
                  };
                }
                updatedRows[rowIndex].values[columnIndex] = newValue;
                appliedCount++;
              }
            });

            // Update the state with all changes at once
            setDataRows(updatedRows);
            shouldValidateRef.current = true;
            setIsTransformPanelOpen(false);
          }}
          />
        )}
      </form>
    </StepLayout>
  );
}
