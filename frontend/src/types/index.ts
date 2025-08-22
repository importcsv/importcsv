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

// Transformer types (applied after validation, before sending to parent)
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

// Main CSV Importer Props
export type CSVImporterProps = {
  // Mode determination (one or the other)
  columns?: Column[];          // For standalone mode (HelloCSV-style)
  importerKey?: string;        // For backend mode
  
  // Required callback
  onComplete?: (data: any) => void;
  
  // Optional configuration
  backendUrl?: string;         // API endpoint (default from config)
  user?: Record<string, any>;  // User context for backend
  metadata?: Record<string, any>; // Additional data
  
  // UI customization
  darkMode?: boolean;
  primaryColor?: string;
  className?: string;
  customStyles?: Record<string, string> | string;
  
  // Behavior options
  showDownloadTemplateButton?: boolean;
  skipHeaderRowSelection?: boolean;
  waitOnComplete?: boolean;
  useIframe?: boolean;         // CSS isolation (default: true)
  
  // Localization
  language?: string;
  customTranslations?: CustomTranslationResource;
  
  // Demo mode
  demoData?: {
    fileName: string;
    csvContent: string;
  };
  
} & ModalParams;