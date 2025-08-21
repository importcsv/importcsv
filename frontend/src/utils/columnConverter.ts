import { Column } from '../types';
import { Template, TemplateColumn } from '../importer/types';

/**
 * Converts HelloCSV-style columns to legacy Template format
 * This is a bridge function to allow incremental migration
 */
export function columnsToTemplate(columns: Column[]): Template {
  return {
    columns: columns.map(columnToTemplateColumn)
  };
}

/**
 * Converts a single Column to TemplateColumn
 */
function columnToTemplateColumn(column: Column): TemplateColumn {
  // Map column type to backend type
  const typeMapping: Record<string, string> = {
    'string': 'text',
    'number': 'number',
    'email': 'email',
    'date': 'date',
    'phone': 'phone',
    'select': 'select'
  };
  
  const mappedType = typeMapping[column.type || 'string'] || 'text';
  
  // Check if column has required validator
  const isRequired = column.validators?.some(v => v.validate === 'required') || false;
  
  // Extract regex pattern if exists
  const regexValidator = column.validators?.find(v => v.validate === 'regex');
  const validationFormat = regexValidator && 'pattern' in regexValidator ? regexValidator.pattern : undefined;
  
  return {
    name: column.label,
    key: column.id,
    description: column.description,
    required: isRequired,
    type: mappedType,
    data_type: mappedType,
    validation_format: validationFormat
  };
}

/**
 * Converts backend field to HelloCSV Column format
 */
export function backendFieldToColumn(field: any): Column {
  const column: Column = {
    id: field.name || field.key,
    label: field.display_name || field.name,
    type: mapBackendType(field.type),
    description: field.description
  };
  
  // Build validators array
  const validators = [];
  
  if (field.required) {
    validators.push({ 
      validate: 'required' as const,
      message: field.validation_error_message
    });
  }
  
  if (field.validation_format) {
    // If it's a select field, set options
    if (field.type === 'select') {
      column.options = field.validation_format.split(',').map((o: string) => o.trim());
    } else {
      // Otherwise treat as regex pattern
      validators.push({
        validate: 'regex' as const,
        pattern: field.validation_format,
        message: field.validation_error_message
      });
    }
  }
  
  if (validators.length > 0) {
    column.validators = validators;
  }
  
  return column;
}

/**
 * Maps backend field type to Column type
 */
function mapBackendType(backendType: string): Column['type'] {
  const mapping: Record<string, Column['type']> = {
    'text': 'string',
    'string': 'string',
    'number': 'number',
    'email': 'email',
    'date': 'date',
    'phone': 'phone',
    'select': 'select',
    'boolean': 'string', // Map boolean to string for now
    'custom_regex': 'string' // Map custom_regex to string
  };
  
  return mapping[backendType] || 'string';
}