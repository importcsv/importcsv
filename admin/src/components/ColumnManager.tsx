'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddColumnForm, { ImporterField } from './AddColumnForm';

interface ColumnManagerProps {
  columns: ImporterField[];
  onAddColumn: (field: ImporterField) => void;
  onEditColumn: (index: number, field: ImporterField) => void;
  onDeleteColumn: (index: number) => void;
}

export default function ColumnManager({
  columns,
  onAddColumn,
  onEditColumn,
  onDeleteColumn
}: ColumnManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  // Handle edit column
  const handleEditColumn = (field: ImporterField) => {
    if (editingIndex !== null) {
      onEditColumn(editingIndex, field);
      setEditingIndex(null);
      setIsEditDialogOpen(false);
    }
  };

  // Handle add column
  const handleAddColumn = (field: ImporterField) => {
    onAddColumn(field);
    setIsAddDialogOpen(false);
  };

  // Get format display name
  const getFormatDisplayName = (type: string): string => {
    const formatMap: Record<string, string> = {
      'text': 'Text',
      'number': 'Number',
      'date': 'Date',
      'email': 'Email',
      'phone': 'Phone Number',
      'boolean': 'Boolean',
      'select': 'Select',
      'custom_regex': 'Custom Regex'
    };
    return formatMap[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Columns</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Column</DialogTitle>
            </DialogHeader>
            <AddColumnForm
              onAddColumn={handleAddColumn}
              existingFields={columns}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b">
              <th className="py-3 px-4 text-left text-sm font-medium text-zinc-600 w-12">ORDER</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-zinc-600">COLUMN NAME</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-zinc-600">DISPLAY NAME</th>
              <th className="py-3 px-4 text-left text-sm font-medium text-zinc-600">FORMAT</th>
              <th className="py-3 px-4 text-right text-sm font-medium text-zinc-600">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column, index) => (
              <tr key={index} className="border-b hover:bg-zinc-50">
                <td className="py-3 px-4 text-sm">{index + 1}</td>
                <td className="py-3 px-4 text-sm font-medium">{column.name}</td>
                <td className="py-3 px-4 text-sm">{column.display_name || column.name}</td>
                <td className="py-3 px-4 text-sm">{getFormatDisplayName(column.type)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Dialog open={isEditDialogOpen && editingIndex === index} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) setEditingIndex(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingIndex(index);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Edit Column</DialogTitle>
                        </DialogHeader>
                        {editingIndex !== null && (
                          <AddColumnForm
                            onAddColumn={handleEditColumn}
                            existingFields={columns.filter((_, i) => i !== editingIndex)}
                            initialField={columns[editingIndex]}
                            submitButtonText="Save Changes"
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Dialog open={deleteConfirmIndex === index} onOpenChange={(open) => {
                      if (!open) setDeleteConfirmIndex(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => setDeleteConfirmIndex(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Column</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p>Are you sure you want to delete the column "{column.name}"?</p>
                          <p className="text-zinc-500 mt-2">This action cannot be undone.</p>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setDeleteConfirmIndex(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => {
                              onDeleteColumn(index);
                              setDeleteConfirmIndex(null);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </td>
              </tr>
            ))}
            {columns.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-zinc-500">
                  No columns defined. Click "Add Column" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
