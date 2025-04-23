import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Flex, Text, Box, Switch, Tooltip, Input } from '@chakra-ui/react';
import { ValidationProps } from './types';
import style from './style/Validation.module.scss';

// Simple validation component that avoids performance issues
export default function SimpleValidation({
  template,
  data: fileData,
  columnMapping,
  selectedHeaderRow,
  onSuccess,
  onCancel,
  isSubmitting,
}: ValidationProps) {
  const { t } = useTranslation();
  
  // Basic state setup
  const [editedValues, setEditedValues] = useState<Record<number, Record<number, any>>>({});
  const [errors, setErrors] = useState<Array<{rowIndex: number, columnIndex: number, message: string}>>([]);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  
  // Extract header and data rows
  const headerRowIndex = selectedHeaderRow || 0;
  const headerRow = fileData.rows[headerRowIndex];
  const dataRows = fileData.rows.slice(headerRowIndex + 1);
  
  // Get included columns from mapping
  const includedColumns = useMemo(() => {
    return Object.entries(columnMapping)
      .filter(([_, mapping]) => mapping.include)
      .map(([index]) => parseInt(index));
  }, [columnMapping]);
  
  // Get column headers
  const headers = useMemo(() => {
    return includedColumns.map(colIdx => String(headerRow.values[colIdx]));
  }, [includedColumns, headerRow]);
  
  // Validate data - use a ref to track if we need to validate
  const shouldValidateRef = React.useRef(true);
  
  // Create a stable version of editedValues for dependency tracking
  const editedValuesRef = React.useRef(editedValues);
  React.useEffect(() => {
    editedValuesRef.current = editedValues;
    shouldValidateRef.current = true;
  }, [editedValues]);
  
  // Separate validation logic
  const validateData = React.useCallback(() => {
    if (!shouldValidateRef.current) return;
    
    const newErrors: Array<{rowIndex: number, columnIndex: number, message: string}> = [];
    
    // For each row in the data
    dataRows.forEach((row, rowIdx) => {
      const displayRowIndex = rowIdx + headerRowIndex + 1;
      
      // For each column mapping
      Object.entries(columnMapping).forEach(([templateField, mapping]) => {
        if (!mapping.include) return;
        
        const colIdx = parseInt(mapping.key);
        if (isNaN(colIdx)) return;
        
        // Find the corresponding template field
        const field = template.columns.find(col => col.key === templateField);
        if (!field) return;
        
        // Get the value (use edited value if available)
        const originalValue = row.values[colIdx];
        const editedValue = editedValuesRef.current[rowIdx]?.[colIdx];
        const value = editedValue !== undefined ? editedValue : originalValue;
        
        // Skip validation if value is empty and not required
        if ((value === '' || value === null || value === undefined) && !field.required) {
          return;
        }
        
        // Required field validation
        if (field.required && (value === '' || value === null || value === undefined)) {
          newErrors.push({
            rowIndex: displayRowIndex,
            columnIndex: colIdx,
            message: `${field.name} is required`
          });
          return;
        }
        
        // Type validation (basic)
        const fieldAny = field as any;
        if (fieldAny.type === 'number' && value !== '' && isNaN(Number(value))) {
          newErrors.push({
            rowIndex: displayRowIndex,
            columnIndex: colIdx,
            message: `${field.name} must be a number`
          });
        }
      });
    });
    
    setErrors(newErrors);
    shouldValidateRef.current = false;
  }, [dataRows, columnMapping, template, headerRowIndex]);
  
  // Run validation when needed
  React.useEffect(() => {
    validateData();
  }, [validateData]);
  
  // Handle cell edit with debouncing to prevent too many updates
  const handleCellEdit = React.useCallback((rowIdx: number, colIdx: number, value: string) => {
    setEditedValues(prev => {
      // Only update if value actually changed
      const currentValue = prev[rowIdx]?.[colIdx];
      if (currentValue === value) return prev;
      
      return {
        ...prev,
        [rowIdx]: {
          ...(prev[rowIdx] || {}),
          [colIdx]: value
        }
      };
    });
  }, []);
  
  // Filter rows if showing only errors
  const visibleRows = useMemo(() => {
    if (!showOnlyErrors) return dataRows;
    
    return dataRows.filter((_, rowIdx) => {
      const displayRowIndex = rowIdx + headerRowIndex + 1;
      return errors.some(err => err.rowIndex === displayRowIndex);
    });
  }, [dataRows, showOnlyErrors, errors, headerRowIndex]);
  
  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (errors.length > 0) {
      return; // Don't submit if there are errors
    }
    
    // Apply edits to the data
    const updatedData = dataRows.map((row, rowIdx) => {
      const values = [...row.values];
      
      // Apply any edited values
      if (editedValues[rowIdx]) {
        Object.entries(editedValues[rowIdx]).forEach(([colIdxStr, value]) => {
          const colIdx = parseInt(colIdxStr);
          values[colIdx] = value;
        });
      }
      
      return { ...row, values };
    });
    
    // Call onSuccess with the updated data
    onSuccess({
      ...fileData,
      rows: [headerRow, ...updatedData]
    });
  };
  
  // Render the component
  return (
    <div className={style.validationContainer}>
      <div className={style.header}>
        <h2>{t('validation.title', 'Validate Data')}</h2>
        <p>{t('validation.description', 'Review and correct any errors in your data before importing.')}</p>
      </div>
      
      <div className={style.validationContent}>
        {errors.length > 0 && (
          <div className={style.errorSummary}>
            <Text color="red.500">
              {t('validation.errorCount', { count: errors.length })}
            </Text>
          </div>
        )}
        
        <div className={style.validationFilters}>
          <Flex align="center">
            <Switch 
              id="show-errors-only" 
              isChecked={showOnlyErrors} 
              onChange={(e) => setShowOnlyErrors(e.target.checked)} 
              mr={2}
            />
            <Text fontSize="sm">Show only rows with errors</Text>
          </Flex>
        </div>
        
        <div className={style.tableContainer}>
          <table className={style.validationTable}>
            <thead>
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rowIdx) => {
                const actualRowIdx = dataRows.indexOf(row);
                const displayRowIndex = actualRowIdx + headerRowIndex + 1;
                const rowHasError = errors.some(err => err.rowIndex === displayRowIndex);
                
                return (
                  <tr key={rowIdx} className={rowHasError ? style.errorRow : ''}>
                    {includedColumns.map((colIdx, idx) => {
                      const originalValue = row.values[colIdx];
                      const editedValue = editedValues[actualRowIdx]?.[colIdx];
                      const value = editedValue !== undefined ? editedValue : originalValue;
                      
                      const error = errors.find(
                        err => err.rowIndex === displayRowIndex && err.columnIndex === colIdx
                      );
                      
                      return (
                        <td key={idx}>
                          <div className={style.editableCellContainer}>
                            <Input
                              size="sm"
                              value={String(value || '')}
                              onChange={(e) => handleCellEdit(actualRowIdx, colIdx, e.target.value)}
                              className={`${style.simpleInput} ${error ? style.errorInput : ''}`}
                            />
                            {error && (
                              <Tooltip label={error.message} placement="top">
                                <Box className={style.errorIcon}>!</Box>
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
        
        <form onSubmit={handleSubmit}>
          <Flex justify="space-between" mt={4}>
            <Button onClick={onCancel} isDisabled={isSubmitting}>
              {t('common.back', 'Back')}
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
              isDisabled={errors.length > 0}
            >
              {t('common.continue', 'Continue')}
            </Button>
          </Flex>
        </form>
      </div>
    </div>
  );
}
