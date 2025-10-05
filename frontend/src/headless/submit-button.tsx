// frontend/src/headless/submit-button.tsx
import { Slot } from './utils/slot';
import { type ComponentChildren } from 'preact';
import { useCSV } from './root';

export interface SubmitButtonProps {
  asChild?: boolean;
  onClick?: () => void;
  children: ComponentChildren;
  [key: string]: any;
}

/**
 * SubmitButton component - Submit final data
 *
 * @example
 * // Default button
 * <SubmitButton>Submit</SubmitButton>
 *
 * @example
 * // With shadcn/ui Button
 * import { Button } from '@/components/ui/button';
 * <SubmitButton asChild>
 *   <Button variant="primary">Submit</Button>
 * </SubmitButton>
 *
 * @example
 * // With Material-UI Button
 * import { Button } from '@mui/material';
 * <SubmitButton asChild>
 *   <Button variant="contained" type="submit">Submit</Button>
 * </SubmitButton>
 */
export function SubmitButton({
  asChild = false,
  children,
  onClick,
  ...props
}: SubmitButtonProps) {
  const context = useCSV();

  const handleClick = () => {
    // Trigger onComplete callback from context
    if (context?.data?.rows) {
      context.onComplete(context.data.rows);
    }
    // Call custom onClick handler if provided
    onClick?.();
  };

  const Comp = asChild ? Slot : 'button';

  return (
    <Comp onClick={handleClick} {...props}>
      {children}
    </Comp>
  );
}
