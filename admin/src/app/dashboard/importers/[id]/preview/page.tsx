"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";

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
  backendResponse?: any; // Response from direct backend integration
  error?: string; // Error message if processing failed
}

// Dynamically import the CSV Importer component directly from the library
const CSVImporter = dynamic(
  () =>
    import("csv-import-react").then((mod) => ({ default: mod.CSVImporter })),
  { ssr: false },
);

export default function ImporterPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { token, refreshToken, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [importer, setImporter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleImportComplete = async (data: ImportData) => {
    // Process import data
    try {
      // Check if we received a backend response directly from the CSV importer
      if (data.backendResponse) {
        // Successfully processed by the backend
        return;
      }

      // Check if there was an error from the direct integration
      if (data.error) {
        throw new Error(data.error);
      }

      // If no direct backend response, process manually (fallback)
      // Transform data from the library format to the backend format
      const transformedData = {
        validData:
          data.rows
            ?.filter((row: ImportRow) => !row.errors || row.errors.length === 0)
            .map((row: ImportRow) => {
              // Create a simple object with the values
              return row.values;
            }) || [],
        invalidData:
          data.rows
            ?.filter((row: ImportRow) => row.errors && row.errors.length > 0)
            .map((row: ImportRow) => {
              return {
                values: row.values,
                errors: row.errors,
              };
            }) || [],
      };

      // Using fallback API call for data processing

      // CSV data processed successfully - no alert needed
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Error processing import: ${errorMessage}`);
    }
  };

  // Fetch importer details to get the key
  useEffect(() => {
    const fetchImporterDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
          }/api/v1/importers/${params.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch importer details");
        }

        const data = await response.json();
        setImporter(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchImporterDetails();
    }
  }, [params.id, token]);

  if (error)
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link
            href={`/dashboard/importers/${params.id}`}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
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
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link
            href={`/dashboard/importers/${params.id}`}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
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
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link
          href={`/dashboard/importers/${params.id}`}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to importer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {
          <>
            <div className="w-full min-h-[500px]">
              {importer?.key && (
                <CSVImporter
                  isModal={false}
                  darkMode={false}
                  primaryColor="#0284c7"
                  showDownloadTemplateButton={true}
                  skipHeaderRowSelection={false}
                  importerKey={importer.key}
                  onComplete={handleImportComplete}
                />
              )}
            </div>
          </>
        }
      </div>
    </div>
  );
}
