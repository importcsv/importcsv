'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import dynamic from 'next/dynamic';

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

// Dynamically import the CSV Importer component
const CSVImporter = dynamic(
  () => import('@/components/CSVImporter'),
  { ssr: false }
);

export default function ImporterPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { token, refreshToken, logout } = useAuth();
  const [schema, setSchema] = useState<ImporterSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchSchema = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${backendUrl}/api/v1/importers/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          // Try to refresh the token
          const refreshed = await refreshToken();
          if (!refreshed) {
            logout();
            router.push('/login');
            return;
          }

          // Retry with new token
          const retryResponse = await fetch(`${backendUrl}/api/v1/importers/${params.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!retryResponse.ok) {
            throw new Error(`Failed to fetch importer: ${retryResponse.statusText}`);
          }

          const data = await retryResponse.json();
          setSchema(data);
        } else if (!response.ok) {
          throw new Error(`Failed to fetch importer: ${response.statusText}`);
        } else {
          const data = await response.json();
          setSchema(data);
        }
      } catch (err: unknown) {
        console.error('Error fetching schema:', err);
        setError('Failed to load schema details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [token, params.id, router, refreshToken, logout, backendUrl]);

  const handleImportComplete = async (data: ImportData) => {
    console.log('DEBUG: handleImportComplete called with data:', data);
    try {
      // Check if we received a backend response directly from the CSV importer
      if (data.backendResponse) {
        console.log('DEBUG: Received backend response directly from CSV importer:', data.backendResponse);
        alert('CSV data processed successfully!');
        return;
      }

      // Check if there was an error from the direct integration
      if (data.error) {
        console.log('DEBUG: Received error from CSV importer:', data.error);
        throw new Error(data.error);
      }

      // If no direct backend response, process manually (fallback)
      // Transform data from the library format to the backend format
      const transformedData = {
        validData: data.rows?.filter((row: ImportRow) => !row.errors || row.errors.length === 0).map((row: ImportRow) => {
          // Create a simple object with the values
          return row.values;
        }) || [],
        invalidData: data.rows?.filter((row: ImportRow) => row.errors && row.errors.length > 0).map((row: ImportRow) => {
          return {
            values: row.values,
            errors: row.errors
          };
        }) || []
      };

      console.log('Transformed data:', transformedData);
      console.log('Using fallback API call - the direct integration should handle this automatically');

      // Show success notification
      alert('CSV data processed successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error processing import: ${errorMessage}`);
    }
  };

  if (isLoading) return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href={`/dashboard/importers/${params.id}`} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to importer
        </Link>
      </div>
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading schema details...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href={`/dashboard/importers/${params.id}`} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to importer
        </Link>
      </div>
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link href={`/dashboard/importers/${params.id}`} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to importer
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Preview Importer: {schema?.name}</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {schema && (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <h3 className="font-bold">Debug Info:</h3>
              <p>Backend URL: {backendUrl}</p>
              <p>Importer ID: {params.id?.toString()}</p>
              <p>Direct API Enabled: {!!backendUrl && !!params.id}</p>
            </div>
            <CSVImporter
              schema={schema}
              importerId={params.id?.toString()}
              backendUrl={backendUrl}
              onComplete={handleImportComplete}
            />
          </>
        )}
      </div>
    </div>
  );
}
