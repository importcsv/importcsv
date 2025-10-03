import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat'
import { useEffect,useState } from 'preact/hooks';
import { Check } from "lucide-react"

import { cn } from "../../../utils/cn"

export interface CheckboxProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  onChange?: (e: JSX.TargetedEvent<HTMLInputElement>) => void
}

const CheckboxComponent = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref): JSX.Element => {
    const [isChecked, setIsChecked] = useState(checked || false)

    useEffect(() => {
      setIsChecked(checked || false)
    }, [checked])

    const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
      if (!e.target) return;
      const newChecked = (e.target as HTMLInputElement).checked
      setIsChecked(newChecked)

      // Call both handlers if they exist
      onCheckedChange?.(newChecked)
      onChange?.(e)
    }

    return (
      <div className="relative inline-block">
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className={cn(
            "peer sr-only",
            className
          )}
          {...props}
        />
        <div className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white",
          "peer-checked:bg-blue-600 peer-checked:border-blue-600",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          "flex items-center justify-center cursor-pointer"
        )}>
          {isChecked && (
            <Check className="h-3 w-3 text-white" />
          )}
        </div>
      </div>
    )
  }
)
CheckboxComponent.displayName = "Checkbox"

const Checkbox = CheckboxComponent as unknown as (props: CheckboxProps & { ref?: any }) => JSX.Element

export { Checkbox }
