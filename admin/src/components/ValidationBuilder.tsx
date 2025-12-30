'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, GripVertical, CheckCircle, X, Shield } from 'lucide-react';

export interface Validator {
  type: 'required' | 'unique' | 'regex' | 'min' | 'max' | 'min_length' | 'max_length';
  pattern?: string;
  value?: number;
  message?: string;
}

interface ValidationBuilderProps {
  validators: Validator[];
  onChange: (validators: Validator[]) => void;
  fieldType: string;
}

export default function ValidationBuilder({ validators = [], onChange, fieldType }: ValidationBuilderProps) {

  // Get available validator types based on field type
  const getAvailableValidators = () => {
    const common: Validator['type'][] = ['required', 'unique', 'regex'];
    const numeric: Validator['type'][] = ['min', 'max'];
    const text: Validator['type'][] = ['min_length', 'max_length'];

    switch (fieldType) {
      case 'number':
        return [...common, ...numeric];
      case 'text':
      case 'email':
      case 'phone':
        return [...common, ...text];
      case 'date':
        return ['required', 'unique'];
      case 'boolean':
        return ['required'];
      case 'select':
        return ['required', 'unique'];
      default:
        return [...common, ...text];
    }
  };

  const updateValidator = (index: number, updates: Partial<Validator>) => {
    const updated = [...validators];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeValidator = (index: number) => {
    onChange(validators.filter((_, i) => i !== index));
  };

  const getValidatorLabel = (type: Validator['type']) => {
    const labels: Record<Validator['type'], string> = {
      required: 'Required',
      unique: 'Unique values only',
      regex: 'Pattern match',
      min: 'Minimum value',
      max: 'Maximum value',
      min_length: 'Minimum length',
      max_length: 'Maximum length'
    };
    return labels[type];
  };

  const availableValidators = getAvailableValidators();
  const unusedValidators = availableValidators.filter(
    type => !validators.some(v => v.type === type)
  );

  return (
    <div className="space-y-4">
      {/* Quick-add buttons */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Add Validation Rule
        </Label>
        <div className="flex flex-wrap gap-2">
          {unusedValidators.map(type => (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newValidator: Validator = { type };
                if (type === 'regex') {
                  newValidator.pattern = '';
                } else if (['min', 'max', 'min_length', 'max_length'].includes(type)) {
                  newValidator.value = 0;
                }
                onChange([...validators, newValidator]);
              }}
              className="h-7 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              {getValidatorLabel(type)}
            </Button>
          ))}
        </div>
        {unusedValidators.length === 0 && validators.length > 0 && (
          <p className="text-xs text-muted-foreground">All available rules added</p>
        )}
      </div>

      {/* Active validation rules */}
      <div className="space-y-2">
        {validators.map((validator, index) => (
          <Card key={index} className="group p-3 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-2">
              {/* Drag handle - visible on hover */}
              <button
                type="button"
                className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-muted-foreground hover:text-foreground"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <div className="flex-1 min-w-0 space-y-2">
                {/* Rule header with icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{getValidatorLabel(validator.type)}</span>
                  </div>
                  {/* Delete - visible on hover */}
                  <button
                    type="button"
                    onClick={() => removeValidator(index)}
                    aria-label={`Remove ${getValidatorLabel(validator.type)} rule`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>

                {/* Regex pattern input */}
                {validator.type === 'regex' && (
                  <div className="space-y-1">
                    <Label htmlFor={`pattern-${index}`} className="text-xs text-muted-foreground">Pattern</Label>
                    <Input
                      id={`pattern-${index}`}
                      value={validator.pattern || ''}
                      onChange={(e) => updateValidator(index, { pattern: e.target.value })}
                      placeholder="e.g., ^[A-Z].*"
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                )}

                {/* Numeric value input */}
                {['min', 'max'].includes(validator.type) && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`value-${index}`} className="text-xs text-muted-foreground shrink-0">Value:</Label>
                    <Input
                      id={`value-${index}`}
                      type="number"
                      value={validator.value || 0}
                      onChange={(e) => updateValidator(index, { value: parseFloat(e.target.value) })}
                      className="h-8 w-24 text-sm"
                    />
                  </div>
                )}

                {/* Length value input */}
                {['min_length', 'max_length'].includes(validator.type) && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`length-${index}`} className="text-xs text-muted-foreground shrink-0">Characters:</Label>
                    <Input
                      id={`length-${index}`}
                      type="number"
                      min="0"
                      value={validator.value || 0}
                      onChange={(e) => updateValidator(index, { value: parseInt(e.target.value) })}
                      className="h-8 w-24 text-sm"
                    />
                  </div>
                )}

                {/* Custom error message - collapsed by default */}
                <div className="space-y-1">
                  <Label htmlFor={`message-${index}`} className="text-xs text-muted-foreground">
                    Custom error message (optional)
                  </Label>
                  <Input
                    id={`message-${index}`}
                    value={validator.message || ''}
                    onChange={(e) => updateValidator(index, { message: e.target.value })}
                    placeholder="e.g., Please enter a valid value"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {validators.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm text-foreground">No validation rules</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
            Add rules above to ensure imported data meets your requirements
          </p>
        </div>
      )}
    </div>
  );
}