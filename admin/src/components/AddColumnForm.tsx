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
  template?: string;                 // Template for boolean or select fields (e.g., 'true/false', 'yes/no', '1/0')
}

interface AddColumnFormProps {
  onAddColumn: (field: ImporterField) => void;
  existingFields: ImporterField[];
  className?: string;
  compact?: boolean;
  initialField?: ImporterField; // For editing existing columns
  submitButtonText?: string; // Custom text for submit button
}

export default function AddColumnForm({ 
  onAddColumn, 
  existingFields, 
  className = '', 
  compact = false,
  initialField,
  submitButtonText = 'Add Column'
}: AddColumnFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [newField, setNewField] = useState<ImporterField>(initialField || {
    name: '',
    display_name: '',
    type: 'text',
    required: false,
    description: '',
    example: '',
    template: ''
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
      validation_format: '',
      template: value === 'boolean' ? 'true/false' : ''
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
    
    // Check for duplicate field names (skip this check when editing if name hasn't changed)
    if (existingFields.some(f => f.name === newField.name)) {
      setFormError(`Column name '${newField.name}' already exists`);
      return;
    }
    
    // For select type, ensure validation_format is set if not already
    if (newField.type === 'select' && !newField.validation_format) {
      setFormError('Please provide options for the select field');
      return;
    }
    
    // For custom regex type, ensure validation_format is set and is a valid regex
    if (newField.type === 'custom_regex') {
      if (!newField.validation_format) {
        setFormError('Please provide a regular expression pattern');
        return;
      }
      
      // Validate the regex pattern
      try {
        new RegExp(newField.validation_format);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid pattern';
        setFormError(`Invalid regular expression: ${errorMessage}`);
        return;
      }
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
      example: '',
      template: ''
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
        
        {/* Options for Select type */}
        {newField.type === 'select' && (
          <div className="space-y-2">
            <Label htmlFor="fieldOptions">Options</Label>
            <Input
              id="fieldOptions"
              name="validation_format"
              value={newField.validation_format || ''}
              onChange={handleFieldInputChange}
              placeholder="blue,red,yellow,white"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">Comma separated list of options</p>
            
            {/* Example of how the options will appear */}
            {newField.validation_format && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="flex flex-wrap gap-2">
                  {newField.validation_format.split(',').map((option, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {option.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Template for Boolean type */}
        {newField.type === 'boolean' && (
          <div className="space-y-2">
            <Label htmlFor="fieldTemplate">Boolean Format</Label>
            <Select
              value={newField.template || 'true/false'}
              onValueChange={(value) => setNewField(prev => ({
                ...prev,
                template: value
              }))}
            >
              <SelectTrigger id="fieldTemplate" className="mt-1">
                <SelectValue placeholder="Choose template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true/false">true/false</SelectItem>
                <SelectItem value="yes/no">yes/no</SelectItem>
                <SelectItem value="1/0">1/0</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">Format for boolean values in CSV</p>
          </div>
        )}
        
        {/* Custom Regular Expression */}
        {newField.type === 'custom_regex' && (
          <div className="space-y-2">
            <Label htmlFor="fieldRegex">Regular Expression</Label>
            <Input
              id="fieldRegex"
              name="validation_format"
              value={newField.validation_format || ''}
              onChange={handleFieldInputChange}
              placeholder="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">Enter a valid regular expression pattern</p>
          </div>
        )}
        
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
        {submitButtonText}
      </Button>
    </div>
  );
}
