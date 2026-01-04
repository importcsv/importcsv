import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat'
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../../utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-[#121212]",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow hover:bg-blue-700 focus-visible:ring-blue-500",
        destructive:
          "bg-red-600 text-white shadow hover:bg-red-700 focus-visible:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600",
        outline:
          "border border-gray-300 dark:border-[#3a3a3a] bg-white dark:bg-transparent text-gray-700 dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-[#242424] focus-visible:ring-gray-500",
        secondary:
          "bg-gray-100 dark:bg-[#242424] text-gray-900 dark:text-[#e5e5e5] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] focus-visible:ring-gray-500",
        ghost: "hover:bg-gray-100 dark:hover:bg-[#1e1e1e] hover:text-gray-900 dark:hover:text-white focus-visible:ring-gray-500",
        link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline hover:text-blue-700 dark:hover:text-blue-300",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends JSX.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  type?: 'button' | 'submit' | 'reset'
  isLoading?: boolean
  disabled?: boolean
}

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, type, children, ...props }, ref): JSX.Element => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

ButtonComponent.displayName = "Button"

// Type assertion to fix forwardRef return type issue
const Button = ButtonComponent as unknown as (props: ButtonProps & { ref?: any }) => JSX.Element

export { Button, buttonVariants }
