'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Trash2, ArrowRight } from 'lucide-react';

export interface Transformation {
  type: 'trim' | 'uppercase' | 'lowercase' | 'capitalize' | 'remove_special_chars' | 
        'normalize_phone' | 'normalize_date' | 'default' | 'replace';
  format?: string;
  value?: string;
  find?: string;
  replace?: string;
}

interface TransformationBuilderProps {
  transformations: Transformation[];
  onChange: (transformations: Transformation[]) => void;
  fieldType: string;
}

export default function TransformationBuilder({ 
  transformations = [], 
  onChange, 
  fieldType 
}: TransformationBuilderProps) {
  
  // Get available transformations based on field type
  const getAvailableTransformations = (): Transformation['type'][] => {
    const common: Transformation['type'][] = ['trim', 'default', 'replace'];
    const text: Transformation['type'][] = ['uppercase', 'lowercase', 'capitalize', 'remove_special_chars'];
    const phone: Transformation['type'][] = ['normalize_phone'];
    const date: Transformation['type'][] = ['normalize_date'];

    switch (fieldType) {
      case 'text':
      case 'email':
        return [...common, ...text];
      case 'phone':
        return [...common, ...text, ...phone];
      case 'date':
        return [...common, ...date];
      case 'number':
        return ['default'];
      default:
        return common;
    }
  };

  const getTransformationLabel = (type: Transformation['type']) => {
    const labels: Record<Transformation['type'], string> = {
      trim: 'Trim whitespace',
      uppercase: 'Convert to UPPERCASE',
      lowercase: 'Convert to lowercase',
      capitalize: 'Capitalize Words',
      remove_special_chars: 'Remove special characters',
      normalize_phone: 'Format phone number',
      normalize_date: 'Format date',
      default: 'Set default value',
      replace: 'Find and replace'
    };
    return labels[type];
  };

  const toggleTransformation = (type: Transformation['type']) => {
    const exists = transformations.find(t => t.type === type);
    
    if (exists) {
      onChange(transformations.filter(t => t.type !== type));
    } else {
      const newTransformation: Transformation = { type };
      
      // Set default values for parameterized transformations
      if (type === 'default') {
        newTransformation.value = '';
      } else if (type === 'replace') {
        newTransformation.find = '';
        newTransformation.replace = '';
      } else if (type === 'normalize_date') {
        newTransformation.format = 'YYYY-MM-DD';
      }
      
      onChange([...transformations, newTransformation]);
    }
  };

  const updateTransformation = (index: number, updates: Partial<Transformation>) => {
    const updated = [...transformations];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const moveTransformation = (fromIndex: number, toIndex: number) => {
    const updated = [...transformations];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    onChange(updated);
  };

  const availableTransformations = getAvailableTransformations();

  // Create example preview
  const getExamplePreview = () => {
    let example = fieldType === 'phone' ? '  (555) 123-4567  ' : 
                  fieldType === 'date' ? '  12/25/2024  ' :
                  fieldType === 'email' ? '  JOHN.DOE@EXAMPLE.COM  ' :
                  '  Hello World!  ';
    
    transformations.forEach(t => {
      switch (t.type) {
        case 'trim':
          example = example.trim();
          break;
        case 'uppercase':
          example = example.toUpperCase();
          break;
        case 'lowercase':
          example = example.toLowerCase();
          break;
        case 'capitalize':
          example = example.split(' ').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          ).join(' ');
          break;
        case 'remove_special_chars':
          example = example.replace(/[^a-zA-Z0-9\s]/g, '');
          break;
        case 'normalize_phone':
          example = '(555) 123-4567';
          break;
        case 'normalize_date':
          example = '2024-12-25';
          break;
        case 'default':
          if (!example.trim() && t.value) example = t.value;
          break;
        case 'replace':
          if (t.find) example = example.replace(new RegExp(t.find, 'g'), t.replace || '');
          break;
      }
    });
    
    return example;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Available Transformations</Label>
        <div className="space-y-2">
          {availableTransformations.map(type => {
            const isActive = transformations.some(t => t.type === type);
            const transformation = transformations.find(t => t.type === type);
            const index = transformations.findIndex(t => t.type === type);
            
            return (
              <Card key={type} className={`p-3 ${isActive ? 'border-blue-500' : ''}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          type="button"
                          className="cursor-move text-gray-400 hover:text-gray-600"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            // Simple drag handling
                          }}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      )}
                      <Label htmlFor={`transform-${type}`} className="cursor-pointer">
                        {getTransformationLabel(type)}
                      </Label>
                    </div>
                    <Switch
                      id={`transform-${type}`}
                      checked={isActive}
                      onCheckedChange={() => toggleTransformation(type)}
                    />
                  </div>
                  
                  {isActive && transformation && (
                    <div className="ml-6 space-y-2">
                      {type === 'default' && (
                        <div>
                          <Label htmlFor={`default-value-${index}`} className="text-sm">Default value</Label>
                          <Input
                            id={`default-value-${index}`}
                            value={transformation.value || ''}
                            onChange={(e) => updateTransformation(index, { value: e.target.value })}
                            placeholder="Value to use when field is empty"
                            className="mt-1"
                          />
                        </div>
                      )}
                      
                      {type === 'replace' && (
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`find-${index}`} className="text-sm">Find</Label>
                            <Input
                              id={`find-${index}`}
                              value={transformation.find || ''}
                              onChange={(e) => updateTransformation(index, { find: e.target.value })}
                              placeholder="Text to find"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`replace-${index}`} className="text-sm">Replace with</Label>
                            <Input
                              id={`replace-${index}`}
                              value={transformation.replace || ''}
                              onChange={(e) => updateTransformation(index, { replace: e.target.value })}
                              placeholder="Replacement text"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                      
                      {type === 'normalize_date' && (
                        <div>
                          <Label htmlFor={`date-format-${index}`} className="text-sm">Output format</Label>
                          <Input
                            id={`date-format-${index}`}
                            value={transformation.format || 'YYYY-MM-DD'}
                            onChange={(e) => updateTransformation(index, { format: e.target.value })}
                            placeholder="e.g., YYYY-MM-DD"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {transformations.length > 0 && (
        <div className="space-y-2">
          <Label>Transformation Pipeline</Label>
          <Card className="p-3 bg-gray-50">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono">Input</span>
              {transformations.map((t, i) => (
                <React.Fragment key={i}>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {getTransformationLabel(t.type).split(' ')[0]}
                  </span>
                </React.Fragment>
              ))}
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="font-mono">Output</span>
            </div>
          </Card>
        </div>
      )}

      {transformations.length > 0 && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <Card className="p-3 bg-blue-50">
            <div className="text-sm">
              <span className="text-gray-600">Example input: </span>
              <span className="font-mono">
                {fieldType === 'phone' ? '  (555) 123-4567  ' : 
                 fieldType === 'date' ? '  12/25/2024  ' :
                 fieldType === 'email' ? '  JOHN.DOE@EXAMPLE.COM  ' :
                 '  Hello World!  '}
              </span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-gray-600">Result: </span>
              <span className="font-mono font-semibold text-blue-700">
                {getExamplePreview()}
              </span>
            </div>
          </Card>
        </div>
      )}

      {transformations.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <p>No transformations configured</p>
          <p className="text-sm mt-1">Enable transformations to automatically clean and format data</p>
        </div>
      )}
    </div>
  );
}