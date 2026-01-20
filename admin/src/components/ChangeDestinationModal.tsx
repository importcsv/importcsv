"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DestinationTypeCard } from "./DestinationTypeCard";
import { DestinationSelector, DestinationConfig } from "./DestinationSelector";
import { WebhookDestinationConfig } from "./WebhookDestinationConfig";
import { importersApi } from "@/utils/apiClient";
import { useIntegrations } from "@/hooks/useIntegrations";
import { isCloudMode } from "@/lib/features";
import { ImporterField } from "@/components/AddColumnForm";

type DestinationType = "webhook" | "supabase" | "frontend";

interface ChangeDestinationModalProps {
  open: boolean;
  onClose: () => void;
  importerId: string;
  importerFields: ImporterField[];
  currentDestination: {
    type: DestinationType | null;
    webhookUrl?: string;
    integrationId?: string;
    tableName?: string;
    columnMapping?: Record<string, string>;
    contextMapping?: Record<string, string>;
  } | null;
  onSaved: () => void;
}

export function ChangeDestinationModal({
  open,
  onClose,
  importerId,
  importerFields,
  currentDestination,
  onSaved,
}: ChangeDestinationModalProps) {
  const { integrations, isLoading: integrationsLoading } = useIntegrations();
  const [destinationType, setDestinationType] = useState<DestinationType>(
    currentDestination?.type || "webhook"
  );
  const [webhookUrl, setWebhookUrl] = useState(currentDestination?.webhookUrl || "");
  const [config, setConfig] = useState<DestinationConfig>({
    integrationId: currentDestination?.integrationId || null,
    integrationType: currentDestination?.type === "supabase" ? "supabase" : null,
    tableName: currentDestination?.tableName || null,
    columnMapping: currentDestination?.columnMapping || {},
    contextMapping: currentDestination?.contextMapping || {},
    webhookUrl: currentDestination?.webhookUrl || "",
    signingSecret: null,
    supabaseColumns: [],
    contextColumns: [],
    mappedColumns: [],
    ignoredColumns: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens with new destination
  useEffect(() => {
    if (open) {
      setDestinationType(currentDestination?.type || "webhook");
      setWebhookUrl(currentDestination?.webhookUrl || "");
      setConfig({
        integrationId: currentDestination?.integrationId || null,
        integrationType: currentDestination?.type === "supabase" ? "supabase" : null,
        tableName: currentDestination?.tableName || null,
        columnMapping: currentDestination?.columnMapping || {},
        contextMapping: currentDestination?.contextMapping || {},
        webhookUrl: currentDestination?.webhookUrl || "",
        signingSecret: null,
        supabaseColumns: [],
        contextColumns: [],
        mappedColumns: [],
        ignoredColumns: [],
      });
      setError(null);
    }
  }, [open, currentDestination]);

  const supabaseIntegrations = integrations?.filter((i) => i.type === "supabase") || [];
  const hasSupabaseIntegration = supabaseIntegrations.length > 0;

  const canSave =
    (destinationType === "webhook" && webhookUrl && webhookUrl.startsWith("https://")) ||
    (destinationType === "supabase" && config.integrationId && config.tableName);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (destinationType === "webhook") {
        await importersApi.setDestination(importerId, {
          destination_type: "webhook",
          webhook_url: webhookUrl,
        });
      } else if (destinationType === "supabase") {
        await importersApi.setDestination(importerId, {
          destination_type: "supabase",
          integration_id: config.integrationId!,
          table_name: config.tableName!,
          column_mapping: config.columnMapping,
          context_mapping: config.contextMapping,
        });
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update destination";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Destination</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {integrationsLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading integrations...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              <DestinationTypeCard
                type="webhook"
                title="Webhook"
                description="POST data to your endpoint"
                icon="🔗"
                selected={destinationType === "webhook"}
                disabled={false}
                onSelect={() => setDestinationType("webhook")}
              />
              <DestinationTypeCard
                type="supabase"
                title="Supabase"
                description="Insert directly to database"
                icon="⚡"
                selected={destinationType === "supabase"}
                disabled={!hasSupabaseIntegration}
                disabledReason={!hasSupabaseIntegration ? "Connect Supabase first" : undefined}
                onSelect={() => setDestinationType("supabase")}
              />
            </div>

            {destinationType === "webhook" && (
              <WebhookDestinationConfig
                webhookUrl={webhookUrl}
                signingSecret={null}
                isCloudMode={isCloudMode()}
                onChange={setWebhookUrl}
              />
            )}

            {destinationType === "supabase" && hasSupabaseIntegration && (
              <DestinationSelector
                value={config}
                onChange={setConfig}
                hasExistingColumns={importerFields.length > 0}
                importerFields={importerFields}
                schemaSource="manual"
              />
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving || integrationsLoading}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
