'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImporterField } from './AddColumnForm';
import ColumnManager from './ColumnManager';

interface ImporterColumnsManagerProps {
  initialColumns: ImporterField[];
  onColumnsChange: (columns: ImporterField[]) => void;
}

export default function ImporterColumnsManager({
  initialColumns = [],
  onColumnsChange
}: ImporterColumnsManagerProps) {
  const [columns, setColumns] = useState<ImporterField[]>(initialColumns);

  // Add a new column
  const handleAddColumn = (field: ImporterField) => {
    const updatedColumns = [...columns, field];
    setColumns(updatedColumns);
    onColumnsChange(updatedColumns);
  };

  // Edit an existing column
  const handleEditColumn = (index: number, field: ImporterField) => {
    const updatedColumns = [...columns];
    updatedColumns[index] = field;
    setColumns(updatedColumns);
    onColumnsChange(updatedColumns);
  };

  // Delete a column
  const handleDeleteColumn = (index: number) => {
    const updatedColumns = columns.filter((_, i) => i !== index);
    setColumns(updatedColumns);
    onColumnsChange(updatedColumns);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Columns</CardTitle>
        <p className="text-sm text-gray-500">Define the columns for your CSV imports.</p>
      </CardHeader>
      <CardContent>
        <ColumnManager
          columns={columns}
          onAddColumn={handleAddColumn}
          onEditColumn={handleEditColumn}
          onDeleteColumn={handleDeleteColumn}
        />
      </CardContent>
    </Card>
  );
}
