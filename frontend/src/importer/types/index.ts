import { Column } from '../../types';

export type Template = {
  columns: Column[];
};

export type UploadColumn = {
  index: number;
  name: string;
  sample_data: string[];
};
