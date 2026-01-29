import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { cn } from 'fumadocs-ui/utils/cn';
import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.importcsv.com'),
  title: {
    default: 'ImportCSV Documentation',
    template: '%s | ImportCSV',
  },
  description: 'AI-powered CSV importer for React apps',
  openGraph: {
    type: 'website',
    siteName: 'ImportCSV Documentation',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
  weight: 'variable',
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  weight: 'variable',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html 
      className={cn(
        'touch-manipulation font-sans antialiased',
        sans.variable,
        mono.variable
      )}
      lang="en" 
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider theme={{ forcedTheme: 'dark' }}>{children}</RootProvider>
      </body>
    </html>
  );
}
