'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

// Define the ImporterField interface
export interface ImporterField {
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

interface AddColumnFormProps {
  onAddColumn: (field: ImporterField) => void;
  existingFields: ImporterField[];
  className?: string;
  compact?: boolean;
}

export default function AddColumnForm({ 
  onAddColumn, 
  existingFields, 
  className = '', 
  compact = false 
}: AddColumnFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [newField, setNewField] = useState<ImporterField>({
    name: '',
    display_name: '',
    type: 'text',
    required: false,
    description: '',
    example: ''
  });

  // Handle field input changes
  const handleFieldInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewField(prev => ({
      ...prev,
      [name]: name === 'name' ? value.replace(/\s/g, '') : value
    }));
  };

  // Handle field type change
  const handleTypeChange = (value: string) => {
    setNewField(prev => ({
      ...prev,
      type: value,
      validation_format: ''
    }));
  };

  // Add field handler
  const addFieldHandler = () => {
    // Basic validation
    if (!newField.name) {
      setFormError('Column name is required');
      return;
    }
    
    if (!newField.type) {
      setFormError('Column type is required');
      return;
    }
    
    // Check for duplicate field names
    if (existingFields.some(f => f.name === newField.name)) {
      setFormError(`Column name '${newField.name}' already exists`);
      return;
    }
    
    // Call the parent handler
    onAddColumn({ ...newField });
    
    // Reset the form
    setNewField({
      name: '',
      display_name: '',
      type: 'text',
      required: false,
      description: '',
      example: ''
    });
    
    // Clear any errors
    setFormError(null);
  };

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-medium mb-4">Add Column</h3>
      
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
          {formError}
        </div>
      )}
      
      <div className={`${compact ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'}`}>
        {/* Column Name */}
        <div className="space-y-2">
          <Label htmlFor="fieldName" className="text-base font-medium">Column Name</Label>
          <Input
            id="fieldName"
            name="name"
            value={newField.name}
            onChange={handleFieldInputChange}
            placeholder="e.g. email, first_name"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">Input the column name exactly as in your CSV file.</p>
        </div>
        
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="fieldDisplayName">Display Name</Label>
          <Input
            id="fieldDisplayName"
            name="display_name"
            value={newField.display_name}
            onChange={handleFieldInputChange}
            placeholder="e.g. Email Address"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">Optional display name for users.</p>
        </div>
        
        {/* Format */}
        <div className="space-y-2">
          <Label htmlFor="fieldType">Format</Label>
          <Select
            value={newField.type}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger id="fieldType" className="mt-1">
              <SelectValue placeholder="Select a format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text (any value)</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="select">Select (options)</SelectItem>
              <SelectItem value="custom_regex">Custom Regular Expression</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="fieldDescription">Description</Label>
          <Input
            id="fieldDescription"
            name="description"
            value={newField.description || ''}
            onChange={handleFieldInputChange}
            placeholder="e.g. Customer's email address"
            className="mt-1"
          />
        </div>
        
        {/* Example */}
        <div className="space-y-2">
          <Label htmlFor="fieldExample">Example</Label>
          <Input
            id="fieldExample"
            name="example"
            value={newField.example || ''}
            onChange={handleFieldInputChange}
            placeholder="e.g. john@example.com"
            className="mt-1"
          />
        </div>
        
        {/* Required */}
        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={newField.required}
            onCheckedChange={(checked) => setNewField(prev => ({
              ...prev,
              required: checked
            }))}
          />
          <Label htmlFor="required">Required</Label>
        </div>
      </div>
      
      <Button 
        type="button"
        onClick={addFieldHandler}
        className="mt-4"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Column
      </Button>
    </div>
  );
}
