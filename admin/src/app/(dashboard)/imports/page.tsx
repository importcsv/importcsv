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
import { importsApi, importersApi } from "@/utils/apiClient";
import { CheckCircle, XCircle, Clock, RefreshCw, History } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

type ImportJob = {
  id: string;
  file_name: string;
  status: string;
  row_count: number;
  processed_rows: number;
  error_count: number;
  created_at: string;
  importer_id?: string;
  importer_name?: string;
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
      const [importsData, importersData] = await Promise.all([
        importsApi.getImports(),
        importersApi.getImporters(),
      ]);

      // Create lookup map for importer names
      const importerMap = new Map<string, string>();
      importersData.forEach((imp: { id: string; name: string }) => {
        importerMap.set(imp.id, imp.name);
      });

      // Enrich imports with importer names
      const enrichedImports = importsData.map((imp: ImportJob) => ({
        ...imp,
        importer_name: imp.importer_id
          ? importerMap.get(imp.importer_id) || "Unknown"
          : "Unknown",
      }));

      setImports(enrichedImports);
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
      <div className="p-6">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Import History</h1>
          <p className="text-zinc-500 text-sm mt-1">View all CSV imports</p>
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
        <EmptyState
          icon={History}
          title="No imports yet"
          description="Once users upload CSVs through your importer, you'll see them here."
          action={{
            label: "View Your Importers",
            href: "/importers"
          }}
          tip="Need to test? Use the preview mode in any importer to try it out."
        />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 bg-zinc-50/50">
                <TableHead className="text-sm font-medium text-zinc-500">Importer</TableHead>
                <TableHead className="text-sm font-medium text-zinc-500">Status</TableHead>
                <TableHead className="text-right text-sm font-medium text-zinc-500">Rows</TableHead>
                <TableHead className="text-right text-sm font-medium text-zinc-500">Errors</TableHead>
                <TableHead className="text-sm font-medium text-zinc-500">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((job) => {
                const config = statusConfig[job.status] || statusConfig.pending;
                return (
                  <TableRow
                    key={job.id}
                    className={`border-b border-zinc-100 ${
                      job.importer_id ? "cursor-pointer hover:bg-zinc-50" : "hover:bg-zinc-50/50"
                    }`}
                    onClick={() => {
                      if (job.importer_id) {
                        window.location.href = `/importers/${job.importer_id}`;
                      }
                    }}
                  >
                    <TableCell className="font-medium text-sm text-zinc-900">
                      {job.importer_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="gap-1 text-xs">
                        {config.icon} {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-zinc-600">
                      {job.processed_rows?.toLocaleString()} /{" "}
                      {job.row_count?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {job.error_count > 0 ? (
                        <span className="text-red-600">{job.error_count}</span>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {formatDate(job.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
