import { Template } from "../../../types";
import { FileData } from "../../main/types";

export type TemplateColumnMapping = {
  key: string;
  include: boolean;
  selected?: boolean;
  confidence?: number;       // Confidence score from LLM (0-1)
  isLLMSuggestion?: boolean; // Flag to indicate this came from LLM
};

export type MapColumnsProps = {
  template: Template;
  data: FileData;
  columnMapping: { [index: number]: TemplateColumnMapping };
  selectedHeaderRow: number | null;
  skipHeaderRowSelection?: boolean;
  onSuccess: (columnMapping: { [index: number]: TemplateColumnMapping }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  importerId?: string;     // ID of the importer for LLM API calls
  backendUrl?: string;     // Backend URL for API calls
};
