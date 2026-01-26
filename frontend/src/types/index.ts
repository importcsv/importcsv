// HelloCSV-inspired Column definition
export interface Column {
  id: string;              // Unique identifier for the column
  label: string;           // Display name for the column
  type?: 'string' | 'number' | 'email' | 'date' | 'phone' | 'select';  // Default: 'string'
  
  // Validation rules (HelloCSV-style validators array)
  validators?: Validator[];
  
  // Transformation rules (applied after submit, before sending to parent)
  transformations?: Transformer[];
  
  // For select type
  options?: string[];
  
  // Optional helpers
  description?: string;
  placeholder?: string;
}

// Validator types (HelloCSV-inspired)
export type Validator = 
  | { type: 'required'; message?: string }
  | { type: 'unique'; message?: string }
  | { type: 'regex'; pattern: string; message?: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'min_length'; value: number; message?: string }
  | { type: 'max_length'; value: number; message?: string };

// Transformation stage type
export type TransformationStage = 'pre' | 'post';

// Transformer types (with optional stage for explicit control)
export type Transformer = 
  | { type: 'trim'; stage?: TransformationStage }
  | { type: 'uppercase'; stage?: TransformationStage }
  | { type: 'lowercase'; stage?: TransformationStage }
  | { type: 'capitalize'; stage?: TransformationStage }
  | { type: 'remove_special_chars'; stage?: TransformationStage }
  | { type: 'normalize_phone'; stage?: TransformationStage }
  | { type: 'normalize_date'; format?: string; stage?: TransformationStage }
  | { type: 'default'; value: string; stage?: TransformationStage }
  | { type: 'replace'; find: string; replace: string; stage?: TransformationStage }
  | { type: 'custom'; fn: (value: any) => any; stage?: TransformationStage };

/**
 * Result structure returned by onComplete callback
 */
export interface ImportResult<T = Record<string, unknown>> {
  rows: (T & {
    _custom_fields?: Record<string, unknown>;
    _unmatched?: Record<string, unknown>;
  })[];
  columns: {
    predefined: Column[];
    dynamic: Column[];
    unmatched: string[];
  };
}

// Column mapping types
export interface ColumnMapping {
  id: string;              // Column identifier
  label?: string;          // Display name (optional)
  include: boolean;        // Whether to include this column
  selected?: boolean;      // Whether column is selected (UI state)
}

// Mapping of upload column index to template column
export interface ColumnMappingDictionary {
  [uploadColumnIndex: number]: ColumnMapping;
}

// Modal parameters
type ModalParams = {
  isModal?: boolean;
  modalIsOpen?: boolean;
  modalOnCloseTriggered?: () => void;
  modalCloseOnOutsideClick?: boolean;
};

// Custom translation resource type
type CustomTranslationResource = {
  [language: string]: {
    [key: string]: string;
  };
};

import { ThemeConfig } from './theme';
import { z } from 'zod';

// Main CSV Importer Props
export type CSVImporterProps<TSchema = any> = {
  // Schema definition (recommended - one of schema or columns required)
  schema?: z.ZodSchema<TSchema>;

  /**
   * @deprecated Use `schema` prop instead for better type safety
   */
  columns?: Column[];          // For standalone mode (HelloCSV-style)

  /**
   * Customer-specific dynamic columns passed at runtime.
   * These appear after predefined columns in the mapping dropdown.
   * Output is nested under _custom_fields in each row.
   */
  dynamicColumns?: Column[];

  importerKey?: string;        // For backend mode

  // Required callback - receives ImportResult with rows, columns metadata
  onComplete?: (data: ImportResult<TSchema>) => void;
  
  // Optional configuration
  backendUrl?: string;         // API endpoint (default from config)
  context?: Record<string, any>;  // Custom context passed to webhooks
  
  // UI customization
  theme?: ThemeConfig | 'default' | 'minimal' | 'modern' | 'compact' | 'dark'; // New theme system
  darkMode?: boolean;          // Backward compatibility
  primaryColor?: string;       // Backward compatibility
  className?: string;
  customStyles?: Record<string, string> | string; // Backward compatibility
  
  // Component class names for customization
  classNames?: {
    root?: string;
    modal?: string;
    header?: string;
    stepper?: string;
    content?: string;
    footer?: string;
    button?: string;
    input?: string;
    table?: string;
    dropzone?: string;
  };
  
  // Behavior options
  showDownloadTemplateButton?: boolean;
  skipHeaderRowSelection?: boolean;
  waitOnComplete?: boolean;
  
  // Import behavior options
  invalidRowHandling?: 'include' | 'exclude' | 'block';
  includeUnmatchedColumns?: boolean;
  
  // Localization
  language?: string;
  customTranslations?: CustomTranslationResource;
  
  // Demo mode
  demoData?: {
    fileName: string;
    csvContent: string;
  };
  
} & ModalParams;
