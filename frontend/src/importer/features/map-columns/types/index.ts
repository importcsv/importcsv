import { Column } from "../../../../types";
import { FileData } from "../../main/types";

export type ColumnMapping = {
  id: string;
  include: boolean;
  selected?: boolean;
};

// Keep TemplateColumnMapping as alias for backward compatibility temporarily
export type TemplateColumnMapping = ColumnMapping;

export type MapColumnsProps = {
  columns?: Column[];
  data: FileData;
  columnMapping: { [index: number]: ColumnMapping };
  selectedHeaderRow: number | null;
  skipHeaderRowSelection?: boolean;
  onSuccess: (columnMapping: { [index: number]: ColumnMapping }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  importerKey?: string;     // Key of the importer for API calls
  backendUrl?: string;     // Backend URL for API calls
};
