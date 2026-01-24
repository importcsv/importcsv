"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { importersApi } from "@/utils/apiClient";

// Define types for our schema and data
interface ImporterField {
  name: string;
  key?: string;
  required?: boolean;
}

interface ImporterSchema {
  id: string;
  name: string;
  fields: ImporterField[];
}

interface ImportRow {
  values: Record<string, any>;
  errors?: Array<{ message: string }>;
}

interface ImportData {
  rows: ImportRow[];
  columns: Array<{ name: string }>;
  num_rows: number;
  num_columns: number;
  success?: boolean; // Whether the import was successful
  message?: string; // Message from the backend (success or error)
  backendResponse?: any; // Response from direct backend integration
  error?: string; // Error message if processing failed
}

// Dynamically import the CSV Importer component directly from the library
const CSVImporter = dynamic(
  () =>
    import("@importcsv/react").then((mod) => ({ default: mod.CSVImporter })),
  { ssr: false },
);

// Separate component for the CSVImporter to prevent re-renders
function ImporterComponent({ importerKey, onComplete }: { importerKey: string, onComplete: (data: ImportData) => void }) {
  // Get backend URL from environment variable (defaults to localhost for local dev)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  // Using useMemo to ensure the component doesn't re-render unnecessarily
  return useMemo(() => (
    <CSVImporter
      isModal={false}
      darkMode={false}
      primaryColor="#0284c7"
      showDownloadTemplateButton={true}
      skipHeaderRowSelection={false}
      importerKey={importerKey}
      backendUrl={backendUrl}
      onComplete={onComplete}
    />
  ), [importerKey, backendUrl, onComplete]);
}

export default function ImporterPreviewPage() {
  const params = useParams();
  const { isAuthenticated } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [importer, setImporter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Use useCallback to create a stable reference to the callback function
  const handleImportComplete = useCallback(async (data: ImportData) => {
    // Handle import completion - success/failure is handled by the CSVImporter component
  }, []);

  // Fetch importer details to get the key
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    setLoading(true);

    importersApi.getImporter(params.id as string)
      .then(data => {
        if (isMounted) setImporter(data);
      })
      .catch(err => {
        if (isMounted) setError(err instanceof Error ? err.message : "An error occurred");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [params.id, isAuthenticated]);

  if (error)
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link
            href={`/importers/${params.id}`}
            className="flex items-center text-sm text-zinc-500 hover:text-zinc-700"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to importer
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link
            href={`/importers/${params.id}`}
            className="flex items-center text-sm text-zinc-500 hover:text-zinc-700"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to importer
          </Link>
        </div>
        <div className="text-center py-10">
          <p>Loading importer details...</p>
        </div>
      </div>
    );

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/importers/${params.id}`}
          className="flex items-center text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to importer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="w-full min-h-[500px]">
          {importer?.key && (
            <ImporterComponent
              importerKey={importer.key}
              onComplete={handleImportComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
