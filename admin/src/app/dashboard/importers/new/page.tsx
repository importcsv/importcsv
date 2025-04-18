'use client';

import React, { useState } from 'react';
import AddColumnForm, { ImporterField } from '@/components/AddColumnForm';
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
        <Card>
          <CardHeader>
            <CardTitle>Columns</CardTitle>
            <CardDescription>Define the columns for your importer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Columns table */}
            {fields.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-base font-medium">Column Name</th>
                      <th className="px-4 py-3 text-base font-medium">Format</th>
                      <th className="px-4 py-3 text-base font-medium">Required</th>
                      <th className="px-4 py-3 text-base font-medium">Description</th>
                      <th className="px-4 py-3 text-right text-base font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fields.map((field) => (
                      <tr key={field.name} className="bg-white">
                        <td className="px-4 py-3 text-base font-medium">
                          {field.display_name || field.name}
                          <div className="text-sm text-gray-500">{field.name}</div>
                        </td>
                        <td className="px-4 py-3 text-base">{field.type}</td>
                        <td className="px-4 py-3 text-base">
                          {field.required ? (
                            <span className="text-red-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-base">{field.description || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeField(field.name)}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md border border-dashed">
                <p className="text-base">No columns defined yet</p>
                <p className="text-sm mt-1">Add columns to define your importer structure</p>
              </div>
            )}
            
            {/* Add Column Form */}
            <div className="bg-gray-50 p-4 rounded-md border mt-6">
              <AddColumnForm 
                existingFields={fields}
                onAddColumn={(newField) => {
                  // Add the field to the list
                  setFields(prev => [...prev, newField]);
                  
                  // Clear any errors
                  setFormError(null);
                }}
              />
            </div>
          </CardContent>
        </Card>
        
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
