import { Column } from '../types';

// Transformation types
export type Transformer = 
  | { type: 'trim' }
  | { type: 'uppercase' }
  | { type: 'lowercase' }
  | { type: 'capitalize' }
  | { type: 'remove_special_chars' }
  | { type: 'normalize_phone' }
  | { type: 'normalize_date'; format?: string }
  | { type: 'default'; value: string }
  | { type: 'replace'; find: string; replace: string }
  | { type: 'custom'; fn: (value: any) => any };

/**
 * Apply transformations to a value
 * @param value The value to transform
 * @param transformations Array of transformations to apply
 * @returns Transformed value
 */
export function applyTransformations(value: any, transformations?: Transformer[]): any {
  if (!transformations || transformations.length === 0) {
    return value;
  }
  
  let result = value;
  
  for (const transform of transformations) {
    result = applyTransformation(result, transform);
  }
  
  return result;
}

/**
 * Apply a single transformation
 */
function applyTransformation(value: any, transform: Transformer): any {
  const strValue = String(value || '');
  
  switch (transform.type) {
    case 'trim':
      return strValue.trim();
      
    case 'uppercase':
      return strValue.toUpperCase();
      
    case 'lowercase':
      return strValue.toLowerCase();
      
    case 'capitalize':
      return strValue
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
    case 'remove_special_chars':
      return strValue.replace(/[^a-zA-Z0-9\s]/g, '');
      
    case 'normalize_phone':
      // Remove all non-digits
      const digits = strValue.replace(/\D/g, '');
      // Format as (XXX) XXX-XXXX for US numbers
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length === 11 && digits[0] === '1') {
        // Handle +1 prefix
        return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      return strValue; // Return original if can't format
      
    case 'normalize_date':
      // Try to parse various date formats
      let date = new Date(strValue);
      
      // If direct parsing fails, try common formats
      if (isNaN(date.getTime())) {
        // Try MM/DD/YYYY or MM-DD-YYYY
        const parts = strValue.split(/[-\/]/);
        if (parts.length === 3) {
          // Try different interpretations
          date = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
          if (isNaN(date.getTime())) {
            // Try YYYY/MM/DD
            date = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
          }
        }
      }
      
      if (!isNaN(date.getTime())) {
        // Default to ISO format if no format specified
        const format = transform.format || 'YYYY-MM-DD';
        return formatDate(date, format);
      }
      return strValue;
      
    case 'default':
      // Apply default value if the string is empty or only whitespace
      return strValue.trim() === '' ? transform.value : strValue;
      
    case 'replace':
      try {
        return strValue.replace(new RegExp(transform.find, 'g'), transform.replace);
      } catch (error) {
        // If regex is invalid, fallback to simple string replace
        return strValue.split(transform.find).join(transform.replace);
      }
      
    case 'custom':
      try {
        return transform.fn(value);
      } catch (error) {
        // If custom function fails, return original value
        return value;
      }
      
    default:
      return value;
  }
}

/**
 * Simple date formatter
 */
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}