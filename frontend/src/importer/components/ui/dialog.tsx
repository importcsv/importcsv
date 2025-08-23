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

const Dialog = ({ open = false, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  )
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

const DialogContent = forwardRef<HTMLDialogElement, DialogContentProps>(
  ({ className, children, onClose, ...props }, ref) => {
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
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: JSX.HTMLAttributes<HTMLDivElement>) => (
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
}: JSX.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = forwardRef<
  HTMLHeadingElement,
  JSX.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = forwardRef<
  HTMLParagraphElement,
  JSX.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

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
