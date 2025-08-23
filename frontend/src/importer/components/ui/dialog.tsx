import * as React from "react"
import { X } from "lucide-react"

import { cn } from "../../../utils/cn"

interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined)

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open = false, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const context = React.useContext(DialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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

interface DialogContentProps extends React.HTMLAttributes<HTMLDialogElement> {
  onClose?: () => void
}

const DialogContent = React.forwardRef<HTMLDialogElement, DialogContentProps>(
  ({ className, children, onClose, ...props }, ref) => {
    const dialogRef = React.useRef<HTMLDialogElement>(null)
    const context = React.useContext(DialogContext)
    
    // Combine refs
    React.useImperativeHandle(ref, () => dialogRef.current!)
    
    React.useEffect(() => {
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
    const handleCancel = (e: React.SyntheticEvent) => {
      e.preventDefault()
      handleClose()
    }
    
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
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
}: React.HTMLAttributes<HTMLDivElement>) => (
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
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
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

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

// For backward compatibility
const DialogPortal = ({ children }: { children: React.ReactNode }) => children
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