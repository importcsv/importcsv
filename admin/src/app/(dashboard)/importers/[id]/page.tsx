"use client";

import React, { useState, useEffect } from "react";
import { ImporterField as AddColumnImporterField } from "@/components/AddColumnForm";
import ImporterColumnsManager from "@/components/ImporterColumnsManager";
import CollapsibleSection from "@/components/CollapsibleSection";
import { importersApi } from "@/utils/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  Copy,
  ExternalLink,
  MoreVertical,
  Trash2,
  Database,
  Webhook,
  Code,
  Shield,
  Globe,
} from "lucide-react";
import EmbedCodeModal from "@/components/EmbedCodeModal";

// Use the ImporterField type from the AddColumnForm component
type ImporterField = AddColumnImporterField;

interface Importer {
  id: string;
  key: string;
  name: string;
  description?: string;
  fields: ImporterField[];
  webhook_url?: string;
  webhook_enabled: boolean;
  include_unmatched_columns: boolean;
  filter_invalid_rows: boolean;
  disable_on_invalid_rows: boolean;
  dark_mode?: boolean;
  created_at: string;
  updated_at?: string;
}

export default function ImporterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [importer, setImporter] = useState<Importer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [importerName, setImporterName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [includeUnmatchedColumns, setIncludeUnmatchedColumns] = useState(false);
  const [filterInvalidRows, setFilterInvalidRows] = useState(false);
  const [disableOnInvalidRows, setDisableOnInvalidRows] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [webhookValidationError, setWebhookValidationError] = useState<string | null>(null);

  // Dialog States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const importerId = params.id as string;

  const [isCopied, setIsCopied] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const embedCode = `import { CSVImporter } from '@importcsv/react';\n\nexport default function YourComponent() {\n  return (\n    <CSVImporter\n      importerKey=\"${importer?.key ?? ""}\"\n      onComplete={(data) => {}}\n      user={{ userId: \"YOUR_USER_ID\" }}\n      metadata={{ source: \"YOUR_APP\" }}\n    />\n  );\n}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setIsCopied(true);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard.",
      variant: "default",
    });
    setTimeout(() => setIsCopied(false), 1500);
  };

  // Fetch importer details
  useEffect(() => {
    const fetchImporterDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the API client to get importer details
        const data = await importersApi.getImporter(importerId);
        setImporter(data);
        initializeFormState(data);
      } catch (err: unknown) {
        console.error("Error fetching importer:", err);

        // Extract error message from API response if available
        let errorMessage = "Failed to load importer. Please try again later.";
        
        // Type guard for axios error
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { data?: { detail?: string }, status?: number } };
          if (axiosError.response?.data?.detail) {
            errorMessage = axiosError.response.data.detail;
          }
          
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImporterDetails();
  }, [importerId, router]);

  // Initialize form state with importer data
  const initializeFormState = (data: Importer) => {
    setImporterName(data.name);
    setWebhookUrl(data.webhook_url || "");
    setWebhookEnabled(data.webhook_enabled);
    setIncludeUnmatchedColumns(data.include_unmatched_columns);
    setFilterInvalidRows(data.filter_invalid_rows);
    setDisableOnInvalidRows(data.disable_on_invalid_rows);
    setDarkMode(data.dark_mode || false);
  };

  // Save importer settings
  const saveImporterSettings = async () => {
    // Validate webhook URL if webhook is enabled
    if (webhookEnabled && !webhookUrl.trim()) {
      setWebhookValidationError('Webhook URL is required when webhook is enabled');
      return;
    }

    setIsSaving(true);
    setError(null);
    setWebhookValidationError(null);

    try {
      if (!importer) {
        throw new Error("Importer data is not available");
      }

      // Use the API client to update the importer
      // Include fields from the current importer state to ensure they are preserved
      await importersApi.updateImporter(importerId, {
        name: importerName,
        webhook_url: webhookUrl,
        webhook_enabled: webhookEnabled,
        include_unmatched_columns: includeUnmatchedColumns,
        filter_invalid_rows: filterInvalidRows,
        disable_on_invalid_rows: disableOnInvalidRows,
        dark_mode: darkMode,
        fields: importer.fields, // Include the current fields
      });

      toast({
        title: "Success",
        description: "Your importer settings have been updated successfully.",
        variant: "default",
      });
      setHasUnsavedChanges(false);
    } catch (err: unknown) {
      console.error("Error updating importer:", err);

      // Extract error message from API response if available
      let errorMessage = "Failed to update importer. Please try again.";
      
      // Type guard for axios error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Copy importer key to clipboard
  const copyImporterKey = () => {
    if (importer) {
      navigator.clipboard.writeText(importer.key);
      toast({
        title: "Success",
        description: "Importer Key has been copied to clipboard.",
        variant: "default",
      });
    }
  };

  // Delete importer
  const handleDeleteImporter = async () => {
    if (!importer) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Use the API client to delete the importer
      await importersApi.deleteImporter(importerId);

      // Redirect to importers list
      router.push("/importers");
    } catch (err: unknown) {
      console.error("Error deleting importer:", err);

      // Extract error message from API response if available
      let errorMessage = "Failed to delete importer. Please try again.";
      
      // Type guard for axios error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link
            href="/importers"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to list
          </Link>
        </div>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading importer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link
            href="/importers"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to list
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!importer) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Link
            href="/importers"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to list
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>Importer not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header with back button */}
      <div className="flex items-center space-x-2 mb-6">
        <Link
          href="/importers"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to list
        </Link>
      </div>

      {/* Importer title and actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{importerName}</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/importers/${importerId}/preview`)
            }
          >
            Preview <ExternalLink className="ml-2 h-4 w-4" />
          </Button>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                Actions <MoreVertical className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e: Event) => e.preventDefault()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Importer
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the importer and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteImporter}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content area with sections */}
      <div className="space-y-6 mb-24">
        {/* Essential Settings - Always visible */}
        <Card>
          <CardContent>
            {/* Name */}
            <div>
              <Label htmlFor="importer-name" className="text-base font-medium">Name</Label>
              <p className="text-sm text-gray-500 mb-2">Give your importer a descriptive name</p>
              <Input
                id="importer-name"
                value={importerName}
                onChange={(e) => {
                  setImporterName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Enter a name for your importer"
                className="max-w-xl"
              />
            </div>

            {/* Key */}
            <div className="pt-6 border-t">
              <Label className="text-base font-medium">Importer Key</Label>
              <p className="text-sm text-gray-500 mb-2">Unique identifier for SDK integration</p>
              <div className="flex items-center gap-2 max-w-xl">
                <Input
                  value={importer.key}
                  readOnly
                  className="font-mono bg-gray-50"
                />
                <Button variant="outline" size="icon" onClick={copyImporterKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Configuration Section */}
        <CollapsibleSection
          title="Data Configuration"
          description="Define columns and data structure"
          icon={<Database className="h-5 w-5" />}
          defaultOpen={true}
          hasChanges={false}
        >
          <ImporterColumnsManager
            initialColumns={importer.fields}
            onColumnsChange={(updatedColumns) => {
              setImporter({
                ...importer,
                fields: updatedColumns,
              });
              setHasUnsavedChanges(true);
              toast({
                title: "Columns updated",
                description: "Remember to save your changes",
                variant: "default",
              });
            }}
          />
        </CollapsibleSection>

        {/* Integration Section - Moved up */}
        <CollapsibleSection
          title="Integration"
          description="Configure webhooks and data delivery"
          icon={<Webhook className="h-5 w-5" />}
          defaultOpen={false}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="webhook-enabled" className="text-base font-medium">Enable Webhook</Label>
              <Switch
                id="webhook-enabled"
                checked={webhookEnabled}
                onCheckedChange={(checked) => {
                  setWebhookEnabled(checked);
                  setHasUnsavedChanges(true);
                  if (!checked) {
                    setWebhookValidationError(null);
                  }
                }}
              />
            </div>

            {webhookEnabled && (
              <div className="space-y-2">
                <Label htmlFor="webhook-url">
                  Webhook URL
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="webhook-url"
                  placeholder="https://api.myapp.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => {
                    setWebhookUrl(e.target.value);
                    setHasUnsavedChanges(true);
                    if (webhookValidationError) {
                      setWebhookValidationError(null);
                    }
                  }}
                  className={webhookValidationError ? "border-red-500" : ""}
                />
                {webhookValidationError && (
                  <p className="text-sm text-red-500">{webhookValidationError}</p>
                )}
                <p className="text-sm text-gray-500">
                  Data will be sent to this endpoint after processing.
                  <Link
                    href="#"
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    Webhook docs <ExternalLink className="inline h-3 w-3" />
                  </Link>
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Processing Rules Section */}
        <CollapsibleSection
          title="Processing Rules"
          description="Configure data validation and import behavior"
          icon={<Shield className="h-5 w-5" />}
          defaultOpen={false}
        >
          <div className="space-y-6">
            {/* Include Unmatched Columns */}
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <Label className="text-base font-medium">
                  Include All Unmatched Columns
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Import all columns uploaded by users, even if they are unmatched.
                  Useful for variable column imports.
                </p>
              </div>
              <Switch
                checked={includeUnmatchedColumns}
                onCheckedChange={(checked) => {
                  setIncludeUnmatchedColumns(checked);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            {/* Filter Invalid Rows */}
            <div className="flex items-start justify-between pt-6 border-t">
              <div className="flex-1 pr-4">
                <Label className="text-base font-medium">Filter Invalid Rows</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Prevent rows that fail validation from being imported.
                  Users will be warned but invalid rows won&apos;t be imported.
                </p>
              </div>
              <Switch
                checked={filterInvalidRows}
                onCheckedChange={(checked) => {
                  setFilterInvalidRows(checked);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            {/* Disable on Invalid Rows */}
            <div className="flex items-start justify-between pt-6 border-t">
              <div className="flex-1 pr-4">
                <Label className="text-base font-medium">
                  Block Import on Any Invalid Rows
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Completely prevent import if any row has validation errors.
                  Forces users to fix all issues before importing.
                </p>
              </div>
              <Switch
                checked={disableOnInvalidRows}
                onCheckedChange={(checked) => {
                  setDisableOnInvalidRows(checked);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            {/* Dark Mode */}
            <div className="flex items-start justify-between pt-6 border-t">
              <div className="flex-1 pr-4">
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Enable dark theme for the CSV importer interface
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={(checked) => {
                  setDarkMode(checked);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Developer Resources Section */}
        <CollapsibleSection
          title="Developer Resources"
          description="Integration code and documentation"
          icon={<Code className="h-5 w-5" />}
          defaultOpen={false}
        >
          <div className="space-y-6">
            {/* No-Code Embed Option */}
            <div>
              <Label className="text-base font-medium mb-2 block">No-Code Embed (iframe)</Label>
              <p className="text-sm text-gray-500 mb-3">
                Embed the importer directly on your website with an iframe. No coding required.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowEmbedModal(true)}
              >
                <Globe className="h-4 w-4 mr-2" />
                Get Embed Code
              </Button>
            </div>

            <div className="pt-6 border-t">
              <Label className="text-base font-medium mb-2 block">React Integration</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 z-10"
                  aria-label="Copy embed code"
                >
                  <Copy className={`h-4 w-4 ${isCopied ? "text-green-400" : ""}`} />
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
              </div>
            </div>

            <div className="pt-6 border-t">
              <Label className="text-base font-medium mb-2 block">Quick Links</Label>
              <div className="space-y-2">
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  API Documentation
                </Link>
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  SDK Reference
                </Link>
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Integration Examples
                </Link>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Embed Code Modal */}
        {importer && (
          <EmbedCodeModal
            open={showEmbedModal}
            onOpenChange={setShowEmbedModal}
            importerKey={importer.key}
          />
        )}
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <>
                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">You have unsaved changes</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                initializeFormState(importer);
                setHasUnsavedChanges(false);
                toast({
                  title: "Changes discarded",
                  description: "All changes have been reverted",
                });
              }}
              disabled={!hasUnsavedChanges || isSaving}
            >
              Discard Changes
            </Button>
            <Button
              onClick={saveImporterSettings}
              disabled={isSaving || !hasUnsavedChanges}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
