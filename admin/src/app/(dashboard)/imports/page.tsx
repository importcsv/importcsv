"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importsApi } from "@/utils/apiClient";
import { FileSpreadsheet, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

type ImportJob = {
  id: string;
  file_name: string;
  status: string;
  row_count: number;
  processed_rows: number;
  error_count: number;
  created_at: string;
  importer?: {
    name: string;
  };
};

const statusConfig: Record<
  string,
  { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" }
> = {
  completed: {
    icon: <CheckCircle className="w-4 h-4" />,
    variant: "default",
  },
  failed: {
    icon: <XCircle className="w-4 h-4" />,
    variant: "destructive",
  },
  processing: {
    icon: <Clock className="w-4 h-4" />,
    variant: "secondary",
  },
  pending: {
    icon: <Clock className="w-4 h-4" />,
    variant: "secondary",
  },
};

export default function ImportsPage() {
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth is handled by the layout - just load data on mount
  useEffect(() => {
    fetchImports();
  }, []);

  const fetchImports = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await importsApi.getImports();
      setImports(data);
    } catch (err) {
      console.error("Failed to fetch imports:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import History</h1>
          <p className="text-gray-500 mt-1">View all CSV imports</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchImports(true)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {imports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No imports yet</h3>
          <p className="text-gray-500 mt-1">Import history will appear here.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Importer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead className="text-right">Errors</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {imports.map((job) => {
              const config = statusConfig[job.status] || statusConfig.pending;
              return (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.file_name}</TableCell>
                  <TableCell>{job.importer?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={config.variant} className="gap-1">
                      {config.icon} {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {job.processed_rows?.toLocaleString()} /{" "}
                    {job.row_count?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.error_count > 0 ? (
                      <span className="text-red-600">{job.error_count}</span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(job.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
