/**
 * API service for communicating with the ImportCSV backend
 */
import { getApiBaseUrl } from '../config';

// Factory function to create API methods with dynamic base URL
export const createApi = (backendUrl, importerKey) => {
  const API_BASE_URL = getApiBaseUrl(backendUrl, importerKey);
  
  /**
   * Authentication API
   */
  const authApi = {
  /**
   * Login to get access token
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Response with access token
   */
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: email,
        password: password,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Get current user information
   * @param {string} token - Access token
   * @returns {Promise<Object>} - User information
   */
  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.status}`);
    }
    
    return response.json();
  },
  };

  /**
   * Schema API
   */
  const schemaApi = {
  /**
   * Get all schemas
   * @param {string} token - Access token
   * @returns {Promise<Array>} - List of schemas
   */
  getSchemas: async (token) => {
    const response = await fetch(`${API_BASE_URL}/v1/schemas/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get schemas: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Get schema template for CSV importer
   * @param {string} token - Access token
   * @param {number} schemaId - Schema ID
   * @returns {Promise<Object>} - Schema template
   */
  getSchemaTemplate: async (token, schemaId) => {
    const response = await fetch(`${API_BASE_URL}/v1/frontend/schema-template/${schemaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get schema template: ${response.status}`);
    }
    
    return response.json();
  },
  };

  /**
   * Import API
   */
  const importApi = {
  /**
   * Process CSV data from the frontend importer
   * @param {string} token - Access token
   * @param {number} schemaId - Schema ID
   * @param {Object} importData - Data from CSV importer
   * @returns {Promise<Object>} - Import job information
   */
  processCSVData: async (token, schemaId, importData) => {
    const response = await fetch(`${API_BASE_URL}/v1/frontend/process-csv-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schema_id: schemaId,
        validData: importData.validData,
        invalidData: importData.invalidData,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process import: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Get import job status
   * @param {string} token - Access token
   * @param {number} jobId - Import job ID
   * @returns {Promise<Object>} - Import job status
   */
  getImportJobStatus: async (token, jobId) => {
    const response = await fetch(`${API_BASE_URL}/v1/imports/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get import job status: ${response.status}`);
    }
    
    return response.json();
  },
  };

  // Return all APIs
  return {
    auth: authApi,
    schema: schemaApi,
    import: importApi,
  };
};

// Export default for backward compatibility
export default createApi;
