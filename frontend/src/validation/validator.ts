import { Column, Validator } from '../types';

/**
 * Validates a single value against a column's validators
 * @param value The value to validate
 * @param column The column definition with validators
 * @returns Error message if validation fails, null if valid
 */
export function validateColumn(value: any, column: Column): string | null {
  const strValue = String(value || '').trim();
  
  // Check validators array if present
  if (column.validators) {
    for (const validator of column.validators) {
      const error = runValidator(strValue, validator, column);
      if (error) return error;
    }
  }
  
  // Type-based validation (automatic based on column type)
  if (strValue) { // Only validate non-empty values for type
    switch (column.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
          return 'Invalid email address';
        }
        break;
        
      case 'number':
        if (isNaN(Number(strValue))) {
          return 'Must be a number';
        }
        break;
        
      case 'phone':
        // Remove non-digits and check minimum length
        const digits = strValue.replace(/\D/g, '');
        if (digits.length < 10) {
          return 'Invalid phone number (must be at least 10 digits)';
        }
        break;
        
      case 'date':
        // Try to parse the date
        const date = new Date(strValue);
        if (isNaN(date.getTime())) {
          return 'Invalid date format';
        }
        break;
        
      case 'select':
        // Check if value is in options
        if (column.options && !column.options.includes(strValue)) {
          return `Must be one of: ${column.options.join(', ')}`;
        }
        break;
    }
  }
  
  return null;
}

/**
 * Runs a single validator
 */
function runValidator(value: string, validator: Validator, column: Column): string | null {
  switch (validator.type) {
    case 'required':
      if (!value || value === '') {
        return validator.message || `${column.label} is required`;
      }
      break;
      
    case 'unique':
      // Unique validation needs to be handled at batch level
      // Return null here, handle in batch validation
      break;
      
    case 'regex':
      if (value && !new RegExp(validator.pattern).test(value)) {
        return validator.message || `${column.label} format is invalid`;
      }
      break;
      
    case 'min':
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue < validator.value) {
        return validator.message || `${column.label} must be at least ${validator.value}`;
      }
      break;
      
    case 'max':
      const numVal = Number(value);
      if (!isNaN(numVal) && numVal > validator.value) {
        return validator.message || `${column.label} must be at most ${validator.value}`;
      }
      break;
      
    case 'min_length':
      if (value && value.length < validator.value) {
        return validator.message || `${column.label} must be at least ${validator.value} characters`;
      }
      break;
      
    case 'max_length':
      if (value && value.length > validator.value) {
        return validator.message || `${column.label} must be at most ${validator.value} characters`;
      }
      break;
  }
  
  return null;
}

/**
 * Validates uniqueness across all rows for a column
 * @param rows All data rows
 * @param columnIndex The column index to check
 * @param column The column definition
 * @returns Array of row indices that have duplicate values
 */
export function validateUniqueness(
  rows: any[][],
  columnIndex: number,
  column: Column
): number[] {
  const duplicateIndices: number[] = [];
  const seen = new Map<string, number>();
  
  rows.forEach((row, rowIndex) => {
    const value = String(row[columnIndex] || '').trim().toLowerCase();
    if (value) {
      if (seen.has(value)) {
        // Mark both the original and duplicate as errors
        const originalIndex = seen.get(value)!;
        if (!duplicateIndices.includes(originalIndex)) {
          duplicateIndices.push(originalIndex);
        }
        duplicateIndices.push(rowIndex);
      } else {
        seen.set(value, rowIndex);
      }
    }
  });
  
  return duplicateIndices;
}

/**
 * Batch validation for all rows
 * @param rows Data rows to validate
 * @param columns Column definitions
 * @returns Validation results with errors per cell
 */
export function validateBatch(
  rows: any[][],
  columns: Column[]
): Map<string, string> {
  const errors = new Map<string, string>();
  
  // Validate each cell
  rows.forEach((row, rowIndex) => {
    columns.forEach((column, colIndex) => {
      const value = row[colIndex];
      const error = validateColumn(value, column);
      if (error) {
        errors.set(`${rowIndex}-${colIndex}`, error);
      }
    });
  });
  
  // Check uniqueness for columns with unique validator
  columns.forEach((column, colIndex) => {
    const hasUniqueValidator = column.validators?.some(v => v.type === 'unique');
    if (hasUniqueValidator) {
      const duplicateIndices = validateUniqueness(rows, colIndex, column);
      duplicateIndices.forEach(rowIndex => {
        const key = `${rowIndex}-${colIndex}`;
        if (!errors.has(key)) {
          const validator = column.validators?.find(v => v.type === 'unique');
          errors.set(key, validator?.message || `${column.label} must be unique`);
        }
      });
    }
  });
  
  return errors;
}