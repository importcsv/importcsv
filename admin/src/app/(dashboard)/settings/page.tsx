"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CreditCard, Settings, Database } from "lucide-react";
import Link from "next/link";
import { usageApi } from "@/utils/apiClient";

interface FeatureFlags {
  cloud_mode: boolean;
  billing_enabled: boolean;
}

export default function SettingsPage() {
  const [features, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    usageApi.getFeatures().then(setFeatures).catch(() => {});
  }, []);

  const showBilling = features?.billing_enabled;

  // If no billing, still show integrations
  if (features && !showBilling) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
          <Link href="/settings/integrations">
            <Card className="p-6 hover:border-blue-300 transition-colors cursor-pointer">
              <Database className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="text-lg font-medium">Integrations</h3>
              <p className="text-gray-500 text-sm mt-1">
                Connect to Supabase or webhooks
              </p>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
        <Link href="/settings/integrations">
          <Card className="p-6 hover:border-blue-300 transition-colors cursor-pointer">
            <Database className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-lg font-medium">Integrations</h3>
            <p className="text-gray-500 text-sm mt-1">
              Connect to Supabase or webhooks
            </p>
          </Card>
        </Link>
        {showBilling && (
          <Link href="/settings/billing">
            <Card className="p-6 hover:border-blue-300 transition-colors cursor-pointer">
              <CreditCard className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="text-lg font-medium">Billing</h3>
              <p className="text-gray-500 text-sm mt-1">
                Manage subscription and payment
              </p>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
