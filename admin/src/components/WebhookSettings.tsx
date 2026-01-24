import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ExternalLink } from 'lucide-react';

interface WebhookSettingsProps {
  webhookEnabled: boolean;
  webhookUrl: string;
  onWebhookEnabledChange: (enabled: boolean) => void;
  onWebhookUrlChange: (url: string) => void;
  validationError?: string;
}

export default function WebhookSettings({
  webhookEnabled,
  webhookUrl,
  onWebhookEnabledChange,
  onWebhookUrlChange,
  validationError,
}: WebhookSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where to Send Uploaded Data</CardTitle>
        <CardDescription>
          Choose how we send uploaded data to your app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="webhook-enabled">Webhook</Label>
          <Switch
            id="webhook-enabled"
            checked={webhookEnabled}
            onCheckedChange={onWebhookEnabledChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook-url">
            Webhook URL
            {webhookEnabled && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id="webhook-url"
            placeholder="E.g. https://api.myapp.com/myendpoint"
            value={webhookUrl}
            onChange={(e) => onWebhookUrlChange(e.target.value)}
            required={webhookEnabled}
            className={validationError ? "border-red-500 focus:border-red-500" : ""}
            data-ph-mask
          />
          {validationError && (
            <p className="text-sm text-red-500 mt-1">{validationError}</p>
          )}
          <p className="text-sm text-zinc-500">
            Uploaded data will be sent to our servers, and we will send
            you a webhook with the data.
            <Link
              href="#"
              className="text-indigo-600 hover:text-indigo-700 ml-1"
            >
              Webhook docs <ExternalLink className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}