/**
 * Headless CSV Importer Components
 *
 * Domain logic primitives with no UI dependencies.
 * Works with any design system (shadcn/ui, MUI, Chakra, etc.)
 *
 * @example
 * // With Zod schema
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
 *
 * @example
 * // With design system components (asChild pattern)
 * import { Button } from '@/components/ui/button';
 *
 * <CSV.UploadTrigger asChild>
 *   <Button variant="primary">Upload CSV</Button>
 * </CSV.UploadTrigger>
 */

export { Root, useCSV } from './root';
export { Validator } from './validator';
export { UploadTrigger } from './upload-trigger';
export { NextButton } from './next-button';
export { BackButton } from './back-button';
export { SubmitButton } from './submit-button';

// Export types for TypeScript users
export type {
  Column,
  ValidationError,
  CSVContextValue,
  RootProps,
  ValidatorProps,
  ValidatorChildProps
} from './types';

export type { UploadTriggerProps } from './upload-trigger';
export type { NextButtonProps } from './next-button';
export type { BackButtonProps } from './back-button';
export type { SubmitButtonProps } from './submit-button';

// Export utilities
export { zodSchemaToColumns } from './utils/zodSchemaToColumns';
export { Slot } from './utils/slot';
