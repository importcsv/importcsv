/**
 * Transformation stage definitions for smart auto-detection
 * 
 * Pre-validation transformations clean and normalize data before validation rules are applied.
 * Post-validation transformations enrich and format data after validation passes.
 */

/**
 * Transformations that should run BEFORE validation
 * These typically clean or normalize input to prepare it for validation
 */
export const PRE_VALIDATION_TRANSFORMS = [
  'trim',                 // Remove whitespace before checking required fields or patterns
  'uppercase',            // Normalize case before regex/pattern validation
  'lowercase',            // Normalize case before email or case-sensitive validation
  'remove_special_chars', // Clean input before validation
  'normalize_phone',      // Standardize phone format before phone validation
  'normalize_date',       // Parse and normalize dates before date validation
] as const;

/**
 * Transformations that should run AFTER validation
 * These typically format, enrich, or provide defaults for valid data
 */
export const POST_VALIDATION_TRANSFORMS = [
  'default',     // Add default values only for valid empty fields
  'capitalize',  // Format text for display purposes
  'replace',     // Content modifications after validation
  'custom',      // Business logic transformations (unless explicitly marked as pre)
] as const;

export type PreValidationTransform = typeof PRE_VALIDATION_TRANSFORMS[number];
export type PostValidationTransform = typeof POST_VALIDATION_TRANSFORMS[number];

/**
 * Check if a transformation type should run before validation
 */
export function isPreValidationTransform(type: string): boolean {
  return (PRE_VALIDATION_TRANSFORMS as readonly string[]).includes(type);
}

/**
 * Check if a transformation type should run after validation
 */
export function isPostValidationTransform(type: string): boolean {
  return (POST_VALIDATION_TRANSFORMS as readonly string[]).includes(type);
}