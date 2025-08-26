'use client';

import React, { useState } from 'react';
import { ImporterField } from '@/components/AddColumnForm';
import ImporterColumnsManager from '@/components/ImporterColumnsManager';
import WebhookSettings from '@/components/WebhookSettings';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import apiClient, { importersApi } from '@/utils/apiClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';

// Using ImporterField from AddColumnForm component

export default function NewImporterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [importerName, setImporterName] = useState('');
  const [fields, setFields] = useState<ImporterField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Webhook settings
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookValidationError, setWebhookValidationError] = useState<string | null>(null);

  // Handle importer name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImporterName(e.target.value);
  };

  // Remove field handler
  const removeField = (nameToRemove: string) => {
    setFields(prev => prev.filter(field => field.name !== nameToRemove));
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
    
    // Validate webhook URL if webhook is enabled
    if (webhookEnabled && !webhookUrl.trim()) {
      setWebhookValidationError('Webhook URL is required when webhook is enabled');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setFormError(null);
    setWebhookValidationError(null);
    
    try {
      // Use the API client to create a new importer
      const data = await importersApi.createImporter({
        name: importerName,
        fields: fields,
        webhook_url: webhookUrl,
        webhook_enabled: webhookEnabled
      });
      
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
      
      // If the error is authentication-related and not handled by the client,
      // redirect to login
      if (err.response && err.response.status === 401) {
        router.push('/login');
      }
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
        
        {/* Webhook Settings */}
        <WebhookSettings
          webhookEnabled={webhookEnabled}
          webhookUrl={webhookUrl}
          onWebhookEnabledChange={(enabled) => {
            setWebhookEnabled(enabled);
            // Clear validation error when user toggles webhook
            if (!enabled) {
              setWebhookValidationError(null);
            }
          }}
          onWebhookUrlChange={(url) => {
            setWebhookUrl(url);
            // Clear validation error when user starts typing
            if (webhookValidationError) {
              setWebhookValidationError(null);
            }
          }}
          validationError={webhookValidationError}
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
