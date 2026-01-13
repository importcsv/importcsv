"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EmbedCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importerKey: string;
}

export default function EmbedCodeModal({
  open,
  onOpenChange,
  importerKey,
}: EmbedCodeModalProps) {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [returnData, setReturnData] = useState(true);
  const [hideHeader, setHideHeader] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("0284c7");
  const [parentOrigin, setParentOrigin] = useState("https://yourdomain.com");
  const [copied, setCopied] = useState(false);

  // Get the base URL for the embed page
  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/embed/${importerKey}`
      : `/embed/${importerKey}`;

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set("origin", parentOrigin);
  if (darkMode) queryParams.set("theme", "dark");
  if (!returnData) queryParams.set("returnData", "false");
  if (hideHeader) queryParams.set("hideHeader", "true");
  if (primaryColor !== "0284c7") queryParams.set("primaryColor", primaryColor);

  const embedUrl = `${baseUrl}?${queryParams.toString()}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allow="clipboard-write"
></iframe>

<script>
  // Listen for messages from the importer
  window.addEventListener('message', function(event) {
    // Verify the message is from ImportCSV
    if (event.data?.source !== 'importcsv-embed') return;

    switch (event.data.type) {
      case 'ready':
        console.log('Importer ready');
        break;
      case 'complete':
        console.log('Import complete:', event.data.data);
        // Handle the imported data here
        break;
      case 'error':
        console.error('Import error:', event.data.error);
        break;
    }
  });
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidColor = /^[0-9a-fA-F]{6}$/.test(primaryColor);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Embed Importer (No-Code)</DialogTitle>
          <DialogDescription>
            Embed the CSV importer directly on your website using an iframe. No
            coding required - just copy and paste.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Configuration Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Configuration</h3>

            {/* Parent Origin - Required */}
            <div className="space-y-2">
              <Label htmlFor="parent-origin">
                Your Website URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="parent-origin"
                value={parentOrigin}
                onChange={(e) => setParentOrigin(e.target.value)}
                placeholder="https://yourdomain.com"
              />
              <p className="text-xs text-gray-500">
                Required for security. Import data will only be sent to this
                origin.
              </p>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-xs text-gray-500">
                  Use dark theme for the importer
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            {/* Return Data Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="return-data">Return Row Data</Label>
                <p className="text-xs text-gray-500">
                  Include full row data in completion message
                </p>
              </div>
              <Switch
                id="return-data"
                checked={returnData}
                onCheckedChange={setReturnData}
              />
            </div>

            {/* Hide Header Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hide-header">Hide Header</Label>
                <p className="text-xs text-gray-500">
                  Remove padding around the importer
                </p>
              </div>
              <Switch
                id="hide-header"
                checked={hideHeader}
                onCheckedChange={setHideHeader}
              />
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{
                    backgroundColor: isValidColor ? `#${primaryColor}` : "#ccc",
                  }}
                />
                <Input
                  id="primary-color"
                  value={primaryColor}
                  onChange={(e) =>
                    setPrimaryColor(e.target.value.replace(/^#/, ""))
                  }
                  placeholder="0284c7"
                  className={`font-mono ${!isValidColor ? "border-red-500" : ""}`}
                  maxLength={6}
                />
              </div>
              {!isValidColor && primaryColor && (
                <p className="text-xs text-red-500">
                  Enter a valid 6-character hex color
                </p>
              )}
            </div>
          </div>

          {/* Generated Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Embed Code</h3>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs overflow-x-auto max-h-64">
              <code>{iframeCode}</code>
            </pre>
          </div>

          {/* Preview Link */}
          <div className="pt-4 border-t">
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open embed page in new tab
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
