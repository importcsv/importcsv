'use client';

import React, { useState } from 'react';
import { ImporterField } from '@/components/AddColumnForm';
import ImporterColumnsManager from '@/components/ImporterColumnsManager';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
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
  const { token, refreshToken, logout } = useAuth();
  const [importerName, setImporterName] = useState('');
  const [fields, setFields] = useState<ImporterField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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
    
    setIsLoading(true);
    setError(null);
    setFormError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/importers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: importerName,
          fields: fields
        })
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
        const retryResponse = await fetch(`${backendUrl}/api/v1/importers/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: importerName,
            fields: fields
          })
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to create importer: ${retryResponse.statusText}`);
        }
        
        const data = await retryResponse.json();
        router.push(`/dashboard/importers/${data.id}`);
      } else if (!response.ok) {
        throw new Error(`Failed to create importer: ${response.statusText}`);
      } else {
        const data = await response.json();
        router.push(`/dashboard/importers/${data.id}`);
      }
    } catch (err: any) {
      console.error('Error creating importer:', err);
      setError(err.message || 'Failed to create importer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/dashboard/importers" className="text-blue-600 hover:text-blue-800 flex items-center">
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
        
        {/* Columns */}
        <ImporterColumnsManager
          initialColumns={fields}
          onColumnsChange={(updatedColumns) => {
            setFields(updatedColumns);
            setFormError(null);
          }}
        />
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/importers')}
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
