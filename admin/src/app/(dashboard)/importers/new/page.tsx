'use client';

import React, { useState } from 'react';
import { ImporterField } from '@/components/AddColumnForm';
import ImporterColumnsManager from '@/components/ImporterColumnsManager';
import { DestinationSelector, DestinationConfig } from '@/components/DestinationSelector';
import { CsvUploader } from '@/components/CsvUploader';
import { SchemaEditor, SchemaColumn } from '@/components/SchemaEditor';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { importersApi, InferredColumn } from '@/utils/apiClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Upload, Database, List } from 'lucide-react';

export default function NewImporterPage() {
  const router = useRouter();
  const [importerName, setImporterName] = useState('');
  const [fields, setFields] = useState<ImporterField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('upload');

  // CSV upload state
  const [inferredColumns, setInferredColumns] = useState<SchemaColumn[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);

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
        if (col.column_name.startsWith('_')) return false;
        if (AUTO_GENERATED_COLUMNS.includes(col.column_name.toLowerCase())) return false;
        return true;
      })
      .map((col) => ({
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

  // Handle CSV schema inference
  const handleSchemaInferred = (columns: InferredColumn[], data: Record<string, string>[]) => {
    const schemaColumns: SchemaColumn[] = columns.map(col => ({
      name: col.name,
      display_name: col.display_name,
      type: col.type,
      options: col.options,
      required: false,
    }));
    setInferredColumns(schemaColumns);
    setCsvData(data);
    setFormError(null);
  };

  // Convert schema columns to importer fields
  const schemaToFields = (schema: SchemaColumn[]): ImporterField[] => {
    return schema.map(col => ({
      name: col.name,
      display_name: col.display_name,
      type: col.type,
      validators: [],
      transformations: [],
      options: col.options,
    }));
  };

  // Map Supabase data types to importer field types
  const mapSupabaseType = (dataType: string, columnName: string): string => {
    const lowerType = dataType.toLowerCase();
    const lowerName = columnName.toLowerCase();

    if (lowerName.includes('email')) return 'email';
    if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('tel')) return 'phone';
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('decimal') || lowerType.includes('float') || lowerType.includes('double') || lowerType.includes('real')) return 'number';
    if (lowerType.includes('bool')) return 'boolean';
    if (lowerType.includes('date') || lowerType.includes('timestamp') || lowerType.includes('time')) return 'date';

    return 'text';
  };

  // Get fields based on active tab
  const getActiveFields = (): ImporterField[] => {
    if (activeTab === 'upload' && inferredColumns.length > 0) {
      return schemaToFields(inferredColumns);
    }
    return fields;
  };

  // Save importer
  const saveImporter = async () => {
    const activeFields = getActiveFields();

    if (!importerName) {
      setFormError('Importer name is required');
      return;
    }

    if (activeFields.length === 0) {
      setFormError('At least one column is required');
      return;
    }

    if (destination.integrationType === 'supabase' && !destination.tableName) {
      setFormError('Please select a destination table for Supabase integration');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFormError(null);

    try {
      const data = await importersApi.createImporter({
        name: importerName,
        fields: activeFields,
      });

      if (destination.integrationId) {
        await importersApi.setDestination(data.id, {
          integration_id: destination.integrationId,
          table_name: destination.tableName || undefined,
          column_mapping: destination.columnMapping,
        });
      }

      router.push(`/importers/${data.id}`);
    } catch (err: any) {
      console.error('Error creating importer:', err);
      let errorMessage = 'Failed to create importer. Please try again.';
      if (err.response?.data?.detail) {
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

        {/* Schema Definition Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Define Schema</CardTitle>
            <CardDescription>Choose how you want to define your import columns</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </TabsTrigger>
                <TabsTrigger value="database" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Connect Database
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a sample CSV file and we&apos;ll automatically detect column types using AI.
                </p>
                <CsvUploader
                  onSchemaInferred={handleSchemaInferred}
                  onError={(err) => setFormError(err)}
                />
                {inferredColumns.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Detected Schema</h3>
                    <SchemaEditor
                      columns={inferredColumns}
                      onChange={setInferredColumns}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="database" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect to a database and import the schema from an existing table.
                </p>
                <DestinationSelector
                  value={destination}
                  onChange={handleDestinationChange}
                  onImportSchema={handleImportSchema}
                  hasExistingColumns={fields.length > 0}
                />
                {fields.length > 0 && (
                  <div className="mt-6">
                    <ImporterColumnsManager
                      initialColumns={fields}
                      onColumnsChange={(updatedColumns) => {
                        setFields(updatedColumns);
                        setFormError(null);
                      }}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manually define your import columns one by one.
                </p>
                <ImporterColumnsManager
                  initialColumns={fields}
                  onColumnsChange={(updatedColumns) => {
                    setFields(updatedColumns);
                    setFormError(null);
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
