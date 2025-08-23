import React, { useRef } from 'react';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import { importcsvStyles } from '../../../styles';
import { darkenColor } from '../../utils/colorUtils';

/**
 * IframeWrapper Component
 *
 * Provides complete CSS isolation for the importer by rendering content inside an iframe.
 * This follows industry best practices used by embedded SaaS tools like TableFlow,
 * Intercom, Zendesk, and Stripe.
 *
 * Key benefits:
 * - Complete CSS isolation from parent application
 * - Prevents parent styles (e.g., container max-width) from affecting the importer
 * - Only copies external stylesheets from parent document into iframe
 * - Maintains React context and functionality through react-frame-component
 * - Prevents style leakage between iframe and parent document
 *
 * @param children - React components to render inside the iframe
 * @param className - Optional CSS class for the iframe element
 */

interface IframeWrapperProps {
  children: React.ReactNode;
  className?: string;
  primaryColor?: string;
}

/**
 * IframeContent Component
 *
 * Separate component to handle iframe content with hooks properly.
 * This is required to follow React's rules of hooks - hooks cannot be
 * called conditionally or inside callbacks.
 */
function IframeContent({
  children,
  document,
  window: iframeWindow,
  primaryColor
}: {
  children: React.ReactNode;
  document?: Document;
  window?: Window;
  primaryColor?: string;
}) {
  React.useEffect(() => {
    if (!document || !iframeWindow) return;

    // Get parent window reference safely
    const parentWindow = iframeWindow.parent || window;
    const parentDocument = parentWindow.document;

    // Only copy external stylesheets (not inline styles to prevent leakage)
    const parentLinks = Array.from(parentDocument.querySelectorAll('link[rel="stylesheet"]'));
    parentLinks.forEach((linkElement: any) => {
      if (!document.querySelector(`link[href="${linkElement.href}"]`)) {
        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = linkElement.href;
        document.head.appendChild(newLink);
      }
    });

    // Inject the library's own bundled CSS directly into the iframe.
    if (importcsvStyles && !document.querySelector('style[data-importcsv-inline]')) {
      const s = document.createElement('style');
      s.setAttribute('data-importcsv-inline', 'true');
      s.appendChild(document.createTextNode(importcsvStyles));
      document.head.appendChild(s);
    }

    // Important: Do NOT mirror arbitrary inline styles from parent
    
    // Apply primary color CSS variables to the iframe's root element
    if (primaryColor && document.documentElement) {
      document.documentElement.style.setProperty('--color-primary', primaryColor);
      document.documentElement.style.setProperty('--color-primary-hover', darkenColor(primaryColor, 20));
      
      // Also set on body for good measure
      if (document.body) {
        document.body.style.setProperty('--color-primary', primaryColor);
        document.body.style.setProperty('--color-primary-hover', darkenColor(primaryColor, 20));
      }
    }
  }, [document, iframeWindow, primaryColor]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {children}
    </div>
  );
}

export default function IframeWrapper({ children, className = '', primaryColor }: IframeWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initial HTML with all necessary styles including Tailwind
  const initialContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          /* CSS Variables for Tailwind colors */
          :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 222.2 84% 4.9%;
            --primary: 221.2 83.2% 53.3%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96.1%;
            --secondary-foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96.1%;
            --accent-foreground: 222.2 47.4% 11.2%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 210 40% 98%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --ring: 221.2 83.2% 53.3%;
            --radius: 0.5rem;
          }

          /* Tailwind utility classes for components */
          .bg-primary {
            background-color: hsl(var(--primary));
          }

          .bg-input {
            background-color: hsl(var(--input));
          }

          .bg-background {
            background-color: hsl(var(--background));
          }

          .bg-popover {
            background-color: hsl(var(--popover));
          }

          .text-popover-foreground {
            color: hsl(var(--popover-foreground));
          }

          .ring-ring {
            --tw-ring-color: hsl(var(--ring));
          }

          .ring-offset-background {
            --tw-ring-offset-color: hsl(var(--background));
          }

          /* Transitions and transforms */
          .transition-colors {
            transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
          }

          .transition-transform {
            transition-property: transform;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
          }

          .translate-x-0 {
            transform: translateX(0);
          }

          .translate-x-5 {
            transform: translateX(1.25rem);
          }

          /* Focus states */
          .focus-visible\:outline-none:focus-visible {
            outline: 2px solid transparent;
            outline-offset: 2px;
          }

          .focus-visible\:ring-2:focus-visible {
            --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
            --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
            box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
          }

          .focus-visible\:ring-offset-2:focus-visible {
            --tw-ring-offset-width: 2px;
          }

          /* Data attribute selectors for Radix UI components */
          [data-state="checked"] {
            background-color: hsl(var(--primary));
          }

          [data-state="unchecked"] {
            background-color: hsl(var(--input));
          }

          [data-state="checked"] .translate-x-5 {
            transform: translateX(1.25rem);
          }

          [data-state="unchecked"] .translate-x-0 {
            transform: translateX(0);
          }

          /* Disabled states */
          .disabled\:cursor-not-allowed:disabled {
            cursor: not-allowed;
          }

          .disabled\:opacity-50:disabled {
            opacity: 0.5;
          }

          /* Additional utility classes */
          .shadow-lg {
            --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
          }

          .ring-0 {
            --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
            --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
            box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
          }

          /* Reset styles to ensure clean slate */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            width: 100%;
            min-height: 100%;
            height: auto;
            overflow: visible;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          /* Ensure the root div takes full space */
          body > div {
            width: 100%;
            min-height: 100%;
            height: auto;
          }

          /* Ensure content can expand horizontally without iframe scrolling */
          #mountHere {
            width: 100%;
            min-width: 0;
            overflow: visible;
          }
        </style>
      </head>
      <body>
        <div id="mountHere"></div>
      </body>
    </html>
  `;

  return (
    <Frame
      ref={iframeRef}
      className={className}
      initialContent={initialContent}
      mountTarget="#mountHere"
      head={[
        // Ensure importer styles are present at first paint inside the iframe
        // react-frame-component will inject these into <head>
        <style key="importcsv-inline" data-importcsv-inline={true as any} dangerouslySetInnerHTML={{ __html: importcsvStyles || '' }} />,
      ]}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        maxHeight: '100vh',
        border: 'none',
        display: 'block'
      }}
      // Prevent focus-related aria issues by handling focus events
      onFocus={(e: any) => {
        // Prevent the event from bubbling up to parent document
        e.stopPropagation();
      }}
    >
      <FrameContextConsumer>
        {({ document, window }) => (
          <IframeContent document={document} window={window} primaryColor={primaryColor}>
            {children}
          </IframeContent>
        )}
      </FrameContextConsumer>
    </Frame>
  );
}