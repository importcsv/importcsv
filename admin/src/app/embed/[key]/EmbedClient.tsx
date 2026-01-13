"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  sendEmbedMessage,
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
}

export default function EmbedClient({ importerKey, params }: EmbedClientProps) {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Parse query params
  const darkMode = params.theme === "dark";
  const returnData = params.returnData !== "false"; // Default to true
  const hideHeader = params.hideHeader === "true";
  const primaryColor = params.primaryColor
    ? `#${params.primaryColor}`
    : "#0284c7";

  // Notify parent when component is ready
  useEffect(() => {
    sendEmbedMessage({ source: "importcsv-embed", type: "ready" });
  }, []);

  // Handle import completion
  const handleComplete = useCallback(
    (data: ImportData) => {
      if (returnData) {
        sendEmbedMessage({
          source: "importcsv-embed",
          type: "complete",
          data,
        });
      } else {
        // Send completion without data
        sendEmbedMessage({
          source: "importcsv-embed",
          type: "complete",
          data: {
            rows: [],
            columns: [],
            num_rows: data.num_rows,
            num_columns: data.num_columns,
            success: data.success,
            message: data.message,
          },
        });
      }
    },
    [returnData]
  );

  // Memoize the importer to prevent re-renders
  const importer = useMemo(
    () => (
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
    ),
    [importerKey, backendUrl, darkMode, primaryColor, handleComplete]
  );

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-white"}`}
      style={{ padding: hideHeader ? 0 : undefined }}
    >
      {importer}
    </div>
  );
}
