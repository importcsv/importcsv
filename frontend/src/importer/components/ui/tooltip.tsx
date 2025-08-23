import { h } from 'preact';
import { forwardRef } from 'preact/compat'
import type { ComponentChildren } from 'preact';
import { useEffect,useRef,useState } from 'preact/hooks';

import { cn } from "../../../utils/cn"

interface TooltipProps {
  content: ComponentChildren
  children: ComponentChildren
  delayDuration?: number
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const Tooltip = ({ 
  content, 
  children, 
  delayDuration = 200,
  side = 'top',
  className 
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delayDuration)
  }
  
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-1.5 text-sm",
            "bg-gray-900 text-white rounded-md",
            "pointer-events-none whitespace-nowrap",
            "animate-in fade-in-0 zoom-in-95",
            positionClasses[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// For backward compatibility - components that expect the old API
const TooltipProvider = ({ children }: { children: ComponentChildren }) => <>{children}</>
const TooltipRoot = Tooltip
const TooltipTrigger = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
))
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = forwardRef<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }
>(({ children, className, sideOffset, ...props }, ref) => (
  <div ref={ref} className={className} {...props}>{children}</div>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipProvider }
