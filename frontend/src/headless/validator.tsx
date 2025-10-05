// frontend/src/headless/validator.tsx
import { useState, useCallback } from 'preact/hooks';
import { useCSV } from './root';
import type { ValidationError, ValidatorProps } from './types';

/**
 * CSV Validator component with Zod integration
 *
 * Provides validation functionality using Zod schemas or custom validation logic
 *
 * @example
 * <CSV.Validator>
 *   {({ errors, validate, isValidating }) => (
 *     <div>
 *       <button onClick={validate} disabled={isValidating}>
 *         {isValidating ? 'Validating...' : 'Validate Data'}
 *       </button>
 *       {errors.length > 0 && (
 *         <div>
 *           <h3>Validation Errors:</h3>
 *           {errors.map((error, i) => (
 *             <div key={i}>
 *               Row {error.row + 1}, Column {error.column}: {error.message}
 *             </div>
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   )}
 * </CSV.Validator>
 */
export function Validator({ children }: ValidatorProps) {
  const ctx = useCSV();
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validates all rows using the Zod schema
   * Returns array of validation errors
   */
  const validate = useCallback(async (): Promise<ValidationError[]> => {
    setIsValidating(true);
    const validationErrors: ValidationError[] = [];

    try {
      if (ctx.schema && ctx.data?.rows) {
        ctx.data.rows.forEach((row: any, index: number) => {
          const result = ctx.schema!.safeParse(row);
          if (!result.success) {
            // Convert Zod errors to our ValidationError format
            result.error.issues.forEach((issue) => {
              validationErrors.push({
                row: index,
                column: issue.path.join('.'),
                message: issue.message
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setErrors(validationErrors);
      setIsValidating(false);
    }

    return validationErrors;
  }, [ctx.schema, ctx.data]);

  return children({ errors, validate, isValidating });
}
