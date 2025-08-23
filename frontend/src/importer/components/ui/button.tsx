import { h } from 'preact';
import { forwardRef } from 'preact/compat'
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../../utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow hover:bg-blue-700 focus-visible:ring-blue-500",
        destructive:
          "bg-red-600 text-white shadow hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
        ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700",
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

// Dark mode styles that will be applied when parent has data-theme="dark"
const darkModeStyles = {
  default: "[&[data-theme='dark']_&]:bg-blue-500 [&[data-theme='dark']_&]:hover:bg-blue-600",
  outline: "[&[data-theme='dark']_&]:border-gray-600 [&[data-theme='dark']_&]:bg-gray-800 [&[data-theme='dark']_&]:text-gray-200 [&[data-theme='dark']_&]:hover:bg-gray-700",
  secondary: "[&[data-theme='dark']_&]:bg-gray-700 [&[data-theme='dark']_&]:text-gray-100 [&[data-theme='dark']_&]:hover:bg-gray-600",
};

export interface ButtonProps
  extends JSX.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    // Check if we're in dark mode by looking for data-theme on any parent
    const isDarkMode = typeof window !== 'undefined' && 
      document.querySelector('[data-theme="dark"]');
    
    // Apply dark mode styles conditionally
    const darkClasses = isDarkMode && variant ? {
      default: 'dark:bg-blue-500 dark:hover:bg-blue-600',
      outline: 'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
      secondary: 'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
      ghost: 'dark:hover:bg-gray-800 dark:hover:text-gray-100',
      link: 'dark:text-blue-400 dark:hover:text-blue-300',
    }[variant as string] : '';
    
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          darkClasses
        )}
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

Button.displayName = "Button"

export { Button, buttonVariants }