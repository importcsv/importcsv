// frontend/src/headless/root.tsx
import { createContext, type VNode, h } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import { z } from 'zod';
import type { CSVContextValue, RootProps } from './types';
import { zodSchemaToColumns } from './utils/zodSchemaToColumns';

export const CSVContext = createContext<CSVContextValue | null>(null);

/**
 * CSV Root context provider with Zod schema support
 *
 * @example
 * // With Zod schema (recommended)
 * const schema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * <CSV.Root schema={schema} onComplete={(data) => console.log(data)}>
 *   <CSV.Uploader />
 *   <CSV.Validator />
 * </CSV.Root>
 *
 * @example
 * // With legacy columns array (backward compatibility)
 * <CSV.Root
 *   columns={[
 *     { id: 'name', label: 'Name', type: 'string', required: true },
 *     { id: 'email', label: 'Email', type: 'email', required: true }
 *   ]}
 *   onComplete={(data) => console.log(data)}
 * >
 *   <CSV.Uploader />
 * </CSV.Root>
 */
export function Root<TSchema = any>({
  children,
  schema,
  columns,
  onComplete,
  data
}: RootProps<TSchema>): VNode<any> {
  // Memoize column derivation for performance
  const derivedColumns = useMemo(
    () => (schema ? zodSchemaToColumns(schema) : columns || []),
    [schema, columns]
  );

  // Memoize validate function to prevent unnecessary re-renders
  const validate = useMemo(
    () => (row: any) => {
      if (schema) {
        return schema.safeParse(row);
      }
      return { success: true, data: row } as z.SafeParseReturnType<TSchema, TSchema>;
    },
    [schema]
  );

  const value: CSVContextValue<TSchema> = useMemo(
    () => ({
      columns: derivedColumns,
      schema,
      validate,
      onComplete,
      data
    }),
    [derivedColumns, schema, validate, onComplete, data]
  );

  return h(CSVContext.Provider, { value }, children) as VNode<any>;
}

/**
 * Hook to access CSV context
 *
 * @example
 * function MyComponent() {
 *   const { columns, validate, schema } = useCSV();
 *   return <div>{columns.length} columns</div>;
 * }
 */
export function useCSV() {
  const context = useContext(CSVContext);
  if (!context) {
    throw new Error('useCSV must be used within a CSV.Root component');
  }
  return context;
}
