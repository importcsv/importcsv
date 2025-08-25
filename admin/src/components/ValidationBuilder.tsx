'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';

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
  const [newValidatorType, setNewValidatorType] = useState<Validator['type'] | ''>('');

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

  const addValidator = () => {
    if (!newValidatorType) return;

    const newValidator: Validator = { type: newValidatorType };
    
    // Set default values based on type
    if (newValidatorType === 'regex') {
      newValidator.pattern = '';
    } else if (['min', 'max', 'min_length', 'max_length'].includes(newValidatorType)) {
      newValidator.value = 0;
    }

    onChange([...validators, newValidator]);
    setNewValidatorType('');
  };

  const updateValidator = (index: number, updates: Partial<Validator>) => {
    const updated = [...validators];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeValidator = (index: number) => {
    onChange(validators.filter((_, i) => i !== index));
  };

  const moveValidator = (fromIndex: number, toIndex: number) => {
    const updated = [...validators];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    onChange(updated);
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
      <div className="flex items-center gap-2">
        <Select value={newValidatorType} onValueChange={(value: Validator['type']) => setNewValidatorType(value)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Add validation rule..." />
          </SelectTrigger>
          <SelectContent>
            {unusedValidators.map(type => (
              <SelectItem key={type} value={type}>
                {getValidatorLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          type="button" 
          onClick={addValidator} 
          disabled={!newValidatorType}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {validators.map((validator, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-start gap-2">
              <button
                type="button"
                className="mt-1 cursor-move text-gray-400 hover:text-gray-600"
                onMouseDown={(e) => {
                  e.preventDefault();
                  // Simple drag handling - in production, use a library like react-sortable-hoc
                }}
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{getValidatorLabel(validator.type)}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeValidator(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                {validator.type === 'regex' && (
                  <div>
                    <Label htmlFor={`pattern-${index}`} className="text-sm">Pattern</Label>
                    <Input
                      id={`pattern-${index}`}
                      value={validator.pattern || ''}
                      onChange={(e) => updateValidator(index, { pattern: e.target.value })}
                      placeholder="e.g., ^[A-Z].*"
                      className="mt-1"
                    />
                  </div>
                )}

                {['min', 'max'].includes(validator.type) && (
                  <div>
                    <Label htmlFor={`value-${index}`} className="text-sm">Value</Label>
                    <Input
                      id={`value-${index}`}
                      type="number"
                      value={validator.value || 0}
                      onChange={(e) => updateValidator(index, { value: parseFloat(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                )}

                {['min_length', 'max_length'].includes(validator.type) && (
                  <div>
                    <Label htmlFor={`length-${index}`} className="text-sm">Characters</Label>
                    <Input
                      id={`length-${index}`}
                      type="number"
                      min="0"
                      value={validator.value || 0}
                      onChange={(e) => updateValidator(index, { value: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor={`message-${index}`} className="text-sm">Custom error message (optional)</Label>
                  <Input
                    id={`message-${index}`}
                    value={validator.message || ''}
                    onChange={(e) => updateValidator(index, { message: e.target.value })}
                    placeholder="e.g., Please enter a valid value"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {validators.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <p>No validation rules configured</p>
          <p className="text-sm mt-1">Add rules to validate user input</p>
        </div>
      )}
    </div>
  );
}