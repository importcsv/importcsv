// admin/src/components/ImportConfirmationModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
}

export interface ImportConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  fromCsvColumns: ColumnInfo[];
  fromAppColumns: ColumnInfo[];
  hasExistingColumns: boolean;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ImportConfirmationModal({
  open,
  onOpenChange,
  tableName,
  fromCsvColumns,
  fromAppColumns,
  hasExistingColumns,
  onConfirm,
  isLoading = false,
}: ImportConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import schema from &quot;{tableName}&quot;?</DialogTitle>
          <DialogDescription>
            This will set up your importer with the following columns:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From CSV section */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              From CSV <span className="font-normal text-gray-500">(users will map these)</span>
            </div>
            <ul className="space-y-1">
              {fromCsvColumns.map((col) => (
                <li key={col.column_name} className="text-sm text-gray-600 font-mono">
                  • {col.column_name}
                </li>
              ))}
              {fromCsvColumns.length === 0 && (
                <li className="text-sm text-gray-400 italic">None</li>
              )}
            </ul>
          </div>

          {/* From your app section */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              From your app <span className="font-normal text-gray-500">(you&apos;ll pass these)</span>
            </div>
            <ul className="space-y-1">
              {fromAppColumns.map((col) => (
                <li key={col.column_name} className="text-sm text-gray-600 font-mono">
                  • {col.column_name}
                  {!col.is_nullable && (
                    <span className="text-orange-600 ml-1">(required)</span>
                  )}
                </li>
              ))}
              {fromAppColumns.length === 0 && (
                <li className="text-sm text-gray-400 italic">None</li>
              )}
            </ul>
          </div>

          {/* Warning for existing columns */}
          {hasExistingColumns && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This replaces your current column configuration
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Importing..." : "Import Schema"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
