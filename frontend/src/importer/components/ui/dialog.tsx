import { createContext, h } from 'preact';
import { forwardRef } from 'preact/compat';
import type { ComponentChildren, JSX } from 'preact';
import { useContext, useEffect, useRef, useImperativeHandle } from 'preact/hooks';
import { X } from "lucide-react"

import { cn } from "../../../utils/cn"

interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ComponentChildren
}

const Dialog = ({ open = false, onOpenChange, children }: DialogProps): JSX.Element => {
  const ProviderComponent = DialogContext.Provider as any;
  return (
    <ProviderComponent value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </ProviderComponent>
  );
}

const DialogTrigger = forwardRef<
  HTMLButtonElement,
  JSX.HTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const context = useContext(DialogContext)
  
  const handleClick = (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context?.onOpenChange(true)
  }
  
  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

interface DialogContentProps extends JSX.HTMLAttributes<HTMLDialogElement> {
  onClose?: () => void
}

const DialogContentComponent = forwardRef<HTMLDialogElement, DialogContentProps>(
  ({ className, children, onClose, ...props }, ref): JSX.Element => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const context = useContext(DialogContext)

    // Combine refs
    useImperativeHandle(ref, () => dialogRef.current!)

    useEffect(() => {
      const dialog = dialogRef.current
      if (!dialog) return

      if (context?.open) {
        dialog.showModal()
      } else {
        dialog.close()
      }
    }, [context?.open])

    const handleClose = () => {
      context?.onOpenChange(false)
      onClose?.()
    }

    // Handle escape key and backdrop click
    const handleCancel = (e: JSX.TargetedEvent) => {
      e.preventDefault()
      handleClose()
    }

    const handleBackdropClick = (e: JSX.TargetedMouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        handleClose()
      }
    }

    return (
      <dialog
        ref={dialogRef}
        className={cn(
          "fixed p-0 rounded-lg border bg-white shadow-lg",
          "w-full max-w-lg",
          "backdrop:bg-black/50",
          className
        )}
        onCancel={handleCancel}
        onClick={handleBackdropClick}
        style={{ maxHeight: '90vh' }}
        {...props}
      >
        <div className="relative p-6 overflow-auto" style={{ maxHeight: '90vh' }}>
          {children}
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={handleClose}
            type="button"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </dialog>
    )
  }
)
DialogContentComponent.displayName = "DialogContent"

const DialogContent = DialogContentComponent as unknown as (props: DialogContentProps & { ref?: any }) => JSX.Element

const DialogHeader = ({
  className,
  ...props
}: JSX.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: JSX.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitleComponent = forwardRef<
  HTMLHeadingElement,
  JSX.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref): JSX.Element => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitleComponent.displayName = "DialogTitle"

const DialogTitle = DialogTitleComponent as unknown as (props: JSX.HTMLAttributes<HTMLHeadingElement> & { ref?: any }) => JSX.Element

const DialogDescriptionComponent = forwardRef<
  HTMLParagraphElement,
  JSX.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref): JSX.Element => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
))
DialogDescriptionComponent.displayName = "DialogDescription"

const DialogDescription = DialogDescriptionComponent as unknown as (props: JSX.HTMLAttributes<HTMLParagraphElement> & { ref?: any }) => JSX.Element

// For backward compatibility
const DialogPortal = ({ children }: { children: ComponentChildren }) => children
const DialogOverlay = () => null
const DialogClose = DialogTrigger

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
