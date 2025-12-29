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

// Export the axios instance as default and named
export default apiClient;
export { apiClient };
