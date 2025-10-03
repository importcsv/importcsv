import { h } from 'preact';
import { forwardRef } from 'preact/compat'
import type { JSX } from 'preact';
import { X } from "lucide-react"

import { cn } from "../../../utils/cn"

export interface ToastProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
  onClose?: () => void
}

const ToastComponent = forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', onClose, children, ...props }, ref): JSX.Element => {
    const variantClasses = {
      default: 'bg-white border-gray-200 text-gray-900',
      destructive: 'bg-red-600 border-red-600 text-white',
    }

    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=open]:sm:slide-in-from-bottom-full",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2",
              variant === 'destructive'
                ? "focus:ring-red-300 hover:bg-red-500"
                : "focus:ring-gray-500 hover:bg-gray-100"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
ToastComponent.displayName = "Toast"

const Toast = ToastComponent as unknown as (props: ToastProps & { ref?: any }) => JSX.Element

const ToastActionComponent = forwardRef<
  HTMLButtonElement,
  JSX.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref): JSX.Element => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastActionComponent.displayName = "ToastAction"

const ToastAction = ToastActionComponent as unknown as (props: JSX.HTMLAttributes<HTMLButtonElement> & { ref?: any }) => JSX.Element

const ToastCloseComponent = forwardRef<
  HTMLButtonElement,
  JSX.HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref): JSX.Element => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
))
ToastCloseComponent.displayName = "ToastClose"

const ToastClose = ToastCloseComponent as unknown as (props: JSX.HTMLAttributes<HTMLButtonElement> & { ref?: any }) => JSX.Element

const ToastTitleComponent = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref): JSX.Element => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitleComponent.displayName = "ToastTitle"

const ToastTitle = ToastTitleComponent as unknown as (props: JSX.HTMLAttributes<HTMLDivElement> & { ref?: any }) => JSX.Element

const ToastDescriptionComponent = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref): JSX.Element => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescriptionComponent.displayName = "ToastDescription"

const ToastDescription = ToastDescriptionComponent as unknown as (props: JSX.HTMLAttributes<HTMLDivElement> & { ref?: any }) => JSX.Element

type ToastActionElement = JSX.Element

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
  type ToastActionElement,
}
