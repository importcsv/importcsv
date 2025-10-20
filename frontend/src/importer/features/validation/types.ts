import { FileData } from "../main/types";
import { TemplateColumnMapping } from "../map-columns/types";
import { Column } from "../../../types";
import { z } from 'zod';

export interface ValidationError {
  rowIndex: number;
  columnIndex: number;
  message: string;
  value: string | number;
}

export interface ValidationProps {
  columns?: Column[];
  schema?: z.ZodSchema<any>;
  data: FileData;
  columnMapping: { [index: number]: TemplateColumnMapping };
  selectedHeaderRow: number | null;
  onSuccess: (validData: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  backendUrl?: string;
  importerKey?: string;
  filterInvalidRows?: boolean;
  disableOnInvalidRows?: boolean;
}

export interface ValidationState {
  errors: ValidationError[];
  editedValues: { [rowIndex: number]: { [columnIndex: number]: string | number } };
}
