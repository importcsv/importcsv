// frontend/src/headless/types.ts
import { z } from 'zod';
import { ComponentChildren } from 'preact';

export interface Column {
  id: string;
  label?: string;
  type?: string;
  required?: boolean;
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
