import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Request interceptor to automatically add headers
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Axios Interceptor - Processing request:', config.url);
    
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {};
    }

    // Add Authorization header if token exists (check both localStorage and sessionStorage)
    let token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Added Authorization header');
    } else {
      console.warn('⚠️ No auth token found in localStorage or sessionStorage');
    }

    // Add X-User-Role header if user exists (check both localStorage and sessionStorage)
    try {
      let userStr = localStorage.getItem('current_user') || sessionStorage.getItem('current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userRole = user?.role;
        if (userRole) {
          config.headers['X-User-Role'] = userRole;
          console.log('✅ Added X-User-Role header:', userRole);
        } else {
          console.warn('⚠️ User object exists but no role property found:', user);
        }
        
        // Comprehensive debug logging for ALL requests (not just reports)
        console.log('🔧 Request Details:', {
          url: config.url,
          method: config.method?.toUpperCase(),
          hasToken: !!token,
          userRole: userRole || 'MISSING',
          headers: {
            'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'MISSING',
            'X-User-Role': userRole || 'MISSING',
            'Content-Type': config.headers['Content-Type'] || 'not-set'
          }
        });

        // Special logging for report endpoints
        if (config.url && (config.url.includes('/reports') || config.url.includes('/channel-partners'))) {
          console.log('📊 REPORT REQUEST - Headers verification:', {
            endpoint: config.url,
            'X-User-Role': config.headers['X-User-Role'] || 'NOT SET',
            'Authorization': config.headers.Authorization ? 'SET' : 'NOT SET',
            userFromStorage: userRole || 'NOT FOUND'
          });
        }
      } else {
        console.warn('⚠️ No current_user found in localStorage or sessionStorage for:', config.url);
      }
    } catch (error) {
      console.error('❌ Error parsing user data for headers:', error);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;