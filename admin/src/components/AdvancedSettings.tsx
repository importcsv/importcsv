'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CollapsibleSection from './CollapsibleSection';
import { Settings } from 'lucide-react';

interface AdvancedSettingsProps {
  name: string;
  onNameChange: (name: string) => void;
  webhookEnabled: boolean;
  onWebhookEnabledChange: (enabled: boolean) => void;
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
  webhookError?: string | null;
  includeUnmatchedColumns: boolean;
  onIncludeUnmatchedColumnsChange: (include: boolean) => void;
  filterInvalidRows: boolean;
  onFilterInvalidRowsChange: (filter: boolean) => void;
  disableOnInvalidRows: boolean;
  onDisableOnInvalidRowsChange: (disable: boolean) => void;
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}

export function AdvancedSettings({
  name,
  onNameChange,
  webhookEnabled,
  onWebhookEnabledChange,
  webhookUrl,
  onWebhookUrlChange,
  webhookError,
  includeUnmatchedColumns,
  onIncludeUnmatchedColumnsChange,
  filterInvalidRows,
  onFilterInvalidRowsChange,
  disableOnInvalidRows,
  onDisableOnInvalidRowsChange,
  darkMode,
  onDarkModeChange,
}: AdvancedSettingsProps) {
  return (
    <CollapsibleSection
      title="Advanced Settings"
      description="Webhook, processing rules, appearance"
      icon={<Settings className="h-5 w-5" />}
      defaultOpen={false}
    >
      <div className="space-y-8">
        {/* Importer Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Importer Details
          </h3>
          <div className="space-y-2">
            <Label htmlFor="importer-name">Name</Label>
            <Input
              id="importer-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter importer name"
              className="max-w-md"
            />
          </div>
        </div>

        {/* Webhook */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Webhook
          </h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="webhook-enabled">Enable Webhook</Label>
            <Switch
              id="webhook-enabled"
              checked={webhookEnabled}
              onCheckedChange={onWebhookEnabledChange}
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
                value={webhookUrl}
                onChange={(e) => onWebhookUrlChange(e.target.value)}
                placeholder="https://api.example.com/webhook"
                className={webhookError ? 'border-red-500' : ''}
              />
              {webhookError && (
                <p className="text-sm text-red-500">{webhookError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Data will be sent here after import completes
              </p>
            </div>
          )}
        </div>

        {/* Processing Rules */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Processing Rules
          </h3>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Include unmatched columns</Label>
              <p className="text-sm text-muted-foreground">
                Import columns even if they don&apos;t match schema
              </p>
            </div>
            <Switch
              checked={includeUnmatchedColumns}
              onCheckedChange={onIncludeUnmatchedColumnsChange}
            />
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Filter invalid rows</Label>
              <p className="text-sm text-muted-foreground">
                Skip rows that fail validation
              </p>
            </div>
            <Switch
              checked={filterInvalidRows}
              onCheckedChange={onFilterInvalidRowsChange}
            />
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Block import on invalid rows</Label>
              <p className="text-sm text-muted-foreground">
                Require all rows to pass validation
              </p>
            </div>
            <Switch
              checked={disableOnInvalidRows}
              onCheckedChange={onDisableOnInvalidRowsChange}
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Appearance
          </h3>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Dark mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark theme for the importer UI
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={onDarkModeChange}
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
