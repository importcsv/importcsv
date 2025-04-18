'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Define Field structure to match backend SchemaField
interface SchemaField {
  name: string;                      // Column name as in CSV
  display_name: string;              // Display name for users
  type: string;                      // text, number, date, email, phone, boolean, select, custom_regex
  required?: boolean;                // Whether field is required
  description?: string;              // Description for users
  must_match?: boolean;              // Require that users must match this column
  not_blank?: boolean;               // Value cannot be blank
  example?: string;                  // Example value for the field
  validation_error_message?: string; // Custom validation error message
  validation_format?: string;        // For date format, regex pattern, or select options
}

// Updated Schema structure to match backend
interface Schema {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
}

// Supported data types for columns
const COLUMN_TYPES = [
  { value: 'text', label: 'Text (any value)', description: 'Any string of characters' },
  { value: 'number', label: 'Number', description: 'Numbers with , and . characters allowed' },
  { value: 'date', label: 'Date', description: 'Matches selected format' },
  { value: 'email', label: 'Email', description: 'Valid email address' },
  { value: 'phone', label: 'Phone Number', description: 'Matches phone numbers with symbols: ()[]-+' },
  { value: 'boolean', label: 'Boolean', description: 'Act as a boolean value' },
  { value: 'select', label: 'Select', description: 'One of a list of options' },
  { value: 'custom_regex', label: 'Custom Regular Expression', description: 'Custom pattern matching' }
];

