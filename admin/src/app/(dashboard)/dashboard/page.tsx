"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usageApi, importsApi, billingApi } from "@/utils/apiClient";
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
};

type ImportData = {
  id: string;
  file_name: string;
  row_count: number;
  status: string;
  created_at: string;
};

type SubscriptionData = {
  plan_tier: string;
};

// Allowed domains for checkout redirects (security: prevent open redirect)
const ALLOWED_CHECKOUT_HOSTS = [
  "checkout.stripe.com",
  "billing.stripe.com",
];

export default function DashboardPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [recentImports, setRecentImports] = useState<ImportData[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth is handled by the layout - just load data on mount
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [usageData, importsData] = await Promise.all([
        usageApi.getCurrent(),
        importsApi.getImports(),
      ]);
      setUsage(usageData);
      setRecentImports(importsData.slice(0, 5));

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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const usagePercent = usage?.import_limit
    ? Math.min(100, (usage.import_count / usage.import_limit) * 100)
    : 0;

  // Calculate success rate from recent imports
  const completedImports = recentImports.filter((i) => i.status === "completed").length;
  const successRate =
    recentImports.length > 0
      ? Math.round((completedImports / recentImports.length) * 100)
      : 100;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here&apos;s your import overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Imports this month</p>
              <p className="text-2xl font-bold">{usage?.import_count || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Rows3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rows imported</p>
              <p className="text-2xl font-bold">
                {(usage?.row_count || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Success rate</p>
              <p className="text-2xl font-bold">{successRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage bar (cloud mode) */}
      {features.usageLimits && usage?.import_limit && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Usage</h2>
              <p className="text-sm text-gray-500">
                {usage.import_count} / {usage.import_limit} free imports
              </p>
            </div>
            {subscription?.plan_tier === "free" && (
              <Button onClick={handleUpgrade}>
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            )}
          </div>
          <Progress value={usagePercent} className="h-2" />
        </Card>
      )}

      {/* Recent imports */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Imports</h2>
          <Button
            variant="ghost"
            size="sm"
            href="/imports"
          >
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {recentImports.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No imports yet.</p>
        ) : (
          <div className="space-y-3">
            {recentImports.map((imp) => (
              <div
                key={imp.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(imp.status)}
                  <div>
                    <p className="font-medium">{imp.file_name}</p>
                    <p className="text-sm text-gray-500">
                      {imp.row_count?.toLocaleString()} rows
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(imp.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
