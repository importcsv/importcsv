import { Template } from '../../../types';
import { ColumnMapping, ColumnMappingDictionary } from '../../../../types';

export interface ConfigureImportProps {
  template: Template;
  data: any;
  onSuccess: (mapping: ColumnMappingDictionary, headerRow: number) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  importerKey?: string;
  backendUrl?: string;
  isDemoMode?: boolean;
}

// Re-export from main types
export type { ColumnMapping, ColumnMappingDictionary };
