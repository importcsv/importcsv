// frontend/src/headless/utils/zodSchemaToColumns.ts
import { z } from 'zod';
import type { Column, Validator, Transformer } from '../../types';

// Type aliases for better type safety when working with Zod internals
type ZodDef = {
  typeName: string;
  innerType?: z.ZodTypeAny;
  schema?: z.ZodTypeAny;
  checks?: Array<{
    kind: string;
    value?: number;
    message?: string;
    regex?: RegExp;
  }>;
  description?: string;
  values?: string[];
  effect?: {
    type: string;
    transform?: (...args: unknown[]) => unknown;
  };
};

type ZodTypeWithDef = z.ZodTypeAny & {
  _def: ZodDef;
};

/**
 * Converts a Zod schema to Column[] with full validator/transformer extraction
 *
 * @example
 * const schema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Must be a valid email'),
 *   age: z.number().min(18).optional(),
 *   department: z.enum(['engineering', 'sales', 'marketing'])
 * });
 *
 * const columns = zodSchemaToColumns(schema);
 * // Result: [
 * //   { id: 'name', label: 'Name', type: 'string', validators: [...] },
 * //   { id: 'email', label: 'Email', type: 'email', validators: [...] },
 * //   { id: 'age', label: 'Age', type: 'number', validators: [...] },
 * //   { id: 'department', label: 'Department', type: 'select', options: [...] }
 * // ]
 *
 * @note Boolean fields are mapped to 'string' type for CSV compatibility,
 *       as CSV data is text-based and typically represents booleans as 'true'/'false' strings.
 */
export function zodSchemaToColumns<T>(schema: z.ZodSchema<T>): Column[] {
  if (!(schema instanceof z.ZodObject)) {
    console.warn('zodSchemaToColumns: Only z.object() schemas supported');
    return [];
  }

  const shape = (schema as z.ZodObject<z.ZodRawShape>).shape;

  return Object.entries(shape).map(([key, zodType]: [string, z.ZodTypeAny]) => {
    const validators = extractValidators(zodType as ZodTypeWithDef);
    const transformations = extractTransformations(zodType as ZodTypeWithDef, key);
    const { type, options } = inferTypeAndOptions(zodType as ZodTypeWithDef);
    const description = extractDescription(zodType as ZodTypeWithDef);

    const column: Column = {
      id: key,
      label: formatLabel(key),
      type
    };

    // Only add optional properties if they have values
    if (validators.length > 0) {
      column.validators = validators;
    }
    if (transformations.length > 0) {
      column.transformations = transformations;
    }
    if (options) {
      column.options = options;
    }
    if (description) {
      column.description = description;
    }

    return column;
  });
}

/**
 * Extract validators from Zod type checks
 */
function extractValidators(zodType: ZodTypeWithDef): Validator[] {
  const validators: Validator[] = [];

  // Unwrap optional/nullable
  let innerType: ZodTypeWithDef = zodType;
  while (innerType._def.typeName === 'ZodOptional' || innerType._def.typeName === 'ZodNullable') {
    innerType = innerType._def.innerType as ZodTypeWithDef;
  }

  // Add required validator if not optional
  if (zodType._def.typeName !== 'ZodOptional') {
    validators.push({ type: 'required' });
  }

  // Extract checks from Zod's internal structure
  const checks = innerType._def.checks || [];

  for (const check of checks) {
    switch (check.kind) {
      case 'min':
        // String length or number minimum
        if (innerType._def.typeName === 'ZodString') {
          validators.push({
            type: 'min_length',
            value: check.value,
            message: check.message
          });
        } else if (innerType._def.typeName === 'ZodNumber') {
          validators.push({
            type: 'min',
            value: check.value,
            message: check.message
          });
        }
        break;

      case 'max':
        if (innerType._def.typeName === 'ZodString') {
          validators.push({
            type: 'max_length',
            value: check.value,
            message: check.message
          });
        } else if (innerType._def.typeName === 'ZodNumber') {
          validators.push({
            type: 'max',
            value: check.value,
            message: check.message
          });
        }
        break;

      case 'regex':
        validators.push({
          type: 'regex',
          pattern: check.regex.source,
          message: check.message
        });
        break;

      case 'email':
        // Email handled by type inference, no validator needed
        break;
    }
  }

  return validators;
}

/**
 * Extract transformations from Zod transforms
 */
function extractTransformations(zodType: ZodTypeWithDef, fieldName: string): Transformer[] {
  const transformations: Transformer[] = [];

  // Unwrap to find transforms
  let currentType: ZodTypeWithDef | undefined = zodType;
  const transformChain: ZodDef['effect'][] = [];

  // Traverse transform chain
  while (currentType) {
    if (currentType._def.typeName === 'ZodEffects' && currentType._def.effect?.type === 'transform') {
      transformChain.push(currentType._def.effect);
    }

    // Move to inner type
    if (currentType._def.innerType) {
      currentType = currentType._def.innerType as ZodTypeWithDef;
    } else if (currentType._def.schema) {
      currentType = currentType._def.schema as ZodTypeWithDef;
    } else {
      break;
    }
  }

  // Try to detect common transform patterns
  for (const effect of transformChain) {
    if (!effect) continue;

    const fnString = effect.transform?.toString() || '';

    // Pattern matching for common transforms
    if (fnString.includes('.trim()')) {
      transformations.push({ type: 'trim' });
    }
    if (fnString.includes('.toLowerCase()')) {
      transformations.push({ type: 'lowercase' });
    }
    if (fnString.includes('.toUpperCase()')) {
      transformations.push({ type: 'uppercase' });
    }

    // If we can't detect, add as custom (limited support)
    if (transformations.length === 0 && effect.transform) {
      console.warn(`Unable to convert Zod transform for field "${fieldName}". Use Column transformations for full support.`);
    }
  }

  return transformations;
}

/**
 * Infer column type and options from Zod type
 */
function inferTypeAndOptions(zodType: ZodTypeWithDef): { type: Column['type']; options?: string[] } {
  let innerType: ZodTypeWithDef = zodType;

  // Unwrap optional/nullable
  while (innerType._def.typeName === 'ZodOptional' || innerType._def.typeName === 'ZodNullable') {
    innerType = innerType._def.innerType as ZodTypeWithDef;
  }

  const typeName = innerType._def.typeName;

  // Check for email validation
  const checks = innerType._def.checks || [];
  const hasEmailCheck = checks.some((c: { kind: string }) => c.kind === 'email');
  if (hasEmailCheck) {
    return { type: 'email' };
  }

  // Enum → select
  if (typeName === 'ZodEnum') {
    return {
      type: 'select',
      options: innerType._def.values
    };
  }

  // Basic type mapping
  const typeMap: Record<string, Column['type']> = {
    ZodString: 'string',
    ZodNumber: 'number',
    ZodBoolean: 'string', // Treat as string with 'true'/'false' values
    ZodDate: 'date',
  };

  return { type: typeMap[typeName] || 'string' };
}

/**
 * Extract description from Zod type (if using .describe())
 */
function extractDescription(zodType: ZodTypeWithDef): string | undefined {
  let currentType: ZodTypeWithDef | undefined = zodType;

  // Traverse chain to find description
  while (currentType) {
    if (currentType._def.description) {
      return currentType._def.description;
    }

    if (currentType._def.innerType) {
      currentType = currentType._def.innerType as ZodTypeWithDef;
    } else {
      break;
    }
  }

  return undefined;
}

/**
 * Format field name to label
 */
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
