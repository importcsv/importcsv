/**
 * API client with axios for communicating with the ImportCSV backend.
 * Uses HTTP-only cookies for authentication (no manual token management).
 */
import axios from "axios";

// Base URL for API requests
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
});

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Redirect to signin on 401 (unauthorized)
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Avoid redirect loops on auth pages
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/signin";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Destination types
 */
export interface DestinationCreate {
  destination_type?: "supabase" | "webhook";
  integration_id?: string;
  table_name?: string;
  column_mapping?: Record<string, string>;
  context_mapping?: Record<string, string>;
  webhook_url?: string;
}

export interface DestinationResponse {
  id: string;
  importer_id: string;
  destination_type: "supabase" | "webhook";
  integration_id: string | null;
  table_name: string | null;
  column_mapping: Record<string, string>;
  context_mapping: Record<string, string>;
  webhook_url: string | null;
  signing_secret: string | null;
  created_at: string;
  updated_at: string | null;
  integration_name: string | null;
  integration_type: "supabase" | "webhook" | null;
}

export interface CategorizedColumns {
  hidden: SupabaseColumnSchema[];
  context: SupabaseColumnSchema[];
  mapped: SupabaseColumnSchema[];
}

/**
 * Schema inference types
 */
export interface InferredColumn {
  name: string;
  display_name: string;
  type: string;
  options?: string[];
}

export interface InferSchemaResponse {
  columns: InferredColumn[];
}

/**
 * Importers API
 */
export const importersApi = {
  getImporters: async () => {
    const response = await apiClient.get("/importers/");
    return response.data;
  },

  getImporter: async (importerId: string) => {
    const response = await apiClient.get(`/importers/${importerId}`);
    return response.data;
  },

  createImporter: async (importerData: any) => {
    const response = await apiClient.post("/importers/", importerData);
    return response.data;
  },

  updateImporter: async (importerId: string, importerData: any) => {
    const response = await apiClient.put(`/importers/${importerId}`, importerData);
    return response.data;
  },

  deleteImporter: async (importerId: string) => {
    const response = await apiClient.delete(`/importers/${importerId}`);
    return response.data;
  },

  // Destination management
  getDestination: async (importerId: string): Promise<DestinationResponse | null> => {
    const response = await apiClient.get(`/importers/${importerId}/destination`);
    return response.data;
  },

  setDestination: async (importerId: string, data: DestinationCreate): Promise<DestinationResponse> => {
    const response = await apiClient.put(`/importers/${importerId}/destination`, data);
    return response.data;
  },

  deleteDestination: async (importerId: string): Promise<void> => {
    await apiClient.delete(`/importers/${importerId}/destination`);
  },

  // Schema inference
  inferSchema: async (data: Record<string, string>[]): Promise<InferSchemaResponse> => {
    const response = await apiClient.post<InferSchemaResponse>("/importers/infer-schema", { data });
    return response.data;
  },

  // Webhook testing and delivery logs
  testWebhook: async (importerId: string) => {
    const response = await apiClient.post(`/importers/${importerId}/destination/test`);
    return response.data;
  },

  getDeliveries: async (importerId: string, limit: number = 10) => {
    const response = await apiClient.get(`/importers/${importerId}/destination/deliveries`, {
      params: { limit },
    });
    return response.data;
  },
};

/**
 * Imports API
 */
export const importsApi = {
  getImports: async () => {
    const response = await apiClient.get("/imports");
    return response.data;
  },

  getImport: async (importId: string) => {
    const response = await apiClient.get(`/imports/${importId}`);
    return response.data;
  },
};

/**
 * Usage API
 */
export const usageApi = {
  getCurrent: async () => {
    const response = await apiClient.get("/usage/current");
    return response.data;
  },

  getHistory: async (months = 6) => {
    const response = await apiClient.get(`/usage/history?months=${months}`);
    return response.data;
  },

  getFeatures: async () => {
    const response = await apiClient.get("/usage/features");
    return response.data;
  },
};

/**
 * Integrations API
 */
export interface IntegrationCredentials {
  url: string;
  service_key?: string;
  headers?: Record<string, string>;
}

export interface IntegrationCreate {
  name: string;
  type: "supabase" | "webhook";
  credentials: IntegrationCredentials;
}

export interface IntegrationUpdate {
  name?: string;
  credentials?: IntegrationCredentials;
}

export interface Integration {
  id: string;
  name: string;
  type: "supabase" | "webhook";
  created_at: string;
  updated_at: string | null;
}

export interface IntegrationWithSecret extends Integration {
  webhook_secret: string | null;
}

export interface SupabaseColumnSchema {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
}

export interface SupabaseTableSchema {
  table_name: string;
  columns: SupabaseColumnSchema[];
}

export const integrationsApi = {
  getIntegrations: async (): Promise<Integration[]> => {
    const response = await apiClient.get("/integrations/");
    return response.data;
  },

  getIntegration: async (integrationId: string): Promise<Integration> => {
    const response = await apiClient.get(`/integrations/${integrationId}`);
    return response.data;
  },

  createIntegration: async (data: IntegrationCreate): Promise<Integration> => {
    const response = await apiClient.post("/integrations/", data);
    return response.data;
  },

  updateIntegration: async (integrationId: string, data: IntegrationUpdate): Promise<Integration> => {
    const response = await apiClient.patch(`/integrations/${integrationId}`, data);
    return response.data;
  },

  deleteIntegration: async (integrationId: string): Promise<void> => {
    await apiClient.delete(`/integrations/${integrationId}`);
  },

  getWebhookSecret: async (integrationId: string): Promise<IntegrationWithSecret> => {
    const response = await apiClient.get(`/integrations/${integrationId}/secret`);
    return response.data;
  },

  // Supabase introspection
  getSupabaseTables: async (integrationId: string): Promise<{ tables: string[] }> => {
    const response = await apiClient.get(`/integrations/${integrationId}/supabase/tables`);
    return response.data;
  },

  getSupabaseTableSchema: async (integrationId: string, tableName: string): Promise<SupabaseTableSchema> => {
    const response = await apiClient.get(`/integrations/${integrationId}/supabase/tables/${tableName}/schema`);
    return response.data;
  },

  getCategorizedColumns: async (integrationId: string, tableName: string): Promise<CategorizedColumns> => {
    const response = await apiClient.get(`/integrations/${integrationId}/supabase/tables/${tableName}/categorized-columns`);
    return response.data;
  },
};

/**
 * Webhooks API
 */
export interface WebhookTestResult {
  success: boolean;
  status_code: number | null;
  duration_ms: number;
  error: string | null;
}

export const webhooksApi = {
  testUrl: async (url: string): Promise<WebhookTestResult> => {
    const response = await apiClient.post<WebhookTestResult>("/webhooks/test", { url });
    return response.data;
  },
};

/**
 * Billing API (cloud mode only)
 */
export const billingApi = {
  getSubscription: async () => {
    const response = await apiClient.get("/billing/subscription");
    return response.data;
  },

  createCheckout: async () => {
    const response = await apiClient.post("/billing/checkout");
    return response.data;
  },

  createPortal: async () => {
    const response = await apiClient.post("/billing/portal");
    return response.data;
  },
};

// Export the axios instance as default and named
export default apiClient;
export { apiClient };
