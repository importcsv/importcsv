export enum Steps {
  Upload = "upload",
  RowSelection = "row-selection",
  MapColumns = "map-columns",
  Validation = "validation",
}

export type FileRow = {
  index: number;
  values: string[];
};

export type FileData = {
  fileName: string;
  rows: FileRow[];
  sheetList: string[];
  errors: string[];
};
