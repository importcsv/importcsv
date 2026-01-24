"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export function CrispWidget() {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!websiteId) {
      if (process.env.NODE_ENV === "development") {
        console.log("Crisp: No website ID configured, skipping initialization");
      }
      return;
    }

    // Skip in development unless explicitly enabled
    // if (process.env.NODE_ENV !== "production") {
    //   if (process.env.NODE_ENV === "development") {
    //     console.log("Crisp: Skipping initialization in development");
    //   }
    //   return;
    // }

    // Initialize Crisp
    if (typeof window !== "undefined") {
      try {
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = websiteId;

        const script = document.createElement("script");
        script.src = "https://client.crisp.chat/l.js";
        script.async = true;

        script.onerror = () => {
          console.error("Failed to load Crisp widget");
        };

        document.head.appendChild(script);

        return () => {
          const existingScript = document.querySelector(
            'script[src="https://client.crisp.chat/l.js"]'
          );
          if (existingScript) {
            existingScript.remove();
          }
        };
      } catch (error) {
        console.error("Error setting up Crisp:", error);
      }
    }
  }, []);

  return null;
}
