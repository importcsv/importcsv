"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, ExternalLink, AlertTriangle, Check, ArrowDown } from "lucide-react";
import { apiClient, billingApi } from "@/utils/apiClient";

interface SubscriptionData {
  tier: "free" | "pro" | "business";
  status: string;
  is_in_grace_period: boolean;
  grace_period_ends_at: string | null;
  // Trial fields
  is_trialing: boolean;
  trial_ends_at: string | null;
  trial_days_remaining: number | null;
  has_payment_method: boolean;
  is_eligible_for_trial: boolean;
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [redirectingToPortal, setRedirectingToPortal] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [pendingDowngrade, setPendingDowngrade] = useState<"pro" | null>(null);

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
    setActionError(null);
    try {
      // Case 1: New user eligible for trial - start trial
      // Case 2: Trialing user WITHOUT payment method - use trial endpoint for tier switch
      if (data?.is_eligible_for_trial || (data?.is_trialing && !data?.has_payment_method)) {
        await apiClient.post("/billing/start-trial", { tier });
        // Refresh subscription data to show updated trial status
        const updatedData = await billingApi.getSubscription();
        setData(updatedData);
        setUpgrading(false);
        return;
      }

      // Case 3: Paid user OR trialing user with CC - redirect to Stripe checkout
      const response = await apiClient.post("/billing/checkout", {
        tier,
        success_url: `${window.location.origin}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/settings/billing?canceled=true`,
      });
      window.location.href = response.data.checkout_url;
    } catch (err) {
      console.error("Checkout failed:", err);
      setActionError("Failed to process plan change. Please try again.");
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    setRedirectingToPortal(true);
    setActionError(null);
    try {
      const response = await apiClient.post("/billing/portal", {
        return_url: `${window.location.origin}/settings/billing`,
      });
      window.location.href = response.data.portal_url;
    } catch (err) {
      console.error("Portal failed:", err);
      setActionError("Failed to open billing portal. Please try again.");
      setRedirectingToPortal(false);
    }
  };

  const handleDowngradeRequest = (tier: "pro") => {
    setPendingDowngrade(tier);
    setShowDowngradeDialog(true);
  };

  const handleDowngradeConfirm = async () => {
    if (!pendingDowngrade) return;

    setShowDowngradeDialog(false);
    setUpgrading(true);
    setActionError(null);

    try {
      const response = await apiClient.post("/billing/checkout", {
        tier: pendingDowngrade,
        success_url: `${window.location.origin}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/settings/billing?canceled=true`,
      });
      // For tier changes on existing subscriptions, the backend returns success_url directly
      window.location.href = response.data.checkout_url;
    } catch (err) {
      console.error("Downgrade failed:", err);
      setActionError("Failed to process downgrade. Please try again or contact support.");
      setUpgrading(false);
      setPendingDowngrade(null);
    }
    // On success, page redirects - no cleanup needed
  };

