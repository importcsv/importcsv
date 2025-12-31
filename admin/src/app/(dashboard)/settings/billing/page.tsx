"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, ExternalLink, AlertTriangle, Check } from "lucide-react";
import { apiClient, billingApi } from "@/utils/apiClient";

interface SubscriptionData {
  tier: "free" | "pro" | "business";
  status: string;
  is_in_grace_period: boolean;
  grace_period_ends_at: string | null;
  usage: {
    imports: number;
    import_limit: number | null;
    imports_remaining: number | null;
  };
  limits: {
    imports_per_month: number | null;
    max_rows_per_import: number;
  };
}

export default function BillingPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const result = await billingApi.getSubscription();
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const handleUpgrade = async (tier: "pro" | "business") => {
    setUpgrading(true);
    try {
      const response = await apiClient.post("/billing/checkout", {
        tier,
        success_url: `${window.location.origin}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/settings/billing?canceled=true`,
      });
      window.location.href = response.data.checkout_url;
    } catch (err) {
      console.error("Checkout failed:", err);
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await apiClient.post("/billing/portal", {
        return_url: `${window.location.origin}/settings/billing`,
      });
      window.location.href = response.data.portal_url;
    } catch (err) {
      console.error("Portal failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading billing information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load billing information. Billing may not be enabled.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const subscription = data;
  const usagePercent = subscription.usage.import_limit
    ? Math.round((subscription.usage.imports / subscription.usage.import_limit) * 100)
    : 0;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Grace Period Warning */}
      {subscription.is_in_grace_period && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Payment failed.</strong> Update your payment method by{" "}
            {new Date(subscription.grace_period_ends_at!).toLocaleDateString()} to
            avoid service interruption.
            <Button
              variant="link"
              className="text-orange-800 underline p-0 h-auto ml-2"
              onClick={handleManageBilling}
            >
              Update payment method
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <p className="text-2xl font-bold capitalize mt-1">
              {subscription.tier}
              {subscription.tier !== "free" && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ${subscription.tier === "pro" ? "49" : "149"}/month
                </span>
              )}
            </p>
          </div>
          {subscription.tier !== "free" && (
            <Button variant="outline" onClick={handleManageBilling}>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          )}
        </div>

        {/* Usage Bar */}
        {subscription.usage.import_limit && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Monthly imports</span>
              <span>
                {subscription.usage.imports.toLocaleString()} /{" "}
                {subscription.usage.import_limit.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usagePercent >= 90
                    ? "bg-red-500"
                    : usagePercent >= 70
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Max {subscription.limits.max_rows_per_import.toLocaleString()} rows per import
        </div>
      </Card>

      {/* Upgrade Options */}
      {subscription.tier === "free" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 border-blue-200">
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="text-3xl font-bold mt-2">
              $49<span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                2,000 imports/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                100,000 rows per import
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Remove branding
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Custom CSS
              </li>
            </ul>
            <Button
              className="w-full mt-6"
              onClick={() => handleUpgrade("pro")}
              disabled={upgrading}
            >
              {upgrading ? "Redirecting..." : "Upgrade to Pro"}
            </Button>
          </Card>

          <Card className="p-6 border-purple-200">
            <h3 className="text-lg font-semibold">Business</h3>
            <p className="text-3xl font-bold mt-2">
              $149<span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Unlimited imports
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                500,000 rows per import
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Remove branding
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Custom CSS
              </li>
            </ul>
            <Button
              className="w-full mt-6"
              variant="outline"
              onClick={() => handleUpgrade("business")}
              disabled={upgrading}
            >
              {upgrading ? "Redirecting..." : "Upgrade to Business"}
            </Button>
          </Card>
        </div>
      )}

      {subscription.tier === "pro" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Need more?</h3>
          <p className="text-gray-500 mt-1">
            Upgrade to Business for unlimited imports and higher row limits.
          </p>
          <Button
            className="mt-4"
            onClick={() => handleUpgrade("business")}
            disabled={upgrading}
          >
            {upgrading ? "Redirecting..." : "Upgrade to Business - $149/mo"}
          </Button>
        </Card>
      )}
    </div>
  );
}
