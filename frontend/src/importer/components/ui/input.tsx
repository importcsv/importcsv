import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat'

import { cn } from "../../../utils/cn"

export interface InputProps
  extends JSX.HTMLAttributes<HTMLInputElement> {
  type?: string
}

const InputComponent = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref): JSX.Element => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
InputComponent.displayName = "Input"

const Input = InputComponent as unknown as (props: InputProps & { ref?: any }) => JSX.Element

export { Input }
