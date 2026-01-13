'use client';

import React, { useState } from 'react';
import { ImporterField } from '@/components/AddColumnForm';
import ImporterColumnsManager from '@/components/ImporterColumnsManager';
import { DestinationSelector, DestinationConfig } from '@/components/DestinationSelector';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { importersApi } from '@/utils/apiClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';

export default function NewImporterPage() {
  const router = useRouter();
  const [importerName, setImporterName] = useState('');
  const [fields, setFields] = useState<ImporterField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Destination settings
  const [destination, setDestination] = useState<DestinationConfig>({
    integrationId: null,
    integrationType: null,
    tableName: null,
    columnMapping: {},
    supabaseColumns: [],
  });

  // Handle importer name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImporterName(e.target.value);
  };

  // Columns that are typically auto-generated and shouldn't be imported
  const AUTO_GENERATED_COLUMNS = ["id", "created_at", "updated_at", "deleted_at"];

  // Handle destination change
  const handleDestinationChange = (newDestination: DestinationConfig) => {
    setDestination(newDestination);
  };

  // Import columns from Supabase table schema
  const handleImportSchema = (columns: typeof destination.supabaseColumns) => {
    const importedFields: ImporterField[] = columns
      .filter(col => {
        // Skip internal columns (starting with _)
        if (col.column_name.startsWith('_')) return false;
        // Skip auto-generated columns
        if (AUTO_GENERATED_COLUMNS.includes(col.column_name.toLowerCase())) return false;
        return true;
      })
      .map((col, index) => ({
        name: col.column_name,
        display_name: col.column_name
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()),
        type: mapSupabaseType(col.data_type, col.column_name),
        validators: [],
        transformations: [],
      }));

    setFields(importedFields);
    setFormError(null);
  };

  // Map Supabase data types to importer field types
  // Valid types: text, number, date, email, phone, boolean, select, custom_regex
  const mapSupabaseType = (dataType: string, columnName: string): string => {
    const lowerType = dataType.toLowerCase();
    const lowerName = columnName.toLowerCase();

    // Check column name for common patterns
    if (lowerName.includes('email')) {
      return 'email';
    }
    if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('tel')) {
      return 'phone';
    }

    // Map based on data type
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('decimal') || lowerType.includes('float') || lowerType.includes('double') || lowerType.includes('real')) {
      return 'number';
    }
    if (lowerType.includes('bool')) {
      return 'boolean';
    }
    if (lowerType.includes('date') || lowerType.includes('timestamp') || lowerType.includes('time')) {
      return 'date';
    }

    // Default to text
    return 'text';
  };

  // Save importer
  const saveImporter = async () => {
    // Validate form
    if (!importerName) {
      setFormError('Importer name is required');
      return;
    }

    if (fields.length === 0) {
      setFormError('At least one column is required');
      return;
    }

    // Validate Supabase destination has a table selected
    if (destination.integrationType === 'supabase' && !destination.tableName) {
      setFormError('Please select a destination table for Supabase integration');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFormError(null);

    try {
      // Create the importer
      const data = await importersApi.createImporter({
        name: importerName,
        fields: fields,
      });

      // If destination is configured, set it
      if (destination.integrationId) {
        await importersApi.setDestination(data.id, {
          integration_id: destination.integrationId,
          table_name: destination.tableName || undefined,
          column_mapping: destination.columnMapping,
        });
      }

      // Navigate to the new importer's detail page
      router.push(`/importers/${data.id}`);
    } catch (err: any) {
      console.error('Error creating importer:', err);

      // Extract error message from API response if available
      let errorMessage = 'Failed to create importer. Please try again.';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/importers" className="text-blue-600 hover:text-blue-800 flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to list
        </Link>
      </div>
      
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Importer</h1>
        <p className="text-gray-500 mt-1">Define a new importer for your CSV imports.</p>
      </div>
      
      {/* Main content */}
      <div className="space-y-6">
        {/* Importer Name */}
        <Card>
          <CardHeader>
            <CardTitle>Importer Name</CardTitle>
            <CardDescription>Give your importer a useful name</CardDescription>
          </CardHeader>
          <CardContent>
            <Input 
              value={importerName}
              onChange={handleNameChange}
              placeholder="e.g., Customer Data"
              className="max-w-md"
            />
          </CardContent>
        </Card>
        
        {/* Destination Selector */}
        <DestinationSelector
          value={destination}
          onChange={handleDestinationChange}
          onImportSchema={handleImportSchema}
          hasExistingColumns={fields.length > 0}
        />
        
        {/* Columns */}
        <ImporterColumnsManager
          initialColumns={fields}
          onColumnsChange={(updatedColumns) => {
            setFields(updatedColumns);
            setFormError(null);
          }}
        />
        
        {/* Error message */}
        {(error || formError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error || formError}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/importers')}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveImporter}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Importer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
