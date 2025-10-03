import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat'
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../../utils/cn"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const AlertComponent = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref): JSX.Element => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
AlertComponent.displayName = "Alert"

const Alert = AlertComponent as unknown as (props: JSX.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & { ref?: any }) => JSX.Element

const AlertTitleComponent = forwardRef<
  HTMLParagraphElement,
  JSX.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref): JSX.Element => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitleComponent.displayName = "AlertTitle"

const AlertTitle = AlertTitleComponent as unknown as (props: JSX.HTMLAttributes<HTMLHeadingElement> & { ref?: any }) => JSX.Element

const AlertDescriptionComponent = forwardRef<
  HTMLParagraphElement,
  JSX.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref): JSX.Element => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescriptionComponent.displayName = "AlertDescription"

const AlertDescription = AlertDescriptionComponent as unknown as (props: JSX.HTMLAttributes<HTMLParagraphElement> & { ref?: any }) => JSX.Element

export { Alert, AlertTitle, AlertDescription }
