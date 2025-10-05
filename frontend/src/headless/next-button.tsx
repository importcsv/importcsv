// frontend/src/headless/next-button.tsx
import { Slot } from './utils/slot';
import { type ComponentChildren } from 'preact';

export interface NextButtonProps {
  asChild?: boolean;
  onClick?: () => void;
  children: ComponentChildren;
  [key: string]: any;
}

/**
 * NextButton component - Proceed to next step
 *
 * @example
 * // Default button
 * <NextButton onClick={goToNextStep}>Next</NextButton>
 *
 * @example
 * // With shadcn/ui Button
 * import { Button } from '@/components/ui/button';
 * <NextButton asChild>
 *   <Button variant="primary">Next</Button>
 * </NextButton>
 *
 * @example
 * // With Material-UI Button
 * import { Button } from '@mui/material';
 * <NextButton asChild>
 *   <Button variant="contained">Next</Button>
 * </NextButton>
 */
export function NextButton({
  asChild = false,
  children,
  onClick,
  ...props
}: NextButtonProps) {
  const handleClick = () => {
    // Navigate to next step logic would go here
    onClick?.();
  };

  const Comp = asChild ? Slot : 'button';

  return (
    <Comp onClick={handleClick} {...props}>
      {children}
    </Comp>
  );
}
