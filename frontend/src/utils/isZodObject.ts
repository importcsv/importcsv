import { z } from 'zod';

/**
 * Check if a value is a ZodObject, resilient to multiple Zod copies.
 *
 * `instanceof z.ZodObject` fails when the consumer's Zod and the library's
 * bundled Zod are different copies. Checking `_def.typeName` works across copies.
 */
export function isZodObject(schema: unknown): schema is z.ZodObject<z.ZodRawShape> {
  if (schema instanceof z.ZodObject) return true;
  return (schema as any)?._def?.typeName === 'ZodObject';
}
