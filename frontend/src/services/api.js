import axios from 'axios';
import { API_URL, TOKEN_KEY, STORE_KEY } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - add auth token and shop domain
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add shop domain header as fallback if store info is available
    try {
      const storeInfo = localStorage.getItem(STORE_KEY);
      if (storeInfo) {
        const store = JSON.parse(storeInfo);
        if (store.shopDomain) {
          config.headers['X-Shopify-Shop-Domain'] = store.shopDomain;
        }
      }
    } catch (error) {
      // Silently fail - invalid store info in localStorage
    }
    
    // Store request start time for duration calculation
    config.metadata = { startTime: new Date() };
    
    // Build full URL
    const fullUrl = config.baseURL 
      ? `${config.baseURL}${config.url}` 
      : config.url;
    
    // Mask Authorization token for security (show first 10 and last 4 chars)
    const maskedHeaders = { ...config.headers };
    if (maskedHeaders.Authorization) {
      const authValue = maskedHeaders.Authorization;
      if (authValue.length > 20) {
        maskedHeaders.Authorization = `${authValue.substring(0, 10)}...${authValue.substring(authValue.length - 4)}`;
      } else {
        maskedHeaders.Authorization = '***masked***';
      }
    }
    
    // Log request details (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Request]', {
        method: config.method?.toUpperCase() || 'GET',
        url: fullUrl,
        headers: maskedHeaders,
        params: config.params || null,
        data: config.data || null,
        timestamp: new Date().toISOString(),
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const startTime = response.config?.metadata?.startTime;
    const duration = startTime ? new Date() - startTime : null;
    
    // Build full URL
    const fullUrl = response.config.baseURL 
      ? `${response.config.baseURL}${response.config.url}` 
      : response.config.url;
    
    // Log successful response (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Response]', {
        method: response.config.method?.toUpperCase() || 'GET',
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        duration: duration ? `${duration}ms` : 'N/A',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Backend returns { success: true, data: {...} }
    // Extract the data object for easier access in components
    if (response.data && response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    // Fallback: return the full response if structure is different
    return response.data;
  },
  (error) => {
    // Calculate request duration
    const startTime = error.config?.metadata?.startTime;
    const duration = startTime ? new Date() - startTime : null;
    
    // Build full URL
    const fullUrl = error.config?.baseURL 
      ? `${error.config.baseURL}${error.config.url}` 
      : error.config?.url || 'N/A';
    
    // Handle network errors
    if (!error.response) {
      // Always log errors (even in production)
      console.error('[API Error]', {
        method: error.config?.method?.toUpperCase() || 'GET',
        url: fullUrl,
        status: 0,
        statusText: 'Network Error',
        error: error.message,
        code: error.code,
        data: null,
        duration: duration ? `${duration}ms` : 'N/A',
        timestamp: new Date().toISOString(),
      });
      
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.',
        status: 0,
        data: null,
        isNetworkError: true,
      });
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Always log errors (even in production)
      console.error('[API Error]', {
        method: error.config?.method?.toUpperCase() || 'GET',
        url: fullUrl,
        status: 408,
        statusText: 'Request Timeout',
        error: error.message,
        code: error.code,
        data: error.response?.data || null,
        duration: duration ? `${duration}ms` : 'N/A',
        timestamp: new Date().toISOString(),
      });
      
      return Promise.reject({
        message: 'Request timeout. Please try again.',
        status: 408,
        data: error.response?.data,
        isTimeoutError: true,
      });
    }

    // Log error response (always log errors, even in production)
    console.error('[API Error]', {
      method: error.config?.method?.toUpperCase() || 'GET',
      url: fullUrl,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.message,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      duration: duration ? `${duration}ms` : 'N/A',
      timestamp: new Date().toISOString(),
    });

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('sendly_store_info');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/';
      }
    }
    
    // Extract error message from backend response
    // Backend format: { success: false, error: 'error_code', message: 'error message', details?: [...] }
    let errorMessage = error.message || 'An error occurred';
    let errorDetails = null;
    
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Try to extract message from backend error format
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        // If no message, use error code as fallback
        errorMessage = errorData.error;
      }
      
      // Extract validation details if present
      if (errorData.details && Array.isArray(errorData.details)) {
        errorDetails = errorData.details;
        // If validation errors, create a more descriptive message
        if (errorData.details.length > 0) {
          const firstError = errorData.details[0];
          if (firstError.field && firstError.message) {
            errorMessage = `${firstError.field}: ${firstError.message}`;
          } else if (firstError.message) {
            errorMessage = firstError.message;
          }
        }
      }
    }
    
    // Return error in consistent format
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      details: errorDetails,
      code: error.response?.data?.error,
    });
  }
);

export default api;

