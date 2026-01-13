"use client";

import React, { useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  sendEmbedMessage,
  EMBED_MESSAGE_SOURCE,
  type ImportData,
  type EmbedQueryParams,
} from "@/types/embed";

// Dynamically import the CSV Importer component
const CSVImporter = dynamic(
  () =>
    import("@importcsv/react").then((mod) => ({ default: mod.CSVImporter })),
  { ssr: false }
);

interface EmbedClientProps {
  importerKey: string;
  params: EmbedQueryParams;
  targetOrigin?: string; // Optional - only needed if parent wants postMessage data
}

export default function EmbedClient({
  importerKey,
  params,
  targetOrigin,
}: EmbedClientProps) {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Parse query params with validation
  const darkMode = params.theme === "dark";
  // returnData: defaults to true (send data to parent) for backwards compatibility
  const returnData = params.returnData !== "false";
  // hideHeader: defaults to false (show header) for better UX
  const hideHeader = params.hideHeader === "true";
  // Validate primaryColor is a valid 6-char hex before using
  const primaryColor =
    params.primaryColor && /^[0-9a-fA-F]{6}$/.test(params.primaryColor)
      ? `#${params.primaryColor}`
      : "#0284c7";

  // Notify parent when component is ready (only if targetOrigin provided)
  useEffect(() => {
    if (targetOrigin) {
      sendEmbedMessage(
        { source: EMBED_MESSAGE_SOURCE, type: "ready" },
        targetOrigin
      );
    }
  }, [targetOrigin]);

  // Handle errors and notify parent (only if targetOrigin provided)
  useEffect(() => {
    if (!targetOrigin) return;

    const handleError = (event: ErrorEvent) => {
      sendEmbedMessage(
        {
          source: EMBED_MESSAGE_SOURCE,
          type: "error",
          error: { code: "RUNTIME_ERROR", message: event.message },
        },
        targetOrigin
      );
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, [targetOrigin]);

  // Handle import completion
  const handleComplete = useCallback(
    (data: ImportData) => {
      // Only send postMessage if targetOrigin is configured
      if (!targetOrigin) return;

      if (returnData) {
        sendEmbedMessage(
          {
            source: EMBED_MESSAGE_SOURCE,
            type: "complete",
            data,
          },
          targetOrigin
        );
      } else {
        // Send completion without row data for privacy
        sendEmbedMessage(
          {
            source: EMBED_MESSAGE_SOURCE,
            type: "complete",
            data: {
              rows: [],
              columns: [],
              num_rows: data.num_rows,
              num_columns: data.num_columns,
              success: data.success,
              message: data.message,
            },
          },
          targetOrigin
        );
      }
    },
    [returnData, targetOrigin]
  );

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-white"}`}
      style={{ padding: hideHeader ? 0 : undefined }}
    >
      <CSVImporter
        isModal={false}
        darkMode={darkMode}
        primaryColor={primaryColor}
        showDownloadTemplateButton={true}
        skipHeaderRowSelection={false}
        importerKey={importerKey}
        backendUrl={backendUrl}
        onComplete={handleComplete}
      />
    </div>
  );
}
