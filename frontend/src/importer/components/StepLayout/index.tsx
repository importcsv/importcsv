import { h } from 'preact';
import type { ComponentChildren, JSX } from 'preact';
import { designTokens } from '../../theme';
import { cn } from '../../../utils/cn';

interface StepLayoutProps {
  title?: string;
  subtitle?: string;
  children: ComponentChildren;
  headerContent?: ComponentChildren;
  footerContent?: ComponentChildren;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Consistent layout wrapper for all importer steps
 * Ensures uniform spacing, typography, and structure
 */
export default function StepLayout({
  title,
  subtitle,
  children,
  headerContent,
  footerContent,
  showHeader = true,
  showFooter = true,
  className,
  contentClassName,
}: StepLayoutProps) {
  return (
    <div className={cn(designTokens.layout.container, className)}>
      {/* Header Section */}
      {showHeader && (title || headerContent) && (
        <div className={designTokens.layout.header}>
          {title && (
            <div>
              <h2 className={designTokens.typography.title}>{title}</h2>
              {subtitle && (
                <p className={cn(designTokens.typography.subtitle, 'mt-1')}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {headerContent}
        </div>
      )}

      {/* Content Section */}
      <div className={cn(
        designTokens.layout.content, 
        !contentClassName && "px-6 py-4",
        contentClassName
      )}>
        {children}
      </div>

      {/* Footer Section */}
      {showFooter && footerContent && (
        <div className={designTokens.layout.footer}>
          {footerContent}
        </div>
      )}
    </div>
  );
}