'use client';

import React, { useState, useEffect } from 'react';
import { ImporterField } from '@/components/AddColumnForm';
import ImporterColumnsManager from '@/components/ImporterColumnsManager';
import { DestinationSelector, DestinationConfig } from '@/components/DestinationSelector';
import { CsvUploader } from '@/components/CsvUploader';
import { SchemaEditor, SchemaColumn } from '@/components/SchemaEditor';
import { StepIndicator } from '@/components/StepIndicator';
import { DestinationTypeCard } from '@/components/DestinationTypeCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { importersApi, integrationsApi, InferredColumn, Integration } from '@/utils/apiClient';
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
import { ChevronLeft, Upload, Database, List, ArrowLeft, ArrowRight, Webhook, Zap } from 'lucide-react';
import { WebhookDestinationConfig } from '@/components/WebhookDestinationConfig';
import { isCloudMode } from '@/lib/features';

type DestinationType = 'webhook' | 'supabase';

const WIZARD_STEPS = ['Define Schema', 'Choose Destination'];

export default function NewImporterPage() {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Name & Schema
  const [importerName, setImporterName] = useState('');
  const [fields, setFields] = useState<ImporterField[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState('upload');

  // CSV upload state
  const [inferredColumns, setInferredColumns] = useState<SchemaColumn[]>([]);
  // csvData is kept for potential future use (e.g., preview)
  const [, setCsvData] = useState<Record<string, string>[]>([]);

  // Step 2: Destination
  const [destinationType, setDestinationType] = useState<DestinationType>('webhook');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [destination, setDestination] = useState<DestinationConfig>({
    integrationId: null,
    integrationType: null,
    tableName: null,
    columnMapping: {},
    contextMapping: {},
    supabaseColumns: [],
    contextColumns: [],
    mappedColumns: [],
    ignoredColumns: [],
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch integrations on mount
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const data = await integrationsApi.getIntegrations();
        setIntegrations(data);
      } catch (err) {
        console.error('Failed to fetch integrations:', err);
      }
    };
    fetchIntegrations();
  }, []);

  // Check if user has Supabase integrations
  const hasSupabaseIntegration = integrations.some(i => i.type === 'supabase');

  // Handle importer name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImporterName(e.target.value);
    setFormError(null);
  };

  // Columns that are typically auto-generated and shouldn't be imported
  const AUTO_GENERATED_COLUMNS = ["id", "created_at", "updated_at", "deleted_at"];

  // Handle destination change (for Supabase selector in step 2)
  const handleDestinationChange = (newDestination: DestinationConfig) => {
    setDestination(newDestination);
  };

  // Import columns from Supabase table schema (used in Connect Database tab for schema definition)
  const handleImportSchemaFromDatabase = (columns: typeof destination.supabaseColumns) => {
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
      type: col.type.toLowerCase(), // LLM returns PascalCase, UI expects lowercase
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

  // Validate step 1
  const validateStep1 = (): boolean => {
    if (!importerName.trim()) {
      setFormError('Importer name is required');
      return false;
    }

    const activeFields = getActiveFields();
    if (activeFields.length === 0) {
      setFormError('At least one column is required');
      return false;
    }

    return true;
  };

  // Validate step 2
  const validateStep2 = (): boolean => {
    if (destinationType === 'webhook') {
      if (!webhookUrl) {
        setFormError('Please enter a webhook URL');
        return false;
      }
      if (!webhookUrl.startsWith('https://')) {
        setFormError('Webhook URL must use HTTPS');
        return false;
      }
    }

    if (destinationType === 'supabase') {
      if (!destination.integrationId) {
        setFormError('Please select a Supabase integration');
        return false;
      }
      if (!destination.tableName) {
        setFormError('Please select a destination table');
        return false;
      }

      // Check if mapping is required and valid
      const activeFields = getActiveFields();
      const needsMapping = activeTab !== 'database' ||
        !activeFields.every(f =>
          destination.supabaseColumns.some(c =>
            c.column_name.toLowerCase() === f.name.toLowerCase()
          )
        );

      if (needsMapping && activeFields.length > 0) {
        // Verify all fields are mapped or explicitly ignored
        const mappedFields = Object.keys(destination.columnMapping);
        const ignoredFields = destination.ignoredColumns || [];
        const unmappedFields = activeFields.filter(
          f => !mappedFields.includes(f.name) && !ignoredFields.includes(f.name)
        );

        if (unmappedFields.length > 0) {
          setFormError(
            `Please map or ignore all columns: ${unmappedFields.map(f => f.display_name).join(', ')}`
          );
          return false;
        }
      }
    }

    return true;
  };

  // Handle next step
  const handleNext = () => {
    setFormError(null);
    setError(null);

    if (currentStep === 0) {
      if (validateStep1()) {
        setCurrentStep(1);
      }
    }
  };

  // Handle back step
  const handleBack = () => {
    setFormError(null);
    setError(null);
    setCurrentStep(0);
  };

  // Handle destination type selection
  const handleDestinationTypeSelect = (type: DestinationType) => {
    setDestinationType(type);
    setFormError(null);

    // Reset destination config when switching types
    if (type === 'webhook') {
      setDestination({
        integrationId: null,
        integrationType: null,
        tableName: null,
        columnMapping: {},
        contextMapping: {},
        supabaseColumns: [],
        contextColumns: [],
        mappedColumns: [],
        ignoredColumns: [],
      });
    }
  };

  // Save importer
  const saveImporter = async () => {
    if (!validateStep2()) {
      return;
    }

    const activeFields = getActiveFields();

    setIsLoading(true);
    setError(null);
    setFormError(null);

    try {
      // Create importer
      const data = await importersApi.createImporter({
        name: importerName,
        fields: activeFields,
      });

      // Set destination based on type
      if (destinationType === 'webhook' && webhookUrl) {
        await importersApi.setDestination(data.id, {
          destination_type: 'webhook',
          webhook_url: webhookUrl,
        });
      } else if (destinationType === 'supabase' && destination.integrationId) {
        await importersApi.setDestination(data.id, {
          destination_type: 'supabase',
          integration_id: destination.integrationId,
          table_name: destination.tableName || undefined,
          column_mapping: destination.columnMapping,
          context_mapping: destination.contextMapping,
        });
      }

      router.push(`/importers/${data.id}`);
    } catch (err: unknown) {
      console.error('Error creating importer:', err);
      let errorMessage = 'Failed to create importer. Please try again.';
      const axiosError = err as { response?: { data?: { detail?: string } }; message?: string };
      if (axiosError.response?.data?.detail) {
        errorMessage = axiosError.response.data.detail;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Render Step 1: Name & Schema
  const renderStep1 = () => (
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

            {/* Lazy load tab content - only render active tab */}
            {activeTab === 'upload' && (
              <TabsContent value="upload" className="space-y-4" forceMount>
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
            )}

            {activeTab === 'database' && (
              <TabsContent value="database" className="space-y-4" forceMount>
                <p className="text-sm text-muted-foreground">
                  Connect to a database and import the schema from an existing table.
                  This is only for defining columns - you&apos;ll choose the destination in the next step.
                </p>
                <DestinationSelector
                  value={destination}
                  onChange={handleDestinationChange}
                  onImportSchema={handleImportSchemaFromDatabase}
                  hasExistingColumns={fields.length > 0}
                  schemaSource="database"
                  integrations={integrations}
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
            )}

            {activeTab === 'manual' && (
              <TabsContent value="manual" className="space-y-4" forceMount>
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
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  // Render Step 2: Destination
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Destination Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Destination</CardTitle>
          <CardDescription>Where should imported data be sent?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DestinationTypeCard
              type="webhook"
              title="Webhook"
              description="POST data to your endpoint"
              icon={<Webhook className="h-6 w-6" />}
              selected={destinationType === "webhook"}
              onSelect={() => handleDestinationTypeSelect("webhook")}
            />
            <DestinationTypeCard
              type="supabase"
              title="Supabase"
              description="Insert directly to database"
              icon={<Zap className="h-6 w-6" />}
              selected={destinationType === "supabase"}
              disabled={!hasSupabaseIntegration}
              disabledReason="Connect Supabase in Settings first"
              onSelect={() => handleDestinationTypeSelect("supabase")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Destination Configuration */}
      {destinationType === 'webhook' && (
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>Configure where to send imported data</CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookDestinationConfig
              webhookUrl={webhookUrl}
              signingSecret={null}
              isCloudMode={isCloudMode()}
              onChange={setWebhookUrl}
            />
          </CardContent>
        </Card>
      )}

      {destinationType === 'supabase' && hasSupabaseIntegration && (
        <Card>
          <CardHeader>
            <CardTitle>Supabase Configuration</CardTitle>
            <CardDescription>Select integration, table, and column mapping</CardDescription>
          </CardHeader>
          <CardContent>
            <DestinationSelector
              value={destination}
              onChange={handleDestinationChange}
              hasExistingColumns={getActiveFields().length > 0}
              importerFields={getActiveFields()}
              schemaSource={activeTab === 'database' ? 'database' : activeTab === 'upload' ? 'csv' : 'manual'}
              integrations={integrations}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/importers" className="text-indigo-600 hover:text-indigo-700 flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to list
        </Link>
      </div>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Importer</h1>
        <p className="text-zinc-500 mt-1">Define a new importer for your CSV imports.</p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={WIZARD_STEPS} currentStep={currentStep} />

      {/* Main content */}
      <div className="space-y-6">
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}

        {/* Error message */}
        {(error || formError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error || formError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between">
          <div>
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              href="/importers"
            >
              Cancel
            </Button>
            {currentStep === 0 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={saveImporter}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Importer'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
