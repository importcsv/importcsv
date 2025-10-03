import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat'

import { cn } from "../../../utils/cn"

const Card = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref): JSX.Element => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref): JSX.Element => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<
  HTMLParagraphElement,
  JSX.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref): JSX.Element => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = forwardRef<
  HTMLParagraphElement,
  JSX.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref): JSX.Element => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref): JSX.Element => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref): JSX.Element => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
