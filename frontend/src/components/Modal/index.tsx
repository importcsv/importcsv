import { useEffect, useRef, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { ComponentChildren } from 'preact';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ComponentChildren;
  closeOnOutsideClick?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
}

const Modal = ({
  isOpen,
  onClose,
  children,
  closeOnOutsideClick = true,
  className = '',
  overlayClassName = '',
  contentClassName = ''
}: ModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;

    const modalElement = contentRef.current;
    const focusableElements = modalElement.querySelectorAll(focusableElementsString);
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // If there are no focusable elements, prevent tab
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    modalElement.addEventListener('keydown', handleTabKey);

    // Store current active element and focus first focusable element
    previousActiveElement.current = document.activeElement;

    // Focus the modal content or first focusable element
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      modalElement.focus();
    }

    return () => {
      modalElement.removeEventListener('keydown', handleTabKey);
      // Restore focus to previous element
      if (previousActiveElement.current && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Check if scrollbar is visible
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    // Prevent layout shift by adding padding equal to scrollbar width
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnOutsideClick, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`csv-importer-modal-overlay ${overlayClassName}`}
      onClick={handleBackdropClick}
      role="presentation"
      aria-hidden="true"
    >
      <div
        ref={contentRef}
        className={`csv-importer-modal-content ${contentClassName} ${className}`}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  // Use createPortal to render modal at document.body
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
};

export default Modal;