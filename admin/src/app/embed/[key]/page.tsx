import { notFound } from "next/navigation";
import EmbedClient from "./EmbedClient";
import { isValidOrigin, type EmbedQueryParams } from "@/types/embed";

interface EmbedPageProps {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Use BACKEND_URL for server-side calls (Docker internal), fallback to NEXT_PUBLIC for dev
const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/**
 * Validates that the key is a valid UUID format.
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Reserved query params that are NOT passed to context.
 * These are used for embed configuration only.
 */
const RESERVED_PARAMS = ['theme', 'primaryColor', 'returnData', 'hideHeader', 'origin'];

/**
 * Validates that the importer exists by calling the backend API.
 * Returns the importer data if valid, null otherwise.
 */
async function validateImporter(
  importerKey: string
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/imports/key/schema?importer_key=${importerKey}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // Don't cache - we need fresh validation
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch {
    return null;
  }
}

/**
 * Server component for the embed page.
 *
 * This page renders the CSVImporter component in an embeddable format
 * designed to be loaded in an iframe. It supports query parameters for
 * customization and uses postMessage for parent window communication.
 *
 * SECURITY: The 'origin' parameter is REQUIRED. postMessage will only
 * send data to the specified origin to prevent data exfiltration.
 *
 * Supported query params:
 * - origin: (REQUIRED) The parent window origin for postMessage security
 * - theme: 'light' | 'dark'
 * - returnData: 'true' | 'false' (whether to include row data in complete message)
 * - hideHeader: 'true' | 'false'
 * - primaryColor: hex color without # (e.g., '0284c7')
 */
export default async function EmbedPage({
  params,
  searchParams,
}: EmbedPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { key } = resolvedParams;

  // Validate importer key format
  if (!isValidUUID(key)) {
    notFound();
  }

  // Origin parameter is optional for no-code embeds (data goes to Supabase/webhook)
  // When provided, it's used for postMessage to send data back to parent
  const originParam =
    typeof resolvedSearchParams.origin === "string" && isValidOrigin(resolvedSearchParams.origin)
      ? resolvedSearchParams.origin
      : null;

  // Validate importer exists in the database
  const importer = await validateImporter(key);
  if (!importer) {
    notFound();
  }

  // Extract and validate query params
  const embedParams: EmbedQueryParams = {
    theme:
      resolvedSearchParams.theme === "dark" ||
      resolvedSearchParams.theme === "light"
        ? resolvedSearchParams.theme
        : undefined,
    returnData:
      resolvedSearchParams.returnData === "true" ||
      resolvedSearchParams.returnData === "false"
        ? resolvedSearchParams.returnData
        : undefined,
    hideHeader:
      resolvedSearchParams.hideHeader === "true" ||
      resolvedSearchParams.hideHeader === "false"
        ? resolvedSearchParams.hideHeader
        : undefined,
    primaryColor:
      typeof resolvedSearchParams.primaryColor === "string"
        ? resolvedSearchParams.primaryColor.replace(/^#/, "")
        : undefined,
  };

  // Extract context from remaining query params (exclude reserved ones)
  const context: Record<string, string> = {};
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (!RESERVED_PARAMS.includes(key) && typeof value === 'string') {
      context[key] = value;
    }
  }

  return (
    <EmbedClient
      importerKey={key}
      params={embedParams}
      targetOrigin={originParam || undefined}
      context={context}
    />
  );
}

/**
 * Metadata for the embed page.
 * We don't want search engines indexing embed pages.
 */
export const metadata = {
  title: "ImportCSV Embed",
  robots: "noindex, nofollow",
};
