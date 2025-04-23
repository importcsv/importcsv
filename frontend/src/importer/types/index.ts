export type Template = {
  columns: TemplateColumn[];
};

export type TemplateColumn = {
  name: string;
  key?: string; // Allow key to be potentially undefined initially
  description?: string;
  required?: boolean;
  suggested_mappings?: string[];
  data_type?: string;
  validation_format?: string;
  type?: string; // For backwards compatibility
};

export type UploadColumn = {
  index: number;
  name: string;
  sample_data: string[];
};
