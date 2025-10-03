import { isValidElement } from "preact/compat";
import type { ComponentChildren, ComponentChild } from 'preact';

export default function getStringLengthOfChildren(children: ComponentChildren): number {
  if (typeof children === "string") return children.length;

  if (Array.isArray(children)) {
    let sum = 0;
    for (const child of children) {
      sum += getStringLengthOfChildren(child);
    }
    return sum;
  }

  // If child is a Preact element, process its children recursively
  if (children && isValidElement(children) && typeof children === 'object' && 'props' in children) {
    return getStringLengthOfChildren(children.props?.children);
  }

  // If none of the above, return 0
  return 0;
}
