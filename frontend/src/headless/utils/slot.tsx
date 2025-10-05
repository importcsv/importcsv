// frontend/src/headless/utils/slot.tsx
import { cloneElement, toChildArray, type ComponentChildren, type VNode } from 'preact';

interface SlotProps {
  children: ComponentChildren;
  onClick?: (...args: any[]) => void;
  className?: string;
  [key: string]: any;
}

/**
 * Slot component for Preact - enables composition pattern (asChild)
 *
 * Merges props from parent to child element, similar to Radix UI's Slot
 *
 * @example
 * const Comp = asChild ? Slot : 'button';
 * <Comp onClick={handleClick} className="btn">
 *   <CustomButton>Click me</CustomButton>
 * </Comp>
 */
export function Slot({ children, ...props }: SlotProps): VNode<any> | null {
  const childrenArray = toChildArray(children);

  if (childrenArray.length === 0) {
    return null;
  }

  // Get the first child element
  const child = childrenArray[0];

  // If child is not a VNode, return null (strings/numbers not supported)
  if (!child || typeof child !== 'object' || !('type' in child)) {
    return null;
  }

  // Type-safe access to child props
  const childProps = (child as VNode<any>).props || {};

  // Merge onClick handlers
  const mergedOnClick = (...args: any[]) => {
    // Call child's onClick first
    if (childProps.onClick && typeof childProps.onClick === 'function') {
      childProps.onClick(...args);
    }
    // Then call parent's onClick
    if (props.onClick && typeof props.onClick === 'function') {
      props.onClick(...args);
    }
  };

  // Merge className
  const childClassName = typeof childProps.className === 'string' ? childProps.className : '';
  const parentClassName = typeof props.className === 'string' ? props.className : '';
  const mergedClassName = [childClassName, parentClassName].filter(Boolean).join(' ');

  // Merge all props
  const mergedProps = {
    ...props,
    ...childProps,
    onClick: mergedOnClick,
    className: mergedClassName || undefined
  };

  // Clone the child with merged props
  return cloneElement(child as VNode<any>, mergedProps);
}
