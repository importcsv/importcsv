import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "../../../utils/cn"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false)

    React.useEffect(() => {
      setIsChecked(checked || false)
    }, [checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
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
Checkbox.displayName = "Checkbox"

export { Checkbox }