export default function SchemasPage() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [schemaToEdit, setSchemaToEdit] = useState<Schema | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [schemaToDelete, setSchemaToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { token, logout, refreshToken } = useAuth();
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    if (token) {
      fetchSchemas();
    }
  }, [token]);

  // Fetch schemas logic
  const fetchSchemas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/schemas/`, {
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
        const retryResponse = await fetch(`${backendUrl}/api/v1/schemas/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to fetch schemas: ${retryResponse.status}`);
        }
        
        const data = await retryResponse.json();
        setSchemas(data);
      } else if (!response.ok) {
        throw new Error(`Failed to fetch schemas: ${response.status}`);
      } else {
        const data = await response.json();
        setSchemas(data);
      }
    } catch (err) {
      console.error('Error fetching schemas:', err);
      setError('Failed to load schemas. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Field Management (Shared for Create/Edit) ---
  const handleAddField = (field: SchemaField, fields: SchemaField[], setFields: React.Dispatch<React.SetStateAction<SchemaField[]>>, setFormError: React.Dispatch<React.SetStateAction<string | null>>) => {
    // Validate field has required properties
    if (!field.name) {
      setFormError('Field name is required.');
      return false;
    }
    
    if (!field.type) {
      setFormError('Field type is required.');
      return false;
    }
    
    // Check for duplicate field names
    if (fields.some(f => f.name === field.name)) {
      setFormError(`Field name '${field.name}' already exists.`);
      return false;
    }
    
    // Clear any previous errors
    setFormError(null);
    
    // Add the new field to local state
    setFields(prev => [...prev, { ...field }]);
    return true;
  };

  const handleRemoveField = (nameToRemove: string, fields: SchemaField[], setFields: React.Dispatch<React.SetStateAction<SchemaField[]>>) => {
    setFields(prev => prev.filter(field => field.name !== nameToRemove));
  };

  // --- Reset Dialog Form State (Shared) ---
  const resetFormState = () => {
    setSaveError(null);
    setDeleteError(null);
  };

  // --- Create Schema Logic ---
  const handleCreateDialogOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      resetFormState();
    }
  };

  const handleSaveSchema = async (schemaName: string, fields: SchemaField[]) => {
    setSaveError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/schemas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: schemaName,
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
        const retryResponse = await fetch(`${backendUrl}/api/v1/schemas/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: schemaName,
            fields: fields
          })
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to create schema: ${retryResponse.statusText}`);
        }
      } else if (!response.ok) {
        throw new Error(`Failed to create schema: ${response.statusText}`);
      }
      
      // Refresh the schemas list
      fetchSchemas();
      // Close the dialog
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      console.error('Error creating schema:', err);
      setSaveError(err.message || 'Failed to create schema. Please try again.');
    }
  };

  // --- Edit Schema Logic ---
  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setSchemaToEdit(null);
      resetFormState();
    }
  };

  const handleEditClick = (schema: Schema) => {
    setSchemaToEdit(schema);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSchema = async (schemaName: string, fields: SchemaField[]) => {
    if (!schemaToEdit) return;
    
    setSaveError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/schemas/${schemaToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: schemaName,
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
        const retryResponse = await fetch(`${backendUrl}/api/v1/schemas/${schemaToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: schemaName,
            fields: fields
          })
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to update schema: ${retryResponse.statusText}`);
        }
      } else if (!response.ok) {
        throw new Error(`Failed to update schema: ${response.statusText}`);
      }
      
      // Refresh the schemas list
      fetchSchemas();
      // Close the dialog
      setIsEditDialogOpen(false);
      setSchemaToEdit(null);
    } catch (err: any) {
      console.error('Error updating schema:', err);
      setSaveError(err.message || 'Failed to update schema. Please try again.');
    }
  };

  // --- Delete Schema Logic ---
  const handleDeleteSchema = async () => {
    if (!schemaToDelete) return;
    
    setDeleteError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/schemas/${schemaToDelete}`, {
        method: 'DELETE',
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
        const retryResponse = await fetch(`${backendUrl}/api/v1/schemas/${schemaToDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Failed to delete schema: ${retryResponse.statusText}`);
        }
      } else if (!response.ok) {
        throw new Error(`Failed to delete schema: ${response.statusText}`);
      }
      
      // Refresh the schemas list
      fetchSchemas();
      // Reset state
      setSchemaToDelete(null);
    } catch (err: any) {
      console.error('Error deleting schema:', err);
      setDeleteError(err.message || 'Failed to delete schema. Please try again.');
    }
  };

  // --- Schema Form Component (Internal) ---
  const SchemaForm = ({ onSubmit, mode, initialName, initialFields }: { 
    onSubmit: (name: string, fields: SchemaField[]) => void, 
    mode: 'create' | 'edit',
    initialName: string,
    initialFields: SchemaField[]
  }) => {
    const [schemaName, setSchemaName] = useState(initialName);
    const [fields, setFields] = useState<SchemaField[]>(initialFields);
    const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    
    // New field state with default values
    const [newField, setNewField] = useState<SchemaField>({
      name: '',
      display_name: '',
      type: '',
      required: false,
      description: '',
      must_match: false,
      not_blank: false,
      example: '',
      validation_error_message: '',
      validation_format: ''
    });
    
    // Handle schema name change
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSchemaName(e.target.value);
    };
    
    // Handle field input changes
    const handleFieldInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setNewField(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    // Handle field type change
    const handleTypeChange = (value: string) => {
      setNewField(prev => ({
        ...prev,
        type: value,
        // Reset validation format when type changes
        validation_format: ''
      }));
    };
    
    // Add field handler
    const addFieldHandler = () => {
      const success = handleAddField(newField, fields, setFields, setFormError);
      if (success) {
        // Reset the new field form
        setNewField({
          name: '',
          display_name: '',
          type: '',
          required: false,
          description: '',
          must_match: false,
          not_blank: false,
          example: '',
          validation_error_message: '',
          validation_format: ''
        });
        // Close the dialog
        setShowAddFieldDialog(false);
      }
    };
    
    // Remove field handler
    const removeFieldHandler = (nameToRemove: string) => {
      handleRemoveField(nameToRemove, fields, setFields);
    };
    
    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate form before submission
      if (!schemaName) {
        setFormError('Schema name is required.');
        return;
      }
      
      if (fields.length === 0) {
        setFormError('At least one field is required.');
        return;
      }
      
      // Clear any previous errors
      setFormError(null);
      
      // Call the parent's onSubmit with the form data
      onSubmit(schemaName, fields);
    };
    
    return (
      <form onSubmit={handleSubmit}>
        {/* Schema Name Input */}
        <div className="grid gap-2 mb-4">
          <Label htmlFor="schemaName">Schema Name</Label>
          <Input
            id="schemaName"
            value={schemaName}
            onChange={handleNameChange}
            placeholder="e.g., Customer Data"
            required
          />
        </div>
        
        {/* Fields Section */}
        <div className="mb-4">
          <Label className="font-semibold">Fields</Label>
          {/* Display Added Fields */}
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 mb-3">
            {fields.length === 0 && <p className="text-sm text-gray-500">No fields added yet.</p>}
            {fields.map((field) => (
              <div key={field.name} className="flex justify-between items-center text-sm p-1 bg-white rounded border">
                <span>
                  {field.display_name || field.name} ({field.name}) - 
                  <span className='italic text-gray-600'>{field.type}</span>
                  {field.required && <span className='text-red-500 ml-1'>*</span>}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFieldHandler(field.name)}
                  className='text-red-500 hover:text-red-700 h-6 px-1.5'
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          
          {/* Add New Field Dialog Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddFieldDialog(true)}
            className='mt-2 w-full'
          >
            Add Column
          </Button>
          
          {/* Add Field Dialog */}
          <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Column</DialogTitle>
                <DialogDescription>
                  Define a new column for your CSV imports.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                {/* Column Name */}
                <div className="space-y-2">
                  <Label htmlFor="fieldName">Name</Label>
                  <Input
                    id="fieldName"
                    placeholder="E.g. full_name"
                    name="name"
                    value={newField.name}
                    onChange={(e) => setNewField(prev => ({
                      ...prev,
                      name: e.target.value.replace(/\s/g, '')
                    }))}
                  />
                  <p className="text-sm text-gray-500">Input the column name exactly as in your CSV or Excel file.</p>
                </div>
                
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="fieldDisplayName">Display Name</Label>
                  <Input
                    id="fieldDisplayName"
                    placeholder="E.g. Full Name"
                    name="display_name"
                    value={newField.display_name}
                    onChange={handleFieldInputChange}
                  />
                  <p className="text-sm text-gray-500">Optional display name. Users will see this name when using the Importer. If you leave this blank, we will use the column name.</p>
                </div>
                
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="fieldDescription">Description</Label>
                  <Input
                    id="fieldDescription"
                    placeholder="E.g. Full Name"
                    name="description"
                    value={newField.description || ''}
                    onChange={handleFieldInputChange}
                  />
                  <p className="text-sm text-gray-500">Users will see this description when using the Importer.</p>
                </div>
                
                {/* Example */}
                <div className="space-y-2">
                  <Label htmlFor="fieldExample">Example</Label>
                  <Input
                    id="fieldExample"
                    placeholder="E.g. Jane Smith"
                    name="example"
                    value={newField.example || ''}
                    onChange={handleFieldInputChange}
                  />
                  <p className="text-sm text-gray-500">An example of content for this column.</p>
                </div>
                
                {/* Validation Type */}
                <div className="space-y-2">
                  <Label htmlFor="fieldType">Validation Format</Label>
                  <Select 
                    value={newField.type} 
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger id="fieldType">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    {COLUMN_TYPES.find(t => t.value === newField.type)?.description || 'Select a validation format'}
                  </p>
                </div>
                
                {/* Validation Format - Conditional based on type */}
                {newField.type === 'date' && (
                  <div className="space-y-2">
                    <Label htmlFor="validationFormat">Date Format</Label>
                    <Select 
                      value={newField.validation_format || ''} 
                      onValueChange={(value) => setNewField(prev => ({ ...prev, validation_format: value }))}
                    >
                      <SelectTrigger id="validationFormat">
                        <SelectValue placeholder="Choose format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {newField.type === 'select' && (
                  <div className="space-y-2">
                    <Label htmlFor="validationFormat">Options (comma separated)</Label>
                    <Input
                      id="validationFormat"
                      placeholder="blue,red,yellow,white"
                      name="validation_format"
                      value={newField.validation_format || ''}
                      onChange={handleFieldInputChange}
                    />
                    <p className="text-sm text-gray-500">Comma separated list of options</p>
                  </div>
                )}
                
                {newField.type === 'custom_regex' && (
                  <div className="space-y-2">
                    <Label htmlFor="validationFormat">Regular Expression</Label>
                    <Input
                      id="validationFormat"
                      placeholder="^[a-zA-Z ]*$"
                      name="validation_format"
                      value={newField.validation_format || ''}
                      onChange={handleFieldInputChange}
                    />
                    <p className="text-sm text-gray-500">Enter a valid regular expression pattern</p>
                  </div>
                )}
                
                {/* Custom Validation Error Message */}
                <div className="space-y-2">
                  <Label htmlFor="validationErrorMessage">Custom Validation Error Message</Label>
                  <Input
                    id="validationErrorMessage"
                    placeholder="E.g. Age must be above 18"
                    name="validation_error_message"
                    value={newField.validation_error_message || ''}
                    onChange={handleFieldInputChange}
                  />
                  <p className="text-sm text-gray-500">Enter a custom error to show users when their data doesn't meet the validation format. If you leave this blank, we will show a standard error message such as 'Not a valid number'.</p>
                </div>
                
                {/* Toggle Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="must_match"
                      checked={newField.must_match || false}
                      onCheckedChange={(checked) => setNewField(prev => ({ ...prev, must_match: checked }))}
                    />
                    <Label htmlFor="must_match">Must be matched</Label>
                  </div>
                  <p className="text-sm text-gray-500 pl-7">Require that users must match this column to a column in their imported data.</p>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="not_blank"
                      checked={newField.not_blank || false}
                      onCheckedChange={(checked) => setNewField(prev => ({ ...prev, not_blank: checked }))}
                    />
                    <Label htmlFor="not_blank">Value cannot be blank</Label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setShowAddFieldDialog(false)}>Cancel</Button>
                <Button 
                  type="button" 
                  onClick={addFieldHandler}
                  disabled={!newField.name || !newField.type}
                >
                  Add Column
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Display form errors */}
        {formError && <p className="text-red-500 text-sm pb-2">Error: {formError}</p>}
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            type="submit" 
            disabled={!schemaName || fields.length === 0}
          >
            {mode === 'create' ? 'Save Schema' : 'Update Schema'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  // --- Main Render ---  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schemas</h1>
        
        {/* Create Schema Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>Create Schema</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Schema</DialogTitle>
              <DialogDescription>
                Define a new schema for your CSV imports.
              </DialogDescription>
            </DialogHeader>
            <SchemaForm 
              onSubmit={handleSaveSchema} 
              mode="create" 
              initialName="" 
              initialFields={[]} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading and Error States */}
      {isLoading && <p className="text-gray-500">Loading schemas...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Schemas Table */}
      {!isLoading && !error && (
        <AlertDialog>
          <AlertDialogTrigger className="hidden" />
          <Table>
            <TableCaption>Manage your import schemas.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Columns Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemas.map((schema) => (
                <TableRow key={schema.id}>
                  <TableCell className="font-medium">{schema.name}</TableCell>
                  <TableCell>{schema.fields.length}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* Edit Button - Triggers Edit Dialog */}
                    <Dialog 
                      open={isEditDialogOpen && schemaToEdit?.id === schema.id} 
                      onOpenChange={handleEditDialogOpenChange}
                      // Add a key to force a complete remount when dialog opens/closes
                      key={`edit-dialog-${isEditDialogOpen}-${schema.id}`}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(schema)}>Edit</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Schema: {schemaToEdit?.name}</DialogTitle>
                          <DialogDescription>
                            Modify the name and columns for this schema.
                          </DialogDescription>
                        </DialogHeader>
                        {/* Re-use the SchemaForm for editing */}
                        <SchemaForm 
                          onSubmit={handleUpdateSchema} 
                          mode="edit" 
                          initialName={schemaToEdit?.name || ''} 
                          initialFields={schemaToEdit?.fields || []} 
                        />
                      </DialogContent>
                    </Dialog>

                    {/* Delete Button Trigger */}
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className='text-red-600 hover:text-red-800'
                        onClick={() => setSchemaToDelete(schema.id)}
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Delete Confirmation Dialog Content */}
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the schema
                and any associated import configurations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && <p className='text-sm text-red-500'>{deleteError}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSchemaToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSchema} className='bg-red-600 hover:bg-red-700'>Delete Schema</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
