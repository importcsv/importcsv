import { Column, ColumnMapping, ColumnMappingDictionary } from "../../../../types";
import { FileData } from "../../main/types";

// Re-export from main types for backward compatibility
export type { ColumnMapping, ColumnMappingDictionary };
export type TemplateColumnMapping = ColumnMapping; // Deprecated alias

export type MapColumnsProps = {
  columns?: Column[];
  data: FileData;
  columnMapping: ColumnMappingDictionary;
  selectedHeaderRow: number | null;
  skipHeaderRowSelection?: boolean;
  onSuccess: (columnMapping: ColumnMappingDictionary) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  importerKey?: string;     // Key of the importer for API calls
  backendUrl?: string;     // Backend URL for API calls
};
