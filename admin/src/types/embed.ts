/**
 * Types for embed page postMessage communication.
 *
 * The embed page uses postMessage to communicate with the parent window
 * for events like import completion, errors, and close requests.
 */

/**
 * Import row data from CSVImporter
 */
export interface ImportRow {
  values: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

/**
 * Import completion data structure
 */
export interface ImportData {
  rows: ImportRow[];
  columns: Array<{ name: string }>;
  num_rows: number;
  num_columns: number;
  success?: boolean;
  message?: string;
  backendResponse?: unknown;
  error?: string;
}

/**
 * Base message type for all embed messages
 */
interface EmbedMessageBase {
  source: 'importcsv-embed';
}

/**
 * Message sent when import is ready (component loaded)
 */
export interface EmbedReadyMessage extends EmbedMessageBase {
  type: 'ready';
}

/**
 * Message sent when import completes successfully
 */
export interface EmbedCompleteMessage extends EmbedMessageBase {
  type: 'complete';
  data: ImportData;
}

/**
 * Message sent when an error occurs
 */
export interface EmbedErrorMessage extends EmbedMessageBase {
  type: 'error';
  error: {
    code: string;
    message: string;
  };
}

/**
 * Message sent when user requests to close the importer
 */
export interface EmbedCloseMessage extends EmbedMessageBase {
  type: 'close';
}

/**
 * Union of all embed message types
 */
export type EmbedMessage =
  | EmbedReadyMessage
  | EmbedCompleteMessage
  | EmbedErrorMessage
  | EmbedCloseMessage;

/**
 * Query parameters supported by the embed page
 */
export interface EmbedQueryParams {
  /** Theme mode: 'light' or 'dark' */
  theme?: 'light' | 'dark';
  /** Whether to return data via postMessage on complete */
  returnData?: 'true' | 'false';
  /** Whether to hide the header */
  hideHeader?: 'true' | 'false';
  /** Primary color for the importer (hex without #) */
  primaryColor?: string;
  /** Origin URL allowed to receive postMessage (required for security) */
  origin?: string;
}

/** Source identifier for embed messages */
export const EMBED_MESSAGE_SOURCE = "importcsv-embed" as const;

/**
 * Validates that a string is a valid origin URL.
 * Must be a valid URL with protocol (http/https) and no path.
 */
export function isValidOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    // Must be http or https
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    // Origin should not have a path (other than /)
    if (url.pathname !== "/" && url.pathname !== "") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to send postMessage to parent window.
 * Requires a valid target origin to prevent data exfiltration.
 *
 * @param message - The message to send
 * @param targetOrigin - The origin allowed to receive the message (must be validated)
 */
export function sendEmbedMessage(
  message: EmbedMessage,
  targetOrigin: string
): void {
  if (typeof window !== "undefined" && window.parent !== window) {
    // Only send if we have a valid target origin
    if (targetOrigin && isValidOrigin(targetOrigin)) {
      window.parent.postMessage(message, targetOrigin);
    }
  }
}
