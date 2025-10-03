import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface RootProps {
  children?: ComponentChildren;
  className?: string;
  primaryColor?: string;
}

const ROOT_CLASS = 'importcsv';

const Root = forwardRef<HTMLDivElement, RootProps>(function Root(
  { children, className = '', primaryColor },
  forwardedRef
) {
  // Use a local ref if no ref is forwarded
  const localRef = useRef<HTMLDivElement>(null);
  const ref = forwardedRef || localRef;
  useEffect(() => {
    // Add class to any portal roots (for dropdowns, modals, etc)
    // This ensures our scoped CSS applies to portal content
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as HTMLElement).id?.includes('portal')
          ) {
            (node as HTMLElement).classList.add(ROOT_CLASS);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: false });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Apply primary color CSS variables if provided
    const element = (ref as any)?.current || localRef.current;
    if (primaryColor && element) {
      element.style.setProperty('--color-primary', primaryColor);
      // You can implement color darkening logic here if needed
      element.style.setProperty('--color-primary-hover', primaryColor);
    }
  }, [primaryColor]);

  // Just return a simple wrapper that ensures CSS isolation
  // The importcsv class is already added at the top level by CSVImporter
  return (
    <div
      ref={localRef}
      className={`${className} min-h-0 w-full overflow-auto bg-white h-full`}
      style={{ isolation: 'isolate' }}
    >
      {children}
    </div>
  );
}) as any;

export default Root;