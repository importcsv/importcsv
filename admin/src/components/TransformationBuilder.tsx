'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { GripVertical, ChevronRight, Sparkles } from 'lucide-react';

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
      {/* Pipeline visualization at top - always visible when transformations exist */}
      {transformations.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border">
          {/* Visual pipeline */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            <div className="shrink-0 px-3 py-1.5 rounded-md bg-background border text-xs font-mono">
              Input
            </div>
            {transformations.map((t, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="shrink-0 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium">
                  {getTransformationLabel(t.type).split(' ')[0]}
                </div>
              </React.Fragment>
            ))}
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="shrink-0 px-3 py-1.5 rounded-md bg-background border text-xs font-mono">
              Output
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted-foreground">Preview:</span>
              <code className="px-2 py-0.5 bg-background rounded border font-mono text-muted-foreground">
                {fieldType === 'phone' ? '  (555) 123-4567  ' :
                 fieldType === 'date' ? '  12/25/2024  ' :
                 fieldType === 'email' ? '  JOHN.DOE@EXAMPLE.COM  ' :
                 '  Hello World!  '}
              </code>
              <span className="text-muted-foreground">→</span>
              <code className="px-2 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded border border-green-500/20 font-mono font-medium">
                {getExamplePreview()}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Transformation toggles */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Available Transformations
        </Label>
        <div className="space-y-2">
          {availableTransformations.map(type => {
            const isActive = transformations.some(t => t.type === type);
            const transformation = transformations.find(t => t.type === type);
            const index = transformations.findIndex(t => t.type === type);

            return (
              <Card key={type} className={`p-3 transition-colors ${isActive ? 'border-primary/50 bg-primary/5' : 'hover:border-border'}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          type="button"
                          className="cursor-grab text-muted-foreground hover:text-foreground transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                          }}
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      )}
                      <Label htmlFor={`transform-${type}`} className="cursor-pointer text-sm">
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
                        <div className="space-y-1">
                          <Label htmlFor={`default-value-${index}`} className="text-xs text-muted-foreground">Default value</Label>
                          <Input
                            id={`default-value-${index}`}
                            value={transformation.value || ''}
                            onChange={(e) => updateTransformation(index, { value: e.target.value })}
                            placeholder="Value to use when field is empty"
                            className="h-8 text-sm"
                          />
                        </div>
                      )}

                      {type === 'replace' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`find-${index}`} className="text-xs text-muted-foreground">Find</Label>
                            <Input
                              id={`find-${index}`}
                              value={transformation.find || ''}
                              onChange={(e) => updateTransformation(index, { find: e.target.value })}
                              placeholder="Text to find"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`replace-${index}`} className="text-xs text-muted-foreground">Replace with</Label>
                            <Input
                              id={`replace-${index}`}
                              value={transformation.replace || ''}
                              onChange={(e) => updateTransformation(index, { replace: e.target.value })}
                              placeholder="Replacement text"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {type === 'normalize_date' && (
                        <div className="space-y-1">
                          <Label htmlFor={`date-format-${index}`} className="text-xs text-muted-foreground">Output format</Label>
                          <Input
                            id={`date-format-${index}`}
                            value={transformation.format || 'YYYY-MM-DD'}
                            onChange={(e) => updateTransformation(index, { format: e.target.value })}
                            placeholder="e.g., YYYY-MM-DD"
                            className="h-8 text-sm font-mono"
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

      {/* Empty state */}
      {transformations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm text-foreground">No transformations</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
            Enable transformations above to automatically clean and format data
          </p>
        </div>
      )}
    </div>
  );
}