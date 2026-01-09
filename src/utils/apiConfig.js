/**
 * API Configuration Utility
 * Handles API base URL with proper path management
 */

/**
 * Get the base API URL without trailing slashes or /api
 * @returns {string} Base API URL
 */
export const getApiBaseUrl = () => {
  let baseUrl;
  let source;

  // Priority 1: Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    baseUrl = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    // Remove /api if it exists at the end (to prevent double /api/api)
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    }
    source = 'VITE_API_URL env var';
  }
  // Priority 2: Runtime check - If running on Vercel or non-local environment, use production URL
  else if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If not localhost, always use production backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168.') && !hostname.includes('10.')) {
      baseUrl = 'https://bearthai-backend.vercel.app';
      source = `hostname: ${hostname}`;
    }
  }
  // Priority 3: Check build mode
  if (!baseUrl && import.meta.env.MODE === 'production') {
    baseUrl = 'https://bearthai-backend.vercel.app';
    source = 'production mode';
  }
  // Priority 4: Default to localhost for development
  if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
    source = 'default (dev)';
  }

  // Debug logging (only in development)
  if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
    console.log(`[API Config] Using backend URL: ${baseUrl} (source: ${source})`);
  }

  return baseUrl;
};

/**
 * Get full API URL for a specific endpoint
 * Automatically adds /api prefix if not already in base URL
 * @param {string} endpoint - API endpoint (e.g., '/auth/login' or 'auth/login')
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();

  // Remove leading slash from endpoint if exists
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure /api is included
  const apiPath = cleanEndpoint.startsWith('api/')
    ? cleanEndpoint
    : `api/${cleanEndpoint}`;

  return `${baseUrl}/${apiPath}`;
};

/**
 * API Base URL constant (for backward compatibility)
 */
export const API_BASE_URL = getApiBaseUrl();

