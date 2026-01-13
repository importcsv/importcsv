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
}

/**
 * Helper to send postMessage to parent window
 */
export function sendEmbedMessage(message: EmbedMessage): void {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage(message, '*');
  }
}
