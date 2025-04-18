'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Copy, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

// Define the Importer interface based on the backend model
interface ImporterField {
  name: string;
  display_name: string;
  type: string;
  required: boolean;
  description?: string;
  must_match?: boolean;
  not_blank?: boolean;
  example?: string;
  validation_error_message?: string;
  validation_format?: string;
}

interface Importer {
  id: string;
  name: string;
  description?: string;
  fields: ImporterField[];
  webhook_url?: string;
  webhook_enabled: boolean;
  include_unmatched_columns: boolean;
  filter_invalid_rows: boolean;
  disable_on_invalid_rows: boolean;
  created_at: string;
  updated_at?: string;
}

export default function ImporterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, refreshToken, logout } = useAuth();
  const [importer, setImporter] = useState<Importer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [includeUnmatchedColumns, setIncludeUnmatchedColumns] = useState(false);
  const [filterInvalidRows, setFilterInvalidRows] = useState(false);
  const [disableOnInvalidRows, setDisableOnInvalidRows] = useState(false);
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const importerId = params.id as string;

  // Fetch importer details
  useEffect(() => {
    const fetchImporterDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`${backendUrl}/api/v1/importers/${importerId}`, {
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
          const retryResponse = await fetch(`${backendUrl}/api/v1/importers/${importerId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!retryResponse.ok) {
            throw new Error(`Failed to fetch importer: ${retryResponse.statusText}`);
          }
          
          const data = await retryResponse.json();
          setImporter(data);
          initializeFormState(data);
        } else if (!response.ok) {
          throw new Error(`Failed to fetch importer: ${response.statusText}`);
        } else {
          const data = await response.json();
          setImporter(data);
          initializeFormState(data);
        }
      } catch (err: any) {
        console.error('Error fetching importer:', err);
        setError('Failed to load importer. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchImporterDetails();
  }, [token, importerId]);
  
  // Initialize form state with importer data
  const initializeFormState = (data: Importer) => {
    setWebhookUrl(data.webhook_url || '');
    setWebhookEnabled(data.webhook_enabled);
    setIncludeUnmatchedColumns(data.include_unmatched_columns);
    setFilterInvalidRows(data.filter_invalid_rows);
    setDisableOnInvalidRows(data.disable_on_invalid_rows);
  };
  
  // Save importer settings
  const saveImporterSettings = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/importers/${importerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          webhook_enabled: webhookEnabled,
          include_unmatched_columns: includeUnmatchedColumns,
          filter_invalid_rows: filterInvalidRows,
          disable_on_invalid_rows: disableOnInvalidRows
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
        const retryResponse = await fetch(`${backendUrl}/api/v1/importers/${importerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            webhook_url: webhookUrl,
            webhook_enabled: webhookEnabled,
            include_unmatched_columns: includeUnmatchedColumns,
            filter_invalid_rows: filterInvalidRows,
            disable_on_invalid_rows: disableOnInvalidRows
          })
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to update importer: ${retryResponse.statusText}`);
        }
        
        setNotification({
          message: "Your importer settings have been updated successfully.",
          type: "success"
        });
      } else if (!response.ok) {
        throw new Error(`Failed to update importer: ${response.statusText}`);
      } else {
        setNotification({
          message: "Your importer settings have been updated successfully.",
          type: "success"
        });
      }
    } catch (err: any) {
      console.error('Error updating importer:', err);
      setError(err.message || 'Failed to update importer. Please try again.');
      setNotification({
        message: err.message || 'Failed to update importer. Please try again.',
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Copy importer ID to clipboard
  const copyImporterId = () => {
    if (importer) {
      navigator.clipboard.writeText(importer.id);
      setNotification({
        message: "Importer ID has been copied to clipboard.",
        type: "success"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/dashboard/importers" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to list
          </Link>
        </div>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading importer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/dashboard/importers" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to list
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!importer) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link href="/dashboard/importers" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to list
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>Importer not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/dashboard/importers" className="text-blue-600 hover:text-blue-800 flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to list
        </Link>
      </div>
      
      {/* Importer title and actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{importer.name}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/importers/${importerId}/preview`)}>
            Preview <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button>Actions</Button>
        </div>
      </div>
      
      {/* Importer details in tabs */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="columns">Columns</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
        </TabsList>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Key */}
          <Card>
            <CardHeader>
              <CardTitle>Key</CardTitle>
              <CardDescription>The unique key used to identify this Importer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input value={importer.id} readOnly className="font-mono bg-gray-50" />
                <Button variant="outline" size="icon" onClick={copyImporterId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2">
                <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                  How to embed the importer into your app <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Name */}
          <Card>
            <CardHeader>
              <CardTitle>Name</CardTitle>
              <CardDescription>Give your importer a useful name</CardDescription>
            </CardHeader>
            <CardContent>
              <Input value={importer.name} readOnly className="bg-gray-50" />
            </CardContent>
          </Card>
          
          {/* Webhook Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Where to Send Uploaded Data</CardTitle>
              <CardDescription>
                Choose how we send uploaded data to your app. Choose Webhook to have us send uploads to the Webhook URL you enter below. Alternatively, choose onData callback to have data received directly in your app frontend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook-enabled">Webhook</Label>
                <Switch 
                  id="webhook-enabled" 
                  checked={webhookEnabled} 
                  onCheckedChange={setWebhookEnabled} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input 
                  id="webhook-url" 
                  placeholder="E.g. https://api.myapp.com/myendpoint" 
                  value={webhookUrl} 
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Uploaded data will be sent to our servers, and we will send you a webhook with the data.
                  <Link href="#" className="text-blue-600 hover:text-blue-800 ml-1">
                    Webhook docs <ExternalLink className="inline h-3 w-3" />
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Import Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Import Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Include Unmatched Columns */}
              <div className="flex items-start justify-between">
                <div>
                  <Label className="text-base">Include All Un-matched Columns in Import</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Enable this to import all columns uploaded by users, even if they are un-matched. This is useful if users have a variable number of additional columns they want to import. See the docs for details about the data format for un-matched columns.
                  </p>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1">
                    Importer docs <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </div>
                <Switch 
                  checked={includeUnmatchedColumns} 
                  onCheckedChange={setIncludeUnmatchedColumns} 
                />
              </div>
              
              {/* Filter Invalid Rows */}
              <div className="flex items-start justify-between pt-4 border-t">
                <div>
                  <Label className="text-base">Filter Invalid Rows</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Enable to prevent rows that fail any column validation criteria being imported. If disabled, users will be warned about invalid rows, but they will still be imported.
                  </p>
                  <Link href="#" className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1">
                    Importer docs <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </div>
                <Switch 
                  checked={filterInvalidRows} 
                  onCheckedChange={setFilterInvalidRows} 
                />
              </div>
              
              {/* Disable Importing All Data */}
              <div className="flex items-start justify-between pt-4 border-t">
                <div>
                  <Label className="text-base">Disable importing all data if there are invalid rows</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Enable to prevent importing all data if there are any invalid rows. If disabled, users will be warned about errors and invalid rows, but data will still be imported.
                  </p>
                </div>
                <Switch 
                  checked={disableOnInvalidRows} 
                  onCheckedChange={setDisableOnInvalidRows} 
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Notification */}
          {notification && (
            <div className={`p-4 mb-4 rounded-md flex items-center ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              <span>{notification.message}</span>
              <button 
                className="ml-auto text-gray-500 hover:text-gray-700"
                onClick={() => setNotification(null)}
              >
                ×
              </button>
            </div>
          )}
          
          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={saveImporterSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </TabsContent>
        
        {/* Columns Tab */}
        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>Columns</CardTitle>
              <CardDescription>Define the columns for your importer</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ORDER</th>
                    <th className="px-4 py-2 text-left">COLUMN NAME</th>
                    <th className="px-4 py-2 text-left">FORMAT</th>
                    <th className="px-4 py-2 text-left">EXAMPLE</th>
                    <th className="px-4 py-2 text-left">REQUIRED</th>
                    <th className="px-4 py-2 text-left">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {importer.fields.map((field, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{field.name}</td>
                      <td className="px-4 py-2">{field.type}</td>
                      <td className="px-4 py-2">{field.example || '-'}</td>
                      <td className="px-4 py-2">{field.required ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2">{field.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end">
                <Button>Add Column</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Embed Tab */}
        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>Use this code to embed the importer in your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>React Example</Label>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-md mt-2 font-mono text-sm overflow-x-auto">
                    {`import { CSVImporter } from '@importcsv/react';

export default function YourComponent() {
  return (
    <CSVImporter 
      importerId="${importer.id}"
      apiKey="YOUR_API_KEY"
      onData={(data) => console.log(data)}
    />
  );
}`}
                  </div>
                </div>
                
                <div>
                  <Label>HTML Example</Label>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-md mt-2 font-mono text-sm overflow-x-auto">
                    {`<script src="https://cdn.importcsv.com/v1/importer.js"></script>
<div id="importer"></div>
<script>
  new CSVImporter({
    containerId: 'importer',
    importerId: '${importer.id}',
    apiKey: 'YOUR_API_KEY',
    onData: function(data) {
      console.log(data);
    }
  });
</script>`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
