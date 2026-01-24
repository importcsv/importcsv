"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usageApi, importsApi, billingApi, importersApi } from "@/utils/apiClient";
import { features } from "@/lib/features";
import {
  FileSpreadsheet,
  Rows3,
  CheckCircle,
  ArrowRight,
  Sparkles,
  XCircle,
  Clock,
} from "lucide-react";

type UsageData = {
  import_count: number;
  row_count: number;
  import_limit?: number;
  period?: string;
};

type ImportData = {
  id: string;
  file_name: string;
  row_count: number;
  status: string;
  created_at: string;
  importer_id?: string;
  importer_name?: string;
  error_count?: number;
};

type SubscriptionData = {
  plan_tier: string;
};

type ImporterActivity = {
  id: string;
  name: string;
  importCount: number;
  rowCount: number;
  lastImportAt: string | null;
};

// Allowed domains for checkout redirects (security: prevent open redirect)
const ALLOWED_CHECKOUT_HOSTS = [
  "checkout.stripe.com",
  "billing.stripe.com",
];

const getResetDate = (period: string): string => {
  if (!period) return "";
  const [year, month] = period.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const resetDate = new Date(nextYear, nextMonth - 1, 1);
  return resetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const calculateImporterActivity = (
  imports: ImportData[],
  importersList: Array<{ id: string; name: string }>
): ImporterActivity[] => {
  const activityMap = new Map<string, ImporterActivity>();

  // Initialize with all importers
  importersList.forEach((imp) => {
    activityMap.set(imp.id, {
      id: imp.id,
      name: imp.name,
      importCount: 0,
      rowCount: 0,
      lastImportAt: null,
    });
  });

  // Aggregate import data
  imports.forEach((imp) => {
    if (!imp.importer_id) return;
    const activity = activityMap.get(imp.importer_id);
    if (activity) {
      activity.importCount += 1;
      activity.rowCount += imp.row_count || 0;
      if (!activity.lastImportAt || imp.created_at > activity.lastImportAt) {
        activity.lastImportAt = imp.created_at;
      }
    }
  });

  // Sort by import count descending
  return Array.from(activityMap.values()).sort(
    (a, b) => b.importCount - a.importCount
  );
};

export default function DashboardPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [recentImports, setRecentImports] = useState<ImportData[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [importerActivity, setImporterActivity] = useState<ImporterActivity[]>([]);

  // Auth is handled by the layout - just load data on mount
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [usageData, importsData, importersData] = await Promise.all([
        usageApi.getCurrent(),
        importsApi.getImports(),
        importersApi.getImporters(),
      ]);
      setUsage(usageData);

      // Create lookup map for importer names
      const importerMap = new Map<string, string>();
      importersData.forEach((imp: { id: string; name: string }) => {
        importerMap.set(imp.id, imp.name);
      });

      // Enrich imports with importer names
      const enrichedImports = importsData.map((imp: ImportData) => ({
        ...imp,
        importer_name: imp.importer_id
          ? importerMap.get(imp.importer_id) || "Unknown"
          : "Unknown",
      }));

      setRecentImports(enrichedImports.slice(0, 5));

      // Calculate importer activity
      const activity = calculateImporterActivity(importsData, importersData);
      setImporterActivity(activity);

      if (features.billing) {
        try {
          const subData = await billingApi.getSubscription();
          setSubscription(subData);
        } catch {
          // Billing not available
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { checkout_url } = await billingApi.createCheckout();

      // Security: Validate checkout URL to prevent open redirect attacks
      try {
        const url = new URL(checkout_url);
        if (!ALLOWED_CHECKOUT_HOSTS.includes(url.hostname)) {
          console.error("Unexpected checkout URL domain:", url.hostname);
          return;
        }
      } catch {
        console.error("Invalid checkout URL format");
        return;
      }

      window.location.href = checkout_url;
    } catch (err) {
      console.error("Failed to create checkout", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  const usagePercent = usage?.import_limit
    ? Math.min(100, (usage.import_count / usage.import_limit) * 100)
    : 0;

  // Count of importers that have been used
  const activeImportersCount = importerActivity.filter(
    (a) => a.importCount > 0
  ).length;

  // Total rows this month
  const totalRows = usage?.row_count || 0;

  // Reset date from usage period
  const resetDate = usage?.period ? getResetDate(usage.period) : "";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Welcome back! Here&apos;s your import overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <Rows3 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Rows Imported
              </p>
              <p className="text-2xl font-semibold text-zinc-900">
                {totalRows.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Active Importers
              </p>
              <p className="text-2xl font-semibold text-zinc-900">
                {activeImportersCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage bar */}
      {features.usageLimits && usage?.import_limit && (
        <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-zinc-900">Monthly Usage</h2>
            {subscription?.plan_tier === "free" && (
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-zinc-600">
              <span className="font-semibold text-zinc-900">{usage.import_count}</span>
              {" / "}
              {usage.import_limit} imports
            </p>
            {resetDate && (
              <p className="text-xs text-zinc-400">Resets {resetDate}</p>
            )}
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>
      )}

      {/* Two column grid for Recent Imports and Your Importers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Imports */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-900">Recent Imports</h2>
            <Button
              variant="ghost"
              size="sm"
              href="/imports"
              className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-xs"
            >
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {recentImports.length === 0 ? (
            <p className="text-zinc-400 text-center py-8 text-sm">No imports yet.</p>
          ) : (
            <div className="space-y-0">
              {recentImports.map((imp) => (
                <div
                  key={imp.id}
                  className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(imp.status)}
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {imp.file_name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {imp.importer_name && <>{imp.importer_name} · </>}
                        {imp.row_count?.toLocaleString()} rows
                        {imp.error_count && imp.error_count > 0 && (
                          <span className="text-red-500">
                            {" "}
                            · {imp.error_count} errors
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {formatDate(imp.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Importers */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-900">Your Importers</h2>
            <Button
              variant="ghost"
              size="sm"
              href="/importers"
              className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 text-xs"
            >
              Manage <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {importerActivity.length === 0 ? (
            <p className="text-zinc-400 text-center py-8 text-sm">
              No importers yet.
            </p>
          ) : (
            <div className="space-y-0">
              {importerActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 rounded-lg">
                      <FileSpreadsheet className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {activity.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {activity.importCount} imports ·{" "}
                        {activity.rowCount.toLocaleString()} rows
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {activity.lastImportAt
                      ? formatDate(activity.lastImportAt)
                      : "Never"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
