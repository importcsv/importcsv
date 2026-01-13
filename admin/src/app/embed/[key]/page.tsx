import { notFound } from "next/navigation";
import EmbedClient from "./EmbedClient";
import type { EmbedQueryParams } from "@/types/embed";

interface EmbedPageProps {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Validates that the key is a valid UUID format.
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Server component for the embed page.
 *
 * This page renders the CSVImporter component in an embeddable format
 * designed to be loaded in an iframe. It supports query parameters for
 * customization and uses postMessage for parent window communication.
 *
 * Supported query params:
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

  return <EmbedClient importerKey={key} params={embedParams} />;
}

/**
 * Metadata for the embed page.
 * We don't want search engines indexing embed pages.
 */
export const metadata = {
  title: "ImportCSV Embed",
  robots: "noindex, nofollow",
};