  const handleCancelTrial = async () => {
    setUpgrading(true);
    setActionError(null);
    try {
      await apiClient.post("/billing/cancel-trial");
      const updatedData = await billingApi.getSubscription();
      setData(updatedData);
    } catch (err) {
      console.error("Cancel trial failed:", err);
      setActionError("Failed to cancel trial. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setUpgrading(true);
    setActionError(null);
    try {
      const response = await apiClient.post("/billing/checkout", {
        tier: data?.tier || "pro",
        success_url: `${window.location.origin}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/settings/billing?canceled=true`,
      });
      window.location.href = response.data.checkout_url;
    } catch (err) {
      console.error("Failed to redirect to checkout:", err);
      setActionError("Failed to open checkout. Please try again.");
      setUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-zinc-500">Loading billing information...</p>
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
        <p className="text-zinc-500 mt-1">Manage your subscription and usage</p>
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

      {/* Trial Status Banner */}
      {subscription.is_trialing && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Check className="h-4 w-4 text-indigo-600" />
          <AlertDescription className="text-indigo-700">
            <strong>You&apos;re on a free trial!</strong>{" "}
            {subscription.trial_days_remaining !== null && subscription.trial_days_remaining > 0 ? (
              <>
                {subscription.trial_days_remaining} days remaining.{" "}
                {!subscription.has_payment_method && (
                  <>
                    Add a payment method to continue after your trial.
                    <Button
                      variant="link"
                      className="text-indigo-700 underline p-0 h-auto ml-2"
                      onClick={handleAddPaymentMethod}
                      disabled={upgrading}
                    >
                      {upgrading ? "Redirecting..." : "Add payment method"}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <strong>Your trial ends today!</strong>{" "}
                {!subscription.has_payment_method && (
                  <>
                    Add a payment method now to keep your access.
                    <Button
                      variant="link"
                      className="text-indigo-700 underline p-0 h-auto ml-2"
                      onClick={handleAddPaymentMethod}
                      disabled={upgrading}
                    >
                      {upgrading ? "Redirecting..." : "Add payment method"}
                    </Button>
                  </>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Error */}
      {actionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <p className="text-2xl font-bold capitalize mt-1">
              {subscription.tier}
              {subscription.is_trialing && (
                <span className="text-sm font-normal text-indigo-600 ml-2">(Trial)</span>
              )}
              {subscription.tier !== "free" && !subscription.is_trialing && (
                <span className="text-sm font-normal text-zinc-500 ml-2">
                  ${subscription.tier === "pro" ? "49" : "149"}/month
                </span>
              )}
            </p>
          </div>
          {subscription.tier !== "free" && (
            <Button variant="outline" onClick={handleManageBilling} disabled={redirectingToPortal}>
              <CreditCard className="w-4 h-4 mr-2" />
              {redirectingToPortal ? "Redirecting..." : "Manage Billing"}
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
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usagePercent >= 90
                    ? "bg-red-500"
                    : usagePercent >= 70
                    ? "bg-yellow-500"
                    : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-zinc-500">
          Max {subscription.limits.max_rows_per_import.toLocaleString()} rows per import
        </div>
      </Card>

      {/* Upgrade Options */}
      {subscription.tier === "free" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 border-blue-200">
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="text-3xl font-bold mt-2">
              $49<span className="text-sm font-normal text-zinc-500">/mo</span>
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
              {upgrading ? "Processing..." : subscription.is_eligible_for_trial ? "Start Free Trial" : "Upgrade to Pro"}
            </Button>
            {subscription.is_eligible_for_trial && (
              <p className="text-xs text-center text-zinc-500 mt-2">14-day free trial, no credit card required</p>
            )}
          </Card>

          <Card className="p-6 border-purple-200">
            <h3 className="text-lg font-semibold">Business</h3>
            <p className="text-3xl font-bold mt-2">
              $149<span className="text-sm font-normal text-zinc-500">/mo</span>
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
              {upgrading ? "Processing..." : subscription.is_eligible_for_trial ? "Start Free Trial" : "Upgrade to Business"}
            </Button>
            {subscription.is_eligible_for_trial && (
              <p className="text-xs text-center text-zinc-500 mt-2">14-day free trial, no credit card required</p>
            )}
          </Card>
        </div>
      )}

      {subscription.tier === "pro" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold">Need more?</h3>
            <p className="text-zinc-500 mt-1">
              {subscription.is_trialing
                ? "Try Business tier with unlimited imports and higher row limits."
                : "Upgrade to Business for unlimited imports and higher row limits."
              }
            </p>
            <Button
              className="mt-4"
              onClick={() => handleUpgrade("business")}
              disabled={upgrading}
            >
              {upgrading ? "Processing..." : subscription.is_trialing ? "Switch to Business Trial" : "Upgrade to Business - $149/mo"}
            </Button>
          </Card>

          <Card className="p-6 border-zinc-200">
            <h3 className="text-lg font-semibold">{subscription.is_trialing ? "Cancel Trial" : "Cancel Subscription"}</h3>
            <p className="text-zinc-500 mt-1">
              Downgrade to the free tier with limited imports.
            </p>
            <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-zinc-500">100 imports/month, 10,000 rows per import</p>
                </div>
                {subscription.is_trialing ? (
                  <Button
                    variant="outline"
                    onClick={handleCancelTrial}
                    disabled={upgrading}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    {upgrading ? "Canceling..." : "Cancel Trial"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={redirectingToPortal}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    {redirectingToPortal ? "Redirecting..." : "Cancel in Billing Portal"}
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {subscription.tier === "business" && (
        <Card className="p-6 border-zinc-200">
          <h3 className="text-lg font-semibold">Change Plan</h3>
          <p className="text-zinc-500 mt-1">
            {subscription.is_trialing
              ? "Want to try a different plan or cancel your trial?"
              : "Need fewer features? You can downgrade or cancel your subscription."
            }
          </p>
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-zinc-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-zinc-500">{subscription.is_trialing ? "Switch your trial" : "$49/month"}</p>
                </div>
                {subscription.is_trialing ? (
                  <Button
                    variant="outline"
                    onClick={() => handleUpgrade("pro")}
                    disabled={upgrading}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    {upgrading ? "Processing..." : "Switch to Pro Trial"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleDowngradeRequest("pro")}
                    disabled={upgrading}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    {upgrading ? "Processing..." : "Downgrade to Pro"}
                  </Button>
                )}
              </div>
              <ul className="mt-3 text-sm text-zinc-600 space-y-1">
                <li>2,000 imports/month (vs unlimited)</li>
                <li>100,000 rows per import (vs 500,000)</li>
              </ul>
            </div>
            <div className="p-4 bg-zinc-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-zinc-500">100 imports/month, 10,000 rows per import</p>
                </div>
                {subscription.is_trialing ? (
                  <Button
                    variant="outline"
                    onClick={handleCancelTrial}
                    disabled={upgrading}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    {upgrading ? "Canceling..." : "Cancel Trial"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={redirectingToPortal}
                  >
                    <ArrowDown className="w-4 h-4 mr-2" />
                    {redirectingToPortal ? "Redirecting..." : "Cancel in Billing Portal"}
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Downgrade Confirmation Dialog */}
      <AlertDialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Downgrade to Pro</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to downgrade from Business to Pro. This will:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Reduce your import limit to 2,000/month (from unlimited)</li>
                  <li>Reduce max rows per import to 100,000 (from 500,000)</li>
                  <li>Take effect immediately</li>
                  <li>Credit unused Business time to your next invoice</li>
                </ul>
                <p className="font-medium">Are you sure you want to continue?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDowngrade(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDowngradeConfirm}>
              Confirm Downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
