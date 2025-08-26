import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ApiProvider } from "@/components/ApiProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { HelpScoutWidget } from "@/components/HelpScoutWidget";
import { NextAuthProvider } from "@/components/NextAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ImportCSV",
  description: "Admin dashboard for ImportCSV application",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextAuthProvider>
          <PostHogProvider>
            <ApiProvider>
              {children}
              <Toaster />
              <HelpScoutWidget />
            </ApiProvider>
          </PostHogProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
