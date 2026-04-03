/**
 * Global API configuration
 *
 * This is the single source of truth for backend API URLs.
 * Vite statically replaces import.meta.env.* at build time,
 * so this works correctly for both local development and S3 deployments.
 *
 * Set VITE_API_BASE_URL in your .env file to override.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://myclinic-backend-uyu3.onrender.com';

/** Full URL including /api suffix — use this for most API calls */
export const API_URL = `${API_BASE_URL}/api`;
