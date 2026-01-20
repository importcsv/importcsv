# Integrations Documentation Design

## Overview

Add documentation for Supabase and Webhooks integrations to the docs site.

## Structure

New section under `/docs/integrations/`:

```
docs/content/docs/integrations/
├── index.mdx      (Overview page with cards)
├── supabase.mdx   (Supabase destination setup)
└── webhooks.mdx   (Webhook notifications setup)
```

## Audience

Cloud users enabling features via the dashboard. Focus on getting up and running, not implementation details.

---

## Content

### `integrations/index.mdx`

```mdx
---
title: Integrations
description: Connect ImportCSV to your existing tools and workflows
---

ImportCSV integrates with your existing stack to send data where it needs to go and notify you when imports complete.

## Destinations

Send imported data directly to your database or service.

<Cards>
  <Card title="Supabase" href="/docs/integrations/supabase">
    Write imported rows directly to your Supabase tables
  </Card>
</Cards>

## Notifications

Get notified when imports start, complete, or fail.

<Cards>
  <Card title="Webhooks" href="/docs/integrations/webhooks">
    Send HTTP POST notifications to your server
  </Card>
</Cards>
```

---

### `integrations/supabase.mdx`

```mdx
---
title: Supabase
description: Send imported data directly to your Supabase tables
---

Connect your importer to Supabase to write imported rows directly to your database tables.

## What you'll need

- A Supabase project with a table ready to receive data
- Your project URL (e.g., `https://xyz.supabase.co`)
- A service role key (found in Project Settings → API)

<Callout type="info">
  Use the **service role key**, not the anon key. The service role key bypasses Row Level Security, which is required for server-side inserts.
</Callout>

## Setup

[VIDEO PLACEHOLDER]

1. Open your importer in the ImportCSV dashboard
2. Go to **Destination** and select **Supabase**
3. Enter your project URL and service role key
4. Select the table you want to import data into
5. Map your CSV columns to table columns (exact matches are mapped automatically)
6. Save your importer

That's it—imported data will now flow directly to your Supabase table.

## Column mapping

ImportCSV automatically maps columns when names match exactly. For columns that don't match, you can manually select which CSV column maps to which table column.

**Context columns** let you inject values that aren't in the CSV, like `user_id` or `organization_id`. These are passed from your app when initializing the importer.
```

---

### `integrations/webhooks.mdx`

```mdx
---
title: Webhooks
description: Get notified when imports complete
---

Webhooks notify your server when imports start, complete, or fail—useful for triggering downstream workflows.

## What you'll need

- An HTTPS endpoint that accepts POST requests

## Setup

[VIDEO PLACEHOLDER]

1. Open your importer in the ImportCSV dashboard
2. Go to **Destination** and select **Webhook**
3. Enter your endpoint URL
4. Copy the signing secret (you'll need this to verify requests)
5. Click **Test** to verify your endpoint works
6. Save your importer

## Payload format

Your endpoint will receive a JSON payload like this:

```json
{
  "event": "import.completed",
  "import_id": "abc123",
  "status": "success",
  "timestamp": "2024-01-15T10:30:00Z",
  "row_count": 150,
  "processed_rows": 150,
  "error_count": 0
}
```

Events: `import.started`, `import.completed`, `import.failed`

## Verifying signatures

Each request includes an `X-ImportCSV-Signature` header. Verify it to ensure the request came from ImportCSV:

```typescript
import crypto from 'crypto';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```
```

---

## Implementation Notes

- Video placeholders marked with `[VIDEO PLACEHOLDER]` for user to add screen recordings
- Navigation: Add "Integrations" section to sidebar after "Self-Hosting"
- Uses existing Fumadocs components (`<Cards>`, `<Card>`, `<Callout>`)
