"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, Eye, EyeOff } from "lucide-react";
import {
  integrationsApi,
  IntegrationCreate,
  Integration,
} from "@/utils/apiClient";

type IntegrationType = "supabase";

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
  const [type] = useState<IntegrationType>("supabase");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingIntegration;

  const resetForm = () => {
    setName("");
    setSupabaseUrl("");
    setServiceKey("");
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

    if (!supabaseUrl.trim()) {
      setError("Supabase URL is required");
      return;
    }
    if (!isEditing && !serviceKey.trim()) {
      setError("Service key is required");
      return;
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
        if (supabaseUrl) {
          updateData.credentials = { url: supabaseUrl.trim() };
          if (serviceKey) {
            updateData.credentials.service_key = serviceKey.trim();
          }
        }

        integration = await integrationsApi.updateIntegration(
          editingIntegration.id,
          updateData
        );
      } else {
        // Create new integration
        const credentials = { url: supabaseUrl.trim(), service_key: serviceKey.trim() };

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
                : "Connect to a database to automatically send imported data."}
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

            {/* Type display (always Supabase for now) */}
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex items-center gap-2 p-2 border rounded-md bg-zinc-50">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm">Supabase</span>
              </div>
              <p className="text-xs text-zinc-500">
                More database integrations coming soon (Postgres, MySQL, etc.)
              </p>
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
                    data-ph-mask
                  />
                  <p className="text-xs text-zinc-500">
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
                      data-ph-mask
                    />
                    <button
                      type="button"
                      onClick={() => setShowServiceKey(!showServiceKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showServiceKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Use the service_role key (not anon key) for server-side access
                  </p>
                </div>
              </>
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
