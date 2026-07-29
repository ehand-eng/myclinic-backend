/**
 * Global API configuration
 *
 * This is the single source of truth for backend API URLs.
 * Vite statically replaces import.meta.env.* at build time,
 * so this works correctly for both local development and S3 deployments.
 *
 * Set VITE_API_BASE_URL in your .env file to override.
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://myclinic-backend-uyu3.onrender.com';

// Strip any trailing slashes, and strip a trailing '/api' if the user accidentally included it in their environment variable.
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

/** Full URL including /api suffix — use this for most API calls */
export const API_URL = `${API_BASE_URL}/api`;
