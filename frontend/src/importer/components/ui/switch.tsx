import * as React from "react"

import { cn } from "../../../utils/cn"

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onChange, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      
      // Call both handlers if they exist
      onCheckedChange?.(newChecked)
      onChange?.(e)
    }

    return (
      <label className={cn(
        "relative inline-flex items-center cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div className={cn(
          "w-11 h-6 bg-gray-200 rounded-full",
          "peer-checked:bg-blue-600",
          "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2",
          "transition-colors duration-200",
          "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
          "after:bg-white after:rounded-full after:h-5 after:w-5",
          "after:transition-transform after:duration-200",
          "peer-checked:after:translate-x-5",
          className
        )} />
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }