'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { importersApi } from '@/utils/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ImporterDetailHeader } from '@/components/ImporterDetailHeader';
import { SchemaSection } from '@/components/SchemaSection';
import { EmbedSection } from '@/components/EmbedSection';
import { AdvancedSettings } from '@/components/AdvancedSettings';
import { ImporterField } from '@/components/AddColumnForm';
import { ChangeDestinationModal } from '@/components/ChangeDestinationModal';

interface Importer {
  id: string;
  key: string;
  name: string;
  description?: string;
  fields: ImporterField[];
  webhook_url?: string;
  webhook_enabled: boolean;
  include_unmatched_columns: boolean;
  filter_invalid_rows: boolean;
  disable_on_invalid_rows: boolean;
  dark_mode?: boolean;
  created_at: string;
  updated_at?: string;
}

interface DestinationData {
  type: 'webhook' | 'supabase' | 'frontend' | null;
  webhookUrl?: string;
  signingSecret?: string;
  integrationId?: string;
  integrationName?: string;
  tableName?: string;
  columnMapping?: Record<string, string>;
  contextMapping?: Record<string, string>;
}

interface ImporterFormData {
  name: string;
  fields: ImporterField[];
  includeUnmatchedColumns: boolean;
  filterInvalidRows: boolean;
  disableOnInvalidRows: boolean;
  darkMode: boolean;
}

export default function ImporterDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const importerId = params.id as string;

  // Loading and error states
  const [importer, setImporter] = useState<Importer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Destination state
  const [destination, setDestination] = useState<DestinationData | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ImporterFormData>({
    name: '',
    fields: [],
    includeUnmatchedColumns: false,
    filterInvalidRows: false,
    disableOnInvalidRows: false,
    darkMode: false,
  });

  // Validate data before save
  const validateData = useCallback((): boolean => {
    return true;
  }, []);

  // Save function for auto-save
  const handleSave = useCallback(async (data: ImporterFormData) => {
    if (!validateData(data)) {
      throw new Error('Validation failed');
    }

    await importersApi.updateImporter(importerId, {
      name: data.name,
      fields: data.fields,
      include_unmatched_columns: data.includeUnmatchedColumns,
      filter_invalid_rows: data.filterInvalidRows,
      disable_on_invalid_rows: data.disableOnInvalidRows,
      dark_mode: data.darkMode,
    });
  }, [importerId, validateData]);

  // Auto-save hook
  const { status: saveStatus, error: saveError, retry } = useAutoSave({
    data: formData,
    onSave: handleSave,
    debounceMs: 1500,
    enabled: importer !== null,
  });

  // Fetch destination data
  const fetchDestination = useCallback(async () => {
    try {
      const destData = await importersApi.getDestination(importerId);
      if (destData) {
        setDestination({
          type: destData.destination_type,
          webhookUrl: destData.webhook_url || undefined,
          signingSecret: destData.signing_secret || undefined,
          integrationId: destData.integration_id || undefined,
          integrationName: destData.integration_name || undefined,
          tableName: destData.table_name || undefined,
          columnMapping: destData.column_mapping,
          contextMapping: destData.context_mapping,
        });
      } else {
        setDestination({ type: 'frontend' });
      }
    } catch (err) {
      console.error('Failed to fetch destination:', err);
      setDestination({ type: 'frontend' });
    }
  }, [importerId]);

  // Fetch importer data
  useEffect(() => {
    const fetchImporter = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await importersApi.getImporter(importerId);
        setImporter(data);
        setFormData({
          name: data.name,
          fields: data.fields,
          includeUnmatchedColumns: data.include_unmatched_columns,
          filterInvalidRows: data.filter_invalid_rows,
          disableOnInvalidRows: data.disable_on_invalid_rows,
          darkMode: data.dark_mode || false,
        });
        // Fetch destination after importer is loaded
        await fetchDestination();
      } catch (err: unknown) {
        let errorMessage = 'Failed to load importer';
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { data?: { detail?: string } } };
          if (axiosError.response?.data?.detail) {
            errorMessage = axiosError.response.data.detail;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImporter();
  }, [importerId, fetchDestination]);

  // Delete handler
  const handleDelete = async () => {
    await importersApi.deleteImporter(importerId);
    toast({
      title: 'Deleted',
      description: 'Importer has been deleted.',
    });
  };

  // Update helpers
  const updateField = <K extends keyof ImporterFormData>(
    key: K,
    value: ImporterFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading importer...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !importer) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Importer not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-12">
      <ImporterDetailHeader
        name={formData.name}
        importerId={importerId}
        saveStatus={saveStatus}
        saveError={saveError}
        onRetry={retry}
        onDelete={handleDelete}
      />

      <div className="space-y-8">
        {/* Section 1: Schema */}
        <section className="p-6 bg-white border rounded-lg">
          <SchemaSection
            columns={formData.fields}
            onColumnsChange={(fields) => updateField('fields', fields)}
          />
        </section>

        {/* Section 2: Embed */}
        <section className="p-6 bg-white border rounded-lg">
          <EmbedSection importerKey={importer.key} />
        </section>

        {/* Advanced Settings */}
        <AdvancedSettings
          importerId={importerId}
          name={formData.name}
          onNameChange={(name) => updateField('name', name)}
          destination={destination}
          onChangeDestination={() => setShowDestinationModal(true)}
          includeUnmatchedColumns={formData.includeUnmatchedColumns}
          onIncludeUnmatchedColumnsChange={(v) => updateField('includeUnmatchedColumns', v)}
          filterInvalidRows={formData.filterInvalidRows}
          onFilterInvalidRowsChange={(v) => updateField('filterInvalidRows', v)}
          disableOnInvalidRows={formData.disableOnInvalidRows}
          onDisableOnInvalidRowsChange={(v) => updateField('disableOnInvalidRows', v)}
          darkMode={formData.darkMode}
          onDarkModeChange={(v) => updateField('darkMode', v)}
        />
      </div>

      {/* Change Destination Modal */}
      <ChangeDestinationModal
        open={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        importerId={importerId}
        importerFields={formData.fields}
        currentDestination={destination}
        onSaved={fetchDestination}
      />
    </div>
  );
}
