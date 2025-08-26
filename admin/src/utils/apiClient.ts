/**
 * API client with axios for communicating with the ImportCSV backend
 * Includes automatic token refresh functionality
 */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";


// Base URL for API requests
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});


// Global token getter function that can be set from outside
let globalTokenGetter: () => Promise<string | null> = async () => {
  return null;
};

// Function to set the token getter
export const setTokenGetter = (getter: () => Promise<string | null>) => {
  globalTokenGetter = getter;
};

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get the token using the global token getter
      const token = await globalTokenGetter();
      
      // Add the token to the request headers if available
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      // Token retrieval failed, continue without token
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // If we get a 401, redirect to signin page
    if (error.response?.status === 401) {
      // Only redirect in browser environment
      if (typeof window !== "undefined") {
        window.location.href = "/auth/signin";
      }
    }
    
    return Promise.reject(error);
  },
);


/**
 * Importers API
 */
export const importersApi = {
  /**
   * Get all importers
   * @returns List of importers
   */
  getImporters: async () => {
    const response = await apiClient.get("/importers/");
    return response.data;
  },

  /**
   * Get a single importer by ID
   * @param importerId - Importer ID
   * @returns Importer details
   */
  getImporter: async (importerId: string) => {
    const response = await apiClient.get(`/importers/${importerId}`);
    return response.data;
  },

  /**
   * Create a new importer
   * @param importerData - Importer data
   * @returns Created importer
   */
  createImporter: async (importerData: any) => {
    const response = await apiClient.post("/importers/", importerData);
    return response.data;
  },

  /**
   * Update an existing importer
   * @param importerId - Importer ID
   * @param importerData - Updated importer data
   * @returns Updated importer
   */
  updateImporter: async (importerId: string, importerData: any) => {
    const response = await apiClient.put(
      `/importers/${importerId}`,
      importerData,
    );
    return response.data;
  },

  /**
   * Delete an importer
   * @param importerId - Importer ID
   * @returns Success message
   */
  deleteImporter: async (importerId: string) => {
    const response = await apiClient.delete(`/importers/${importerId}`);
    return response.data;
  },
};

/**
 * Imports API
 */
export const importsApi = {
  /**
   * Get all import jobs
   * @returns List of import jobs
   */
  getImports: async () => {
    const response = await apiClient.get("/imports");
    return response.data;
  },

  /**
   * Get a single import job by ID
   * @param importId - Import job ID
   * @returns Import job details
   */
  getImport: async (importId: string) => {
    const response = await apiClient.get(`/imports/${importId}`);
    return response.data;
  },
};

// Export all APIs and the axios instance
export default {
  client: apiClient,
  importers: importersApi,
  imports: importsApi,
};
