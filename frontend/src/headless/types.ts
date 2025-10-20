// frontend/src/headless/types.ts
import { z } from 'zod';
import { ComponentChildren } from 'preact';

export interface Column {
  id: string;
  label?: string;
  type?: string;
  required?: boolean;
  validators?: Array<{ type: string; value?: any; message?: string; pattern?: string }>;
  transformations?: Array<{ type: string; [key: string]: any }>;
  options?: string[];
  description?: string;
  placeholder?: string;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
}

export interface CSVContextValue<TSchema = any> {
  columns: Column[];
  schema?: z.ZodSchema<TSchema>;
  validate: (row: any) => z.SafeParseReturnType<TSchema, TSchema>;
  onComplete: (data: TSchema[]) => void | Promise<void>;
  data?: {
    rows: any[];
  };
}

export interface RootProps<TSchema = any> {
  children: ComponentChildren;
  schema?: z.ZodSchema<TSchema>;
  columns?: Column[];
  onComplete: (data: TSchema[]) => void | Promise<void>;
  data?: {
    rows: any[];
  };
}

export interface ValidatorChildProps {
  errors: ValidationError[];
  validate: () => Promise<ValidationError[]>;
  isValidating: boolean;
}

export interface ValidatorProps {
  children: (props: ValidatorChildProps) => any;
}
