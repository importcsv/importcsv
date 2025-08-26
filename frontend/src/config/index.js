/**
 * Configuration file for environment-specific settings
 */

/**
 * Get the API base URL
 * @param {string} backendUrl - Explicit backend URL from props
 * @returns {string} The API base URL to use
 */
export const getApiBaseUrl = (backendUrl) => {
  // Use provided URL or default to production API
  return backendUrl || 'https://api.importcsv.com';
};

// Export configuration
export default {
  getApiBaseUrl,
  // Add other configuration settings here
};
