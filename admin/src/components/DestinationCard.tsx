"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { importersApi } from "@/utils/apiClient";
import { formatDistanceToNow } from "date-fns";

interface Delivery {
  id: string;
  status_code: number | null;
  success: string;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

interface DestinationCardProps {
  importerId: string;
  destinationType: "webhook" | "supabase" | "frontend" | null;
  webhookUrl?: string;
  signingSecret?: string;
  integrationName?: string;
  tableName?: string;
  onChangeClick: () => void;
}

export function DestinationCard({
  importerId,
  destinationType,
  webhookUrl,
  signingSecret,
  integrationName,
  tableName,
  onChangeClick,
}: DestinationCardProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status_code?: number | null;
    duration_ms?: number;
    error?: string;
  } | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await importersApi.testWebhook(importerId);
      setTestResult(result);
      loadDeliveries();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Test failed";
      setTestResult({ success: false, error: errorMessage });
    } finally {
      setIsTesting(false);
    }
  };

  const loadDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      const result = await importersApi.getDeliveries(importerId, 5);
      setDeliveries(result.deliveries || []);
    } catch (e) {
      console.error("Failed to load deliveries", e);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Load deliveries on mount for webhook destinations
  useEffect(() => {
    if (destinationType === "webhook") {
      loadDeliveries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationType, importerId]);

  if (!destinationType) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">No Destination</h3>
            <p className="text-sm text-gray-500">
              Data will be returned to your frontend callback.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onChangeClick}>
            Configure
          </Button>
        </div>
      </div>
    );
  }

  if (destinationType === "supabase") {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Supabase</h3>
          <Button variant="ghost" size="sm" onClick={onChangeClick}>
            Change
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Integration:</span>{" "}
            <span className="font-medium">{integrationName}</span>
          </div>
          <div>
            <span className="text-gray-500">Table:</span>{" "}
            <span className="font-mono">{tableName}</span>
          </div>
        </div>
      </div>
    );
  }

  // Webhook destination
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Webhook</h3>
        <Button variant="ghost" size="sm" onClick={onChangeClick}>
          Change
        </Button>
      </div>

      <div className="space-y-4">
        {/* URL */}
        <div>
          <Label className="text-xs text-gray-500">URL</Label>
          <div className="font-mono text-sm break-all">{webhookUrl}</div>
        </div>

        {/* Signing Secret (cloud mode) */}
        {signingSecret && (
          <div>
            <Label className="text-xs text-gray-500">Signing Secret</Label>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden">
                {showSecret ? signingSecret : "••••••••••••••••••••"}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? "Hide" : "Show"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(signingSecret)}
              >
                Copy
              </Button>
            </div>
          </div>
        )}

        {/* Test Button */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting ? "Testing..." : "Test Webhook"}
          </Button>
          {testResult && (
            <div
              className={`mt-2 text-sm ${
                testResult.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {testResult.success
                ? `Success (${testResult.status_code}, ${testResult.duration_ms}ms)`
                : `Failed: ${testResult.error || `HTTP ${testResult.status_code}`}`}
            </div>
          )}
        </div>

        {/* Recent Deliveries */}
        <div>
          <Label className="text-xs text-gray-500">Recent Deliveries</Label>
          {loadingDeliveries ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : deliveries.length === 0 ? (
            <p className="text-sm text-gray-400">No deliveries yet</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {deliveries.map((d) => (
                <li key={d.id} className="text-sm flex items-center gap-2">
                  <span
                    className={
                      d.success === "success"
                        ? "text-green-500"
                        : d.success === "retry_success"
                          ? "text-yellow-500"
                          : "text-red-500"
                    }
                  >
                    {d.success === "success"
                      ? "[OK]"
                      : d.success === "retry_success"
                        ? "[RETRY]"
                        : "[ERR]"}
                  </span>
                  <span className="text-gray-500">
                    {formatDistanceToNow(new Date(d.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <span>
                    {d.status_code ? `${d.status_code}` : "Error"}
                    {d.duration_ms && ` (${d.duration_ms}ms)`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
