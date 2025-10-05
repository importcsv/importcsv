// frontend/src/headless/index.ts
/**
 * Headless CSV Importer Components
 *
 * Domain logic only - no UI dependencies
 * Works with ANY design system (shadcn/ui, MUI, Chakra, etc.)
 *
 * ## Architecture
 * Following the Radix UI and shadcn/ui pattern:
 * - Headless primitives separate logic from UI
 * - `asChild` pattern enables composition with any design system
 * - Zod schema support for modern type-safe validation
 *
 * @example
 * // Basic usage with Zod schema
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
 * // Using asChild with shadcn/ui components
 * import * as CSV from '@importcsv/react/headless';
 * import { Button } from '@/components/ui/button';
 *
 * <CSV.Root schema={schema} onComplete={handleComplete}>
 *   <CSV.UploadTrigger asChild>
 *     <Button variant="primary">Upload CSV</Button>
 *   </CSV.UploadTrigger>
 *   <CSV.NextButton asChild>
 *     <Button>Next Step</Button>
 *   </CSV.NextButton>
 * </CSV.Root>
 *
 * @example
 * // Using asChild with Material-UI
 * import { Button } from '@mui/material';
 *
 * <CSV.BackButton asChild>
 *   <Button variant="outlined">Back</Button>
 * </CSV.BackButton>
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
