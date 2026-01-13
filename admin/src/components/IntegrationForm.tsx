"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, Webhook, Eye, EyeOff } from "lucide-react";
import {
  integrationsApi,
  IntegrationCreate,
  Integration,
} from "@/utils/apiClient";

type IntegrationType = "supabase" | "webhook";

interface IntegrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (integration: Integration) => void;
  editingIntegration?: Integration | null;
}

export function IntegrationForm({
  open,
  onOpenChange,
  onSuccess,
  editingIntegration,
}: IntegrationFormProps) {
  const [name, setName] = useState(editingIntegration?.name || "");
  const [type, setType] = useState<IntegrationType>(
    (editingIntegration?.type as IntegrationType) || "supabase"
  );
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingIntegration;

  const resetForm = () => {
    setName("");
    setType("supabase");
    setSupabaseUrl("");
    setServiceKey("");
    setWebhookUrl("");
    setShowServiceKey(false);
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (type === "supabase") {
      if (!supabaseUrl.trim()) {
        setError("Supabase URL is required");
        return;
      }
      if (!isEditing && !serviceKey.trim()) {
        setError("Service key is required");
        return;
      }
    } else if (type === "webhook") {
      if (!webhookUrl.trim()) {
        setError("Webhook URL is required");
        return;
      }
    }

    setIsLoading(true);

    try {
      let integration: Integration;

      if (isEditing) {
        // Update existing integration
        const updateData: { name?: string; credentials?: { url: string; service_key?: string } } = {
          name: name.trim(),
        };

        // Only include credentials if user entered new values
        if (type === "supabase" && supabaseUrl) {
          updateData.credentials = { url: supabaseUrl.trim() };
          if (serviceKey) {
            updateData.credentials.service_key = serviceKey.trim();
          }
        } else if (type === "webhook" && webhookUrl) {
          updateData.credentials = { url: webhookUrl.trim() };
        }

        integration = await integrationsApi.updateIntegration(
          editingIntegration.id,
          updateData
        );
      } else {
        // Create new integration
        const credentials =
          type === "supabase"
            ? { url: supabaseUrl.trim(), service_key: serviceKey.trim() }
            : { url: webhookUrl.trim() };

        const createData: IntegrationCreate = {
          name: name.trim(),
          type,
          credentials,
        };

        integration = await integrationsApi.createIntegration(createData);
      }

      onSuccess(integration);
      handleOpenChange(false);
    } catch (err) {
      console.error("Failed to save integration:", err);
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosError.response?.data?.detail ||
          `Failed to ${isEditing ? "update" : "create"} integration`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Integration" : "Add Integration"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your integration settings. Leave credential fields empty to keep existing values."
                : "Connect to Supabase or a webhook endpoint to automatically send imported data."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production Supabase"
              />
            </div>

            {/* Type (disabled when editing) */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: IntegrationType) => setType(value)}
                disabled={isEditing}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supabase">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-green-600" />
                      Supabase
                    </div>
                  </SelectItem>
                  <SelectItem value="webhook">
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-blue-600" />
                      Webhook
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supabase fields */}
            {type === "supabase" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="supabaseUrl">Project URL</Label>
                  <Input
                    id="supabaseUrl"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                  />
                  <p className="text-xs text-gray-500">
                    Find this in your Supabase project settings → API
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceKey">Service Role Key</Label>
                  <div className="relative">
                    <Input
                      id="serviceKey"
                      type={showServiceKey ? "text" : "password"}
                      value={serviceKey}
                      onChange={(e) => setServiceKey(e.target.value)}
                      placeholder={isEditing ? "••••••••••••" : "eyJhbGciOiJIUzI1NiIs..."}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowServiceKey(!showServiceKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showServiceKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use the service_role key (not anon key) for server-side access
                  </p>
                </div>
              </>
            )}

            {/* Webhook fields */}
            {type === "webhook" && (
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-api.com/webhook"
                />
                <p className="text-xs text-gray-500">
                  We&apos;ll POST imported data to this endpoint with HMAC signature
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Integration"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
