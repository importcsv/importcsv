import React, { useState, useMemo, FormEvent, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Tooltip } from '../../components/ui/tooltip';
import { Wrench, AlertTriangle } from 'lucide-react';
import { ValidationProps } from './types';
import TransformModal from './components/TransformModal';
import { validateColumn, validateUniqueness } from '../../../validation/validator';
import { applyTransformations } from '../../../validation/transformer';


// Validation component for checking imported data
export default function Validation({
  columns,
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
}: ValidationProps) {
  // State management
  const [errors, setErrors] = useState<Array<{rowIndex: number, columnIndex: number, message: string}>>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'error'>('all');
  const [isTransformModalOpen, setIsTransformModalOpen] = useState(false);

  // Ref for scrollable section to reset scroll position
  const scrollableSectionRef = useRef<HTMLDivElement>(null);

  // Data extraction
  const headerRowIndex = selectedHeaderRow || 0;
  const headerRow = fileData.rows[headerRowIndex];

  // Make dataRows a state variable so changes persist
  const [dataRows, setDataRows] = useState(() => fileData.rows.slice(headerRowIndex + 1));

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
  const shouldValidateRef = React.useRef(true);

  // Reset scroll position when component mounts
  useEffect(() => {
    if (scrollableSectionRef.current) {
      scrollableSectionRef.current.scrollTop = 0;
    }
  }, []); // Empty dependency array ensures this runs only on mount

  // Validate column mappings
  React.useEffect(() => {
    if (!columns) return;
    // Check if mappings match column ids
    const columnIds = columns.map(col => col.id);
    const mismatches = Object.entries(columnMapping).filter(([_, mapping]) => {
      if (!mapping.include) return false;
      return !columnIds.includes(mapping.key);
    });

    if (mismatches.length > 0) {
      // Handle mismatches if needed
    }
  }, [columns, columnMapping]);

  // Data validation
  const validateData = React.useCallback(() => {
    if (!shouldValidateRef.current) return;

    const newErrors: Array<{rowIndex: number, columnIndex: number, message: string}> = [];

    // For each row in the data
    dataRows.forEach((row, rowIdx) => {
      const displayRowIndex = rowIdx + headerRowIndex + 1;

      // For each column mapping
      Object.entries(columnMapping).forEach(([colIndexStr, mapping]) => {
        if (!mapping.include) return;

        // The column index in the data
        const colIdx = parseInt(colIndexStr);
        if (isNaN(colIdx)) return;

        // The key in the column mapping
        const columnId = mapping.key;

        // Find the corresponding column
        const column = columns?.find(col => col.id === columnId);
        if (!column) {
          return;
        }

        // Get the value directly from the row
        const value = row.values[colIdx];

        // Use the validateColumn function from validator.ts
        const validationError = validateColumn(value, column);
        if (validationError) {
          newErrors.push({
            rowIndex: displayRowIndex,
            columnIndex: colIdx,
            message: validationError
          });
        }
      });
    });

    // Check uniqueness for columns with unique validator
    columns?.forEach((column) => {
      const hasUniqueValidator = column.validators?.some(v => v.type === 'unique');
      if (hasUniqueValidator) {
        // Find the column index in the mapping
        const mappingEntry = Object.entries(columnMapping).find(([_, mapping]) => 
          mapping.include && mapping.key === column.id
        );
        
        if (mappingEntry) {
          const colIdx = parseInt(mappingEntry[0]);
          
          // Prepare data for uniqueness check
          const rowValues = dataRows.map(row => row.values);
          const duplicateIndices = validateUniqueness(rowValues, colIdx, column);
          
          duplicateIndices.forEach(rowIdx => {
            const displayRowIndex = rowIdx + headerRowIndex + 1;
            const existingError = newErrors.find(
              err => err.rowIndex === displayRowIndex && err.columnIndex === colIdx
            );
            
            if (!existingError) {
              const validator = column.validators?.find(v => v.type === 'unique');
              newErrors.push({
                rowIndex: displayRowIndex,
                columnIndex: colIdx,
                message: validator?.message || `${column.label} must be unique`
              });
            }
          });
        }
      }
    });

    setErrors(newErrors);
    shouldValidateRef.current = false;
  }, [dataRows, columnMapping, columns, headerRowIndex]);

  // Trigger validation when data changes
  React.useEffect(() => {
    shouldValidateRef.current = true;
    validateData();
  }, [dataRows, validateData]);

  // Cell editing
  const handleCellEdit = React.useCallback((rowIdx: number, colIdx: number, value: string) => {
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

  // Row filtering with counts
  const { visibleRows, validCount, errorCount } = useMemo(() => {
    const errorRowIndices = new Set(
      errors.map(err => err.rowIndex - headerRowIndex - 1)
    );

    const validRows = dataRows.filter((_, idx) => !errorRowIndices.has(idx));
    const errorRows = dataRows.filter((_, idx) => errorRowIndices.has(idx));

    let filtered: typeof dataRows;
    if (filterMode === 'valid') {
      filtered = validRows;
    } else if (filterMode === 'error') {
      filtered = errorRows;
    } else {
      filtered = dataRows;
    }

    return {
      visibleRows: filtered,
      validCount: validRows.length,
      errorCount: errorRows.length
    };
  }, [dataRows, filterMode, errors, headerRowIndex]);

  // Error tracking
  const errorTracking = useMemo(() => {
    const indices = new Set<number>();
    const rowObjects = new Set<number>();

    errors.forEach(err => {
      // Convert from display row index to actual data row index
      const dataRowIdx = err.rowIndex - headerRowIndex - 1;
      if (dataRowIdx >= 0 && dataRowIdx < dataRows.length) {
        indices.add(dataRowIdx);
        rowObjects.add(dataRows[dataRowIdx]?.index || -1);
      }
    });

    return {
      indices,  // For filtering rows
      objects: Array.from(rowObjects).filter(idx => idx !== -1),  // For UI display
      count: indices.size  // For quick access to error count
    };
  }, [errors, headerRowIndex, dataRows]);

  // Form submission
  const handleSubmit = (e: FormEvent) => {
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
        if (!mapping || !mapping.key) return value;
        
        // Find the column definition
        const column = columns?.find(c => c.id === mapping.key);
        if (!column || !column.transformations) return value;
        
        // Apply transformations
        return applyTransformations(value, column.transformations);
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">Validate Data</h2>
        <p className="text-sm text-gray-600 mt-1">Review and correct any errors in your data before importing.</p>
      </div>

      <div className="px-6 py-4 border-b bg-gray-50">
        {filterInvalidRows && errorTracking.count > 0 && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Invalid Rows Will Be Filtered</AlertTitle>
            <AlertDescription>
              {`${errorTracking.count} ${errorTracking.count === 1 ? 'row' : 'rows'} with validation errors will be excluded from the import. You can fix the errors to include these rows.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="">
          <div className="flex justify-between items-center">
            <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterMode === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setFilterMode('all')}
              >
                All <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">{dataRows.length}</span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterMode === 'valid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setFilterMode('valid')}
              >
                Valid <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{validCount}</span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterMode === 'error' 
                    ? 'bg-white text-red-600 shadow-sm' 
                    : 'text-red-600 hover:text-red-700'
                }`}
                onClick={() => setFilterMode('error')}
              >
                Error <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">{errorCount}</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {backendUrl && importerKey && errorCount > 0 && (
                <Tooltip content="Use AI to automatically fix validation errors">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsTransformModalOpen(true)}
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
      </div>

      <div className="flex-1 overflow-auto" ref={scrollableSectionRef}>
            <div className="min-w-full">
            <table className="border-collapse" style={{ minWidth: '100%' }}>
              <thead className="bg-gray-50 border-b-2 border-gray-200" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-50 border-r border-gray-200" style={{ position: 'sticky', left: 0, zIndex: 11, minWidth: '60px', width: '60px' }}>#</th>
                  {headers.map((header, idx) => (
                    <th key={idx} className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-50" style={{ minWidth: '150px' }}>
                      <div>{header}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {visibleRows.map((row, rowIdx) => {
                    const actualRowIdx = dataRows.indexOf(row);
                    const displayRowIndex = actualRowIdx + headerRowIndex + 1;
                    const rowHasError = errors.some(err => err.rowIndex === displayRowIndex);

                    return (
                      <tr key={rowIdx} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${rowHasError ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                        <td className="px-6 py-3 text-sm text-gray-700 border-r border-gray-200" style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: rowHasError ? '#FEF2F2' : '#F9FAFB', minWidth: '60px', width: '60px' }}>
                          <span>{displayRowIndex + 1}</span>
                        </td>
                        {includedColumns.map((colIdx, idx) => {
                          const value = row.values[colIdx];

                          const error = errors.find(
                            err => err.rowIndex === displayRowIndex && err.columnIndex === colIdx
                          );

                          return (
                            <td key={idx} className="px-6 py-3" style={{ minWidth: '150px' }}>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={String(value || '')}
                                  onChange={(e) => handleCellEdit(actualRowIdx, colIdx, e.target.value)}
                                  tabIndex={0}
                                  className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
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
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
            </table>
            </div>
            {visibleRows.length === 0 && (
              <div className="p-8 text-center">
                <span className="text-gray-500">
                  {filterMode === 'error' ? 'No rows with errors found' :
                   filterMode === 'valid' ? 'No valid rows found' :
                   'No data to display'}
                </span>
              </div>
            )}
      </div>

      <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          size="default"
        >
          Back
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={disableOnInvalidRows && errors.length > 0}
          size="default"
          variant="default"
        >
          Submit
        </Button>
      </div>

      {/* Transform Modal */}
      {backendUrl && importerKey && (
        <TransformModal
          isOpen={isTransformModalOpen}
          onClose={() => setIsTransformModalOpen(false)}
          data={dataRows}
          columnMapping={columnMapping}
          backendUrl={backendUrl}
          importerKey={importerKey}
          validationErrors={errors.map(e => {
            // Convert display row index to data array index
            const dataRowIndex = e.rowIndex - headerRowIndex - 1;
            return {
              rowIndex: dataRowIndex,
              columnKey: columnMapping[e.columnIndex]?.key || '',
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
            setIsTransformModalOpen(false);
          }}
        />
      )}
    </form>
  );
}
