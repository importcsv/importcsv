'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, GripVertical, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface SchemaColumn {
  name: string;
  display_name: string;
  type: string;
  required?: boolean;
  options?: string[];
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
];

interface SchemaEditorProps {
  columns: SchemaColumn[];
  onChange: (columns: SchemaColumn[]) => void;
}

export function SchemaEditor({ columns, onChange }: SchemaEditorProps) {
  const updateColumn = (index: number, updates: Partial<SchemaColumn>) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    onChange(newColumns);
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    onChange([
      ...columns,
      {
        name: `column_${columns.length + 1}`,
        display_name: `Column ${columns.length + 1}`,
        type: 'text',
        required: false,
      },
    ]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Schema Columns</CardTitle>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {columns.map((column, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

              <div className="flex-1 grid grid-cols-3 gap-3">
                <Input
                  value={column.display_name}
                  onChange={(e) => updateColumn(index, { display_name: e.target.value })}
                  placeholder="Display Name"
                />
                <Input
                  value={column.name}
                  onChange={(e) => updateColumn(index, { name: e.target.value })}
                  placeholder="Field Key"
                  className="font-mono text-sm"
                />
                <Select
                  value={column.type}
                  onValueChange={(value) => updateColumn(index, { type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {column.type === 'select' && column.options && (
                <Badge variant="secondary" className="text-xs">
                  {column.options.length} options
                </Badge>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeColumn(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {columns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No columns defined. Upload a CSV or add columns manually.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
