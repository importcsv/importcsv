// frontend/src/headless/utils/zodSchemaToColumns.ts
import { z } from 'zod';
import type { Column } from '../types';

/**
 * Converts a Zod schema to an array of Column definitions
 *
 * @example
 * const schema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number().optional()
 * });
 *
 * const columns = zodSchemaToColumns(schema);
 * // Result: [
 * //   { id: 'name', label: 'Name', required: true },
 * //   { id: 'email', label: 'Email', required: true },
 * //   { id: 'age', label: 'Age', required: false }
 * // ]
 */
export function zodSchemaToColumns<T>(schema: z.ZodSchema<T>): Column[] {
  if (schema instanceof z.ZodObject) {
    const shape = (schema as any).shape;
    return Object.entries(shape).map(([key, zodType]: [string, any]) => ({
      id: key,
      label: formatLabel(key),
      type: inferTypeFromZod(zodType),
      required: isZodTypeRequired(zodType)
    }));
  }
  return [];
}

/**
 * Checks if a Zod type is required (not optional)
 */
function isZodTypeRequired(zodType: any): boolean {
  if (!zodType || !zodType._def) return true;

  const typeName = zodType._def.typeName;
  return typeName !== 'ZodOptional';
}

/**
 * Formats a camelCase or snake_case field name into a human-readable label
 *
 * @example
 * formatLabel('firstName') // 'First Name'
 * formatLabel('email_address') // 'Email Address'
 */
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // camelCase → Camel Case
    .replace(/_/g, ' ') // snake_case → snake case
    .replace(/^./, str => str.toUpperCase()) // capitalize first letter
    .trim();
}

/**
 * Infers a basic type from a Zod schema type
 */
function inferTypeFromZod(zodType: any): string {
  // Handle undefined/null
  if (!zodType || !zodType._def) return 'string';

  const typeName = zodType._def.typeName;

  if (!typeName) return 'string';

  const typeMap: Record<string, string> = {
    ZodString: 'string',
    ZodNumber: 'number',
    ZodBoolean: 'boolean',
    ZodDate: 'date',
    ZodArray: 'array',
    ZodObject: 'object',
    ZodEnum: 'enum',
    ZodOptional: inferTypeFromZod(zodType._def.innerType),
    ZodNullable: inferTypeFromZod(zodType._def.innerType)
  };

  return typeMap[typeName] || 'string';
}
