// frontend/src/headless/index.ts
/**
 * Headless CSV Importer Components
 *
 * Domain logic only - no UI dependencies
 * Works with ANY design system (shadcn/ui, MUI, Chakra, etc.)
 *
 * @example
 * import * as CSV from '@importcsv/react/headless';
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * <CSV.Root schema={schema} onComplete={handleComplete}>
 *   <CSV.Validator>
 *     {({ errors, validate }) => (
 *       // Your custom UI here
 *     )}
 *   </CSV.Validator>
 * </CSV.Root>
 */

export { Root, useCSV } from './root';
export { Validator } from './validator';

// Export types for TypeScript users
export type {
  Column,
  ValidationError,
  CSVContextValue,
  RootProps,
  ValidatorProps,
  ValidatorChildProps
} from './types';

// Export utilities
export { zodSchemaToColumns } from './utils/zodSchemaToColumns';
