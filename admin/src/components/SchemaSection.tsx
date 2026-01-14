'use client';

import React from 'react';
import { ImporterField } from './AddColumnForm';
import ColumnManager from './ColumnManager';

interface SchemaSectionProps {
  columns: ImporterField[];
  onColumnsChange: (columns: ImporterField[]) => void;
}

export function SchemaSection({ columns, onColumnsChange }: SchemaSectionProps) {
  const handleAddColumn = (field: ImporterField) => {
    onColumnsChange([...columns, field]);
  };

  const handleEditColumn = (index: number, field: ImporterField) => {
    const updated = [...columns];
    updated[index] = field;
    onColumnsChange(updated);
  };

  const handleDeleteColumn = (index: number) => {
    onColumnsChange(columns.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">1. Define Your Schema</h2>
        <p className="text-sm text-muted-foreground">What columns should users import?</p>
      </div>

      <ColumnManager
        columns={columns}
        onAddColumn={handleAddColumn}
        onEditColumn={handleEditColumn}
        onDeleteColumn={handleDeleteColumn}
      />
    </div>
  );
}
