// frontend/src/headless/upload-trigger.tsx
import { Slot } from './utils/slot';
import { type ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';

export interface UploadTriggerProps {
  asChild?: boolean;
  onClick?: () => void;
  children: ComponentChildren;
  [key: string]: any;
}

/**
 * UploadTrigger component - Trigger file picker
 *
 * @example
 * // Default button
 * <UploadTrigger>Upload CSV</UploadTrigger>
 *
 * @example
 * // With shadcn/ui Button
 * import { Button } from '@/components/ui/button';
 * <UploadTrigger asChild>
 *   <Button variant="primary">Upload CSV</Button>
 * </UploadTrigger>
 *
 * @example
 * // With Material-UI Button
 * import { Button } from '@mui/material';
 * <UploadTrigger asChild>
 *   <Button variant="contained">Upload CSV</Button>
 * </UploadTrigger>
 */
export function UploadTrigger({
  asChild = false,
  children,
  onClick,
  ...props
}: UploadTriggerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // Trigger file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    // Call custom onClick handler if provided
    onClick?.();
  };

  const Comp = asChild ? Slot : 'button';

  return (
    <div>
      <Comp onClick={handleClick} {...props}>
        {children}
      </Comp>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}
