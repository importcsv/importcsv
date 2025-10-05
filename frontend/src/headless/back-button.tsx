// frontend/src/headless/back-button.tsx
import { Slot } from './utils/slot';
import { type ComponentChildren } from 'preact';

export interface BackButtonProps {
  asChild?: boolean;
  onClick?: () => void;
  children: ComponentChildren;
  [key: string]: any;
}

/**
 * BackButton component - Go to previous step
 *
 * @example
 * // Default button
 * <BackButton onClick={goToPreviousStep}>Back</BackButton>
 *
 * @example
 * // With shadcn/ui Button
 * import { Button } from '@/components/ui/button';
 * <BackButton asChild>
 *   <Button variant="outline">Back</Button>
 * </BackButton>
 *
 * @example
 * // With Chakra UI Button
 * import { Button } from '@chakra-ui/react';
 * <BackButton asChild>
 *   <Button colorScheme="gray">Back</Button>
 * </BackButton>
 */
export function BackButton({
  asChild = false,
  children,
  onClick,
  ...props
}: BackButtonProps) {
  const handleClick = () => {
    // Navigate to previous step logic would go here
    onClick?.();
  };

  const Comp = asChild ? Slot : 'button';

  return (
    <Comp onClick={handleClick} {...props}>
      {children}
    </Comp>
  );
}
