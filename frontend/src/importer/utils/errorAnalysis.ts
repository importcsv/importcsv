// Error analysis utilities for grouping and categorizing validation errors

export interface ValidationError {
  rowIndex: number;
  columnKey: string;
  message: string;
  value?: any;
}

export interface ErrorGroup {
  type: string;
  title: string;
  description: string;
  count: number;
  columns: string[];
  errors: ValidationError[];
  example?: {
    before: string;
    after: string;
  };
  selected: boolean;
}

// Common error patterns and their categories
const ERROR_PATTERNS = [
  {
    pattern: /date|datetime|timestamp/i,
    type: 'date_format',
    title: 'Date Format',
    description: 'Invalid or inconsistent date formats'
  },
  {
    pattern: /email|e-mail/i,
    type: 'email',
    title: 'Email Validation',
    description: 'Invalid or incomplete email addresses'
  },
  {
    pattern: /phone|mobile|tel/i,
    type: 'phone',
    title: 'Phone Numbers',
    description: 'Invalid or incomplete phone numbers'
  },
  {
    pattern: /required|missing|empty|blank/i,
    type: 'required',
    title: 'Required Fields',
    description: 'Missing required values'
  },
  {
    pattern: /number|numeric|integer|decimal/i,
    type: 'number',
    title: 'Number Format',
    description: 'Invalid number formats'
  },
  {
    pattern: /length|characters|min|max/i,
    type: 'length',
    title: 'Text Length',
    description: 'Text length validation errors'
  },
  {
    pattern: /url|link|website/i,
    type: 'url',
    title: 'URL Format',
    description: 'Invalid URL formats'
  },
  {
    pattern: /unique|duplicate/i,
    type: 'unique',
    title: 'Duplicate Values',
    description: 'Duplicate values in unique fields'
  }
];

// Detect error type based on error message
function detectErrorType(message: string): { type: string; title: string; description: string } {
  const lowerMessage = message.toLowerCase();
  
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(lowerMessage)) {
      return {
        type: pattern.type,
        title: pattern.title,
        description: pattern.description
      };
    }
  }
  
  // Default category for unmatched errors
  return {
    type: 'other',
    title: 'Other Validation',
    description: 'General validation errors'
  };
}

// Generate example fix based on error type
function generateExample(type: string, value: any): { before: string; after: string } | undefined {
  const valueStr = String(value || 'empty');
  
  switch (type) {
    case 'date_format':
      return {
        before: valueStr,
        after: 'MM/DD/YYYY format'
      };
    case 'email':
      return {
        before: valueStr.includes('@') ? valueStr : `${valueStr}@`,
        after: valueStr.includes('@') ? 'valid email' : `${valueStr}@example.com`
      };
    case 'phone':
      return {
        before: valueStr,
        after: '(555) 555-1234'
      };
    case 'required':
      return {
        before: 'empty',
        after: 'Default value'
      };
    case 'number':
      return {
        before: valueStr,
        after: 'Valid number'
      };
    case 'url':
      return {
        before: valueStr,
        after: 'https://example.com'
      };
    default:
      return undefined;
  }
}

// Analyze and group validation errors
export function analyzeValidationErrors(errors: ValidationError[]): ErrorGroup[] {
  const groupMap = new Map<string, ErrorGroup>();
  
  errors.forEach(error => {
    const { type, title, description } = detectErrorType(error.message);
    
    if (!groupMap.has(type)) {
      groupMap.set(type, {
        type,
        title,
        description,
        count: 0,
        columns: [],
        errors: [],
        selected: true // Select all by default
      });
    }
    
    const group = groupMap.get(type)!;
    group.errors.push(error);
    group.count++;
    
    // Track unique columns
    if (!group.columns.includes(error.columnKey)) {
      group.columns.push(error.columnKey);
    }
    
    // Set example from first error if not set
    if (!group.example && error.value !== undefined) {
      group.example = generateExample(type, error.value);
    }
  });
  
  // Convert to array and sort by count (most errors first)
  return Array.from(groupMap.values()).sort((a, b) => b.count - a.count);
}

// Get a summary of error groups
export function getErrorSummary(groups: ErrorGroup[]): string {
  const totalErrors = groups.reduce((sum, g) => sum + g.count, 0);
  const categoryCount = groups.length;
  
  if (totalErrors === 0) return 'No errors found';
  if (categoryCount === 1) return `${totalErrors} ${groups[0].title.toLowerCase()} errors`;
  
  return `${totalErrors} errors in ${categoryCount} categories`;
}

// Get selected error groups
export function getSelectedErrors(groups: ErrorGroup[]): ValidationError[] {
  return groups
    .filter(g => g.selected)
    .flatMap(g => g.errors);
}

// Toggle selection for a group
export function toggleErrorGroup(groups: ErrorGroup[], type: string): ErrorGroup[] {
  return groups.map(g => 
    g.type === type 
      ? { ...g, selected: !g.selected }
      : g
  );
}

// Select/deselect all groups
export function setAllErrorGroups(groups: ErrorGroup[], selected: boolean): ErrorGroup[] {
  return groups.map(g => ({ ...g, selected }));
}

// Count selected errors
export function countSelectedErrors(groups: ErrorGroup[]): number {
  return groups
    .filter(g => g.selected)
    .reduce((sum, g) => sum + g.count, 0);
}