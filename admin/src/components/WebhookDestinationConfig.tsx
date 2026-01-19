"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, RefreshCw, CheckCircle, Shield, Loader2, XCircle } from "lucide-react";
import { webhooksApi, WebhookTestResult } from "@/utils/apiClient";

interface WebhookDestinationConfigProps {
  webhookUrl: string;
  signingSecret: string | null;
  isCloudMode: boolean;
  onChange: (url: string) => void;
  onRegenerateSecret?: () => void;
}

export function WebhookDestinationConfig({
  webhookUrl,
  signingSecret,
  isCloudMode,
  onChange,
  onRegenerateSecret,
}: WebhookDestinationConfigProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);

  const handleCopySecret = async () => {
    if (signingSecret) {
      await navigator.clipboard.writeText(signingSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl || !webhookUrl.startsWith("https://")) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await webhooksApi.testUrl(webhookUrl);
      setTestResult(result);
    } catch (e) {
      setTestResult({
        success: false,
        status_code: null,
        duration_ms: 0,
        error: e instanceof Error ? e.message : "Failed to test webhook",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const canTest = webhookUrl && webhookUrl.startsWith("https://");

  return (
    <div className="space-y-4">
      {/* Webhook URL input with Test button */}
      <div className="space-y-2">
        <Label htmlFor="webhook-url">Webhook URL</Label>
        <div className="flex gap-2">
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://your-domain.com/api/webhook"
            value={webhookUrl}
            onChange={(e) => {
              onChange(e.target.value);
              setTestResult(null); // Clear result when URL changes
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleTest}
            disabled={!canTest || isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Testing
              </>
            ) : (
              "Test"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Must use HTTPS. Data will be POSTed as JSON.
        </p>

        {/* Test result */}
        {testResult && (
          <div
            className={`flex items-center gap-2 text-sm ${
              testResult.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {testResult.success ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Success ({testResult.duration_ms}ms)</span>
                {testResult.status_code && (
                  <span className="text-muted-foreground">— HTTP {testResult.status_code}</span>
                )}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span>{testResult.error || "Test failed"}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Cloud mode - existing endpoint with signing secret */}
      {isCloudMode && signingSecret && (
        <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="font-medium text-sm">Secure Webhook Delivery</span>
            <Badge variant="secondary" className="text-xs">Cloud</Badge>
          </div>

          {/* Signing secret */}
          <div className="space-y-2">
            <Label className="text-xs">Signing Secret</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={signingSecret}
                  readOnly
                  className="pr-20 font-mono text-xs"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCopySecret}
                  >
                    {copied ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              {onRegenerateSecret && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRegenerateSecret}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Use this secret to verify webhook signatures in your endpoint.
            </p>
          </div>

          {/* Features badge */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Automatic retries
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Delivery logs
            </span>
          </div>
        </div>
      )}

      {/* Self-hosted mode notice */}
      {!isCloudMode && (
        <Alert>
          <AlertDescription className="text-xs">
            Webhooks will be delivered via direct POST without signing or automatic retries.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
