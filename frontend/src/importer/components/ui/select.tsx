import * as React from "react"
import { cn } from "../../../utils/cn"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  onValueChange?: (value: string) => void
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, placeholder, options = [], onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      // Call both handlers if they exist
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      // Stop focus event from bubbling up to prevent aria-hidden issues
      e.stopPropagation();
      props.onFocus?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLSelectElement>) => {
      // Stop click event from bubbling up
      e.stopPropagation();
      props.onClick?.(e);
    };

    return (
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200",
          "hover:border-gray-400 hover:bg-gray-50",
          "focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          className
        )}
        value={props.value}
        defaultValue={props.defaultValue}
        {...props}
        onChange={handleChange}
        onFocus={handleFocus}
        onClick={handleClick}
      >
        {placeholder && (
          <option value="" className="text-gray-500">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="text-gray-900"
          >
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)

Select.displayName = "Select"

export { Select }