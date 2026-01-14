"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Copy, ExternalLink } from "lucide-react";
import { SupabaseColumnSchema } from "@/utils/apiClient";

export interface ContextColumnConfig {
  columnName: string;
  contextKey: string;
  dataType: string;
  isNullable: boolean;
}

interface ContextColumnsSectionProps {
  columns: ContextColumnConfig[];
  onChange: (columns: ContextColumnConfig[]) => void;
  availableColumns: SupabaseColumnSchema[];
  onMoveToMapped: (columnName: string) => void;
}

export function ContextColumnsSection({
  columns,
  onChange,
  availableColumns,
  onMoveToMapped,
}: ContextColumnsSectionProps) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const requiredKeys = columns.filter((c) => !c.isNullable);
  const optionalKeys = columns.filter((c) => c.isNullable);

  const handleContextKeyChange = (columnName: string, newKey: string) => {
    onChange(
      columns.map((c) =>
        c.columnName === columnName ? { ...c, contextKey: newKey } : c
      )
    );
  };

  const handleRemove = (columnName: string) => {
    onChange(columns.filter((c) => c.columnName !== columnName));
  };

  const handleAdd = (column: SupabaseColumnSchema) => {
    onChange([
      ...columns,
      {
        columnName: column.column_name,
        contextKey: column.column_name,
        dataType: column.data_type,
        isNullable: column.is_nullable,
      },
    ]);
  };

  const generateSnippet = () => {
    const required = requiredKeys.map((c) => `    ${c.contextKey}: "..."`);
    const optional = optionalKeys.map((c) => `    // ${c.contextKey}: "..."`);
    const lines = [...required, ...optional].join(",\n");
    return `<CSVImporter\n  context={{\n${lines}\n  }}\n/>`;
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(generateSnippet());
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const unusedColumns = availableColumns.filter(
    (c) => !columns.some((ctx) => ctx.columnName === c.column_name)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Context Columns</h3>
          <p className="text-xs text-muted-foreground">
            These columns are filled from context at import time
          </p>
        </div>
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No context columns configured
        </p>
      ) : (
        <div className="space-y-2">
          {columns.map((col) => (
            <div
              key={col.columnName}
              className="flex items-center gap-2 p-2 border rounded-md"
            >
              <div className="flex-1">
                <span className="text-sm font-medium">{col.columnName}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({col.dataType})
                </span>
              </div>
              <span className="text-xs text-muted-foreground">&larr;</span>
              <div className="flex-1">
                <Label className="sr-only">Context key</Label>
                <Input
                  value={col.contextKey}
                  onChange={(e) =>
                    handleContextKeyChange(col.columnName, e.target.value)
                  }
                  placeholder="context key"
                  className="h-8 text-sm"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onMoveToMapped(col.columnName)}>
                    Move to Mapped
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRemove(col.columnName)}
                    className="text-destructive"
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {unusedColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Context Column
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {unusedColumns.map((col) => (
              <DropdownMenuItem key={col.column_name} onClick={() => handleAdd(col)}>
                {col.column_name} ({col.data_type})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {columns.length > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
          {requiredKeys.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-amber-500">Warning:</span>
              <p className="text-sm">
                <strong>Required context keys:</strong>{" "}
                {requiredKeys.map((c) => c.contextKey).join(", ")}
              </p>
            </div>
          )}
          {optionalKeys.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-blue-500">Info:</span>
              <p className="text-sm">
                <strong>Optional context keys:</strong>{" "}
                {optionalKeys.map((c) => c.contextKey).join(", ")}
              </p>
            </div>
          )}

          <div className="relative">
            <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
              {generateSnippet()}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={copySnippet}
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedSnippet ? "Copied!" : "Copy"}
            </Button>
          </div>

          <a
            href="/docs/context-variables"
            target="_blank"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Learn more about context variables
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
