# PostHog Session Recordings for Cloud

**Date:** 2025-01-23
**Status:** Approved
**Scope:** Cloud-only session recordings with minimal masking

## Goals

Enable PostHog session recordings for the cloud version of ImportCSV admin dashboard to understand how users interact with the product.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Cloud-only | We control the data and privacy |
| Masking | Minimal | PostHog defaults + manual mask for secrets |
| Coverage | All sessions | Maximum learning at early stage |
| CSV preview | Unmasked | Helps understand mapping confusion |

## Implementation

### 1. Configuration Changes

Modify `src/components/PostHogProvider.tsx`:

- Gate session recording on cloud mode (not just production)
- Add custom mask selector for sensitive elements
- Add user identification when authenticated

```typescript
// Gate on cloud mode
disable_session_recording:
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_IMPORTCSV_CLOUD !== "true"

// Mask selector
session_recording: {
  maskAllInputs: true,
  maskTextSelector: "[data-ph-mask]",
}
```

### 2. Mask Sensitive Elements

Add `data-ph-mask` attribute to:

| Component | Element |
|-----------|---------|
| `CopyableInput.tsx` | API key display input |
| `WebhookSettings.tsx` | Webhook secret inputs |
| `SupabaseTablePicker.tsx` | Connection string input |

### 3. User Identification

Add `posthog.identify()` call when user authenticates:

```typescript
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  plan: user.plan,
  created_at: user.createdAt,
})
```

Reset on logout with `posthog.reset()`.

### 4. Environment Variables

Required in cloud deployment:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_IMPORTCSV_CLOUD=true
```

## Files to Modify

1. `admin/src/components/PostHogProvider.tsx` - Main changes
2. `admin/src/components/CopyableInput.tsx` - Add mask attribute
3. `admin/src/components/WebhookSettings.tsx` - Add mask attribute
4. `admin/src/components/SupabaseTablePicker.tsx` - Add mask attribute

## Verification

1. Deploy to cloud environment
2. Navigate around the dashboard
3. Check PostHog → Recordings for captured session
4. Verify masked fields show `***` in playback
