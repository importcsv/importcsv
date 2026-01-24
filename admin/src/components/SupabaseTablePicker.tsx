"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Database, Table2, AlertTriangle } from "lucide-react";
import {
  integrationsApi,
  SupabaseTableSchema,
  SupabaseColumnSchema,
} from "@/utils/apiClient";

interface SupabaseTablePickerProps {
  integrationId: string;
  selectedTable: string | null;
  onTableSelect: (tableName: string | null, columns: SupabaseColumnSchema[]) => void;
  hideSchema?: boolean;
}

export function SupabaseTablePicker({
  integrationId,
  selectedTable,
  onTableSelect,
  hideSchema = false,
}: SupabaseTablePickerProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [schema, setSchema] = useState<SupabaseTableSchema | null>(null);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tables when component mounts or integrationId changes
  useEffect(() => {
    if (integrationId) {
      fetchTables();
    }
  }, [integrationId]);

  // Fetch schema when table is selected
  useEffect(() => {
    if (selectedTable && integrationId) {
      fetchSchema(selectedTable);
    } else {
      setSchema(null);
    }
  }, [selectedTable, integrationId]);

  const fetchTables = async () => {
    setIsLoadingTables(true);
    setError(null);
    try {
      const response = await integrationsApi.getSupabaseTables(integrationId);
      setTables(response.tables);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      const message = extractErrorMessage(err, "Failed to load tables");
      setError(message);
      setTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const fetchSchema = async (tableName: string) => {
    setIsLoadingSchema(true);
    try {
      const response = await integrationsApi.getSupabaseTableSchema(
        integrationId,
        tableName
      );
      setSchema(response);
      onTableSelect(tableName, response.columns);
    } catch (err) {
      console.error("Failed to fetch schema:", err);
      setSchema(null);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    const axiosError = err as {
      response?: { data?: { detail?: string }; status?: number };
      message?: string;
    };
    if (axiosError.response?.status === 401) {
      return "Invalid Supabase credentials. Please update your integration settings.";
    }
    if (axiosError.response?.status === 502) {
      return "Could not connect to Supabase. Please check your project URL.";
    }
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
    return fallback;
  };

  const handleTableChange = (value: string) => {
    if (value === "__none__") {
      onTableSelect(null, []);
      setSchema(null);
    } else {
      onTableSelect(value, schema?.columns || []);
    }
  };

  const getDataTypeBadgeColor = (dataType: string): string => {
    if (dataType.includes("int") || dataType.includes("numeric") || dataType.includes("decimal")) {
      return "bg-blue-100 text-indigo-700";
    }
    if (dataType.includes("char") || dataType.includes("text")) {
      return "bg-green-100 text-green-800";
    }
    if (dataType.includes("timestamp") || dataType.includes("date") || dataType.includes("time")) {
      return "bg-purple-100 text-purple-800";
    }
    if (dataType.includes("bool")) {
      return "bg-yellow-100 text-yellow-800";
    }
    if (dataType.includes("uuid")) {
      return "bg-zinc-100 text-zinc-800";
    }
    if (dataType.includes("json")) {
      return "bg-orange-100 text-orange-800";
    }
    return "bg-zinc-100 text-zinc-800";
  };

  return (
    <div className="space-y-4">
      {/* Table selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="table-select">Destination Table</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTables}
            disabled={isLoadingTables}
            className="h-8"
          >
            {isLoadingTables ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-1 text-xs">Refresh</span>
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoadingTables ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading tables from Supabase...
          </div>
        ) : (
          <Select
            value={selectedTable || "__none__"}
            onValueChange={handleTableChange}
          >
            <SelectTrigger id="table-select" className="w-full">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Database className="w-4 h-4" />
                  Select a table...
                </div>
              </SelectItem>
              {tables
                .filter((table) => table) // Filter out empty table names
                .map((table) => (
                  <SelectItem key={table} value={table}>
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-green-600" />
                      {table}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        {tables.length === 0 && !isLoadingTables && !error && (
          <p className="text-sm text-zinc-500">
            No tables found. Make sure your Supabase project has tables in the
            public schema.
          </p>
        )}
      </div>

      {/* Schema preview */}
      {selectedTable && !hideSchema && (
        <div className="space-y-2">
          <Label>Table Schema</Label>
          {isLoadingSchema ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading schema...
            </div>
          ) : schema ? (
            <Card className="p-0 overflow-hidden">
              <div className="bg-zinc-50 px-4 py-2 border-b">
                <span className="text-sm font-medium text-zinc-700">
                  {schema.columns.length} columns
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-zinc-600">
                        Column
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-zinc-600">
                        Type
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-zinc-600">
                        Nullable
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schema.columns.map((col, idx) => (
                      <tr
                        key={col.column_name}
                        className={idx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}
                      >
                        <td className="px-4 py-2 font-mono text-zinc-900">
                          {col.column_name}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="secondary"
                            className={`font-mono text-xs ${getDataTypeBadgeColor(col.data_type)}`}
                          >
                            {col.data_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-zinc-500">
                          {col.is_nullable ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <p className="text-sm text-zinc-500">
              Could not load schema for this table.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
