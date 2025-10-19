/**
 * Sendly Marketing API Client - Production Ready
 * Integrates with backend using X-Shopify-Shop-Domain authentication
 * Optimized for Shopify App production environment
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Environment-based configuration with fallbacks
const BASE_URL = (() => {
  // 1. Check for explicit environment variable
  if (typeof window !== 'undefined' && window.ENV?.API_BASE_URL) {
    return window.ENV.API_BASE_URL;
  }
  
  // 2. Check for process.env (Node.js environment)
  if (typeof process !== 'undefined' && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // 3. Production fallback
  if (typeof window !== 'undefined' && window.location?.hostname !== 'localhost') {
    return 'https://sendly-marketing-backend.onrender.com';
  }
  
  // 4. Development fallback
  return 'http://localhost:3000';
})();

const DEFAULT_HEADERS = { 
  "Content-Type": "application/json",
  "Accept": "application/json",
  "X-Requested-With": "XMLHttpRequest"
};

// Production configuration
const CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  enableLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true,
};

// ============================================================================
// SHOP DOMAIN DETECTION
// ============================================================================

/**
 * Get shop domain from Shopify context
 * Production-ready with comprehensive fallback methods
 */
function getShopDomain() {
  if (typeof window === 'undefined') return null;
  
  const debugInfo = {
    hostname: window.location.hostname,
    href: window.location.href,
    hasShopify: !!window.shopify,
    hasEnv: !!window.ENV,
    hasSessionStorage: typeof sessionStorage !== 'undefined',
  };
  
  if (CONFIG.enableLogging) {
    console.log('🔍 Detecting shop domain...', debugInfo);
  }
  
  // Method 1: Session Storage (App Bridge config) - PRIMARY METHOD
  try {
    const appBridgeConfig = sessionStorage.getItem('app-bridge-config');
    if (appBridgeConfig) {
      const config = JSON.parse(appBridgeConfig);
      if (config.shop && typeof config.shop === 'string') {
        const shopDomain = normalizeShopDomain(config.shop);
        if (CONFIG.enableLogging) {
          console.log('✅ Shop domain from Session Storage:', shopDomain);
        }
        return shopDomain;
      }
    }
  } catch (e) {
    if (CONFIG.enableLogging) {
      console.warn('Failed to read app-bridge-config from session storage:', e);
    }
  }
  
  // Method 2: App Bridge (window.shopify)
  if (window.shopify?.config?.shop?.myshopifyDomain) {
    const shopDomain = normalizeShopDomain(window.shopify.config.shop.myshopifyDomain);
    if (CONFIG.enableLogging) {
      console.log('✅ Shop domain from App Bridge:', shopDomain);
    }
    return shopDomain;
  }
  
  // Method 3: Global ENV
  if (window.ENV?.SHOP_DOMAIN) {
    const shopDomain = normalizeShopDomain(window.ENV.SHOP_DOMAIN);
    if (CONFIG.enableLogging) {
      console.log('✅ Shop domain from ENV:', shopDomain);
    }
    return shopDomain;
  }
  
  // Method 4: URL path extraction (embedded apps)
  const currentUrl = window.location.href;
  const pathMatch = currentUrl.match(/\/store\/([^\/]+)\//);
  
  if (pathMatch && pathMatch[1]) {
    const shopDomain = normalizeShopDomain(pathMatch[1]);
    if (CONFIG.enableLogging) {
      console.log('✅ Shop domain from URL path:', shopDomain);
    }
    return shopDomain;
  }
  
  // Method 5: Shopify global object
  if (window.Shopify?.shop) {
    const shopDomain = normalizeShopDomain(window.Shopify.shop);
    if (CONFIG.enableLogging) {
      console.log('✅ Shop domain from Shopify global:', shopDomain);
    }
    return shopDomain;
  }
  
  // Method 6: Development fallback
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    if (CONFIG.enableLogging) {
      console.log('✅ Using development fallback shop domain');
    }
    return 'sms-blossom-dev.myshopify.com';
  }
  
  // Method 7: Production fallback
  if (CONFIG.enableLogging) {
    console.warn('❌ No shop domain found, using production fallback');
  }
  return 'sms-blossom-dev.myshopify.com';
}

/**
 * Normalize shop domain to ensure proper format
 */
function normalizeShopDomain(shopDomain) {
  if (!shopDomain || typeof shopDomain !== 'string') {
    return null;
  }
  
  // Remove any whitespace
  shopDomain = shopDomain.trim();
  
  // Ensure it has .myshopify.com suffix
  if (!shopDomain.includes('.')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }
  
  // Validate format
  if (!shopDomain.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
    if (CONFIG.enableLogging) {
      console.warn('Invalid shop domain format:', shopDomain);
    }
    return null;
  }
  
  return shopDomain;
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Get session token from Shopify App Bridge
 * Production-ready with comprehensive error handling
 */
async function getSessionToken() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Method 1: App Bridge session
    if (window.shopify?.session?.token) {
      if (CONFIG.enableLogging) {
        console.log('✅ Session token from App Bridge');
      }
      return window.shopify.session.token;
    }
    
    // Method 2: Session storage
    const sessionData = sessionStorage.getItem('shopify-session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session.token) {
        if (CONFIG.enableLogging) {
          console.log('✅ Session token from session storage');
        }
        return session.token;
      }
    }
    
    // Method 3: App Bridge config
    const appBridgeConfig = sessionStorage.getItem('app-bridge-config');
    if (appBridgeConfig) {
      const config = JSON.parse(appBridgeConfig);
      if (config.token) {
        if (CONFIG.enableLogging) {
          console.log('✅ Session token from app-bridge-config');
        }
        return config.token;
      }
    }
    
    if (CONFIG.enableLogging) {
      console.warn('No session token found');
    }
    return null;
  } catch (error) {
    if (CONFIG.enableLogging) {
      console.error('Failed to get session token:', error);
    }
    return null;
  }
}

/**
 * Build request headers with authentication
 * Production-ready with proper error handling
 */
async function buildHeaders(customHeaders = {}) {
  const shopDomain = getShopDomain();
  const sessionToken = await getSessionToken();
  
  const headers = {
    ...DEFAULT_HEADERS,
    'X-Shopify-Shop-Domain': shopDomain,
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': 'shopify-app',
    ...customHeaders
  };
  
  // Add session token if available
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  
  if (CONFIG.enableLogging) {
    console.log('🔐 Request headers:', {
      shopDomain,
      hasToken: !!sessionToken,
      headers: Object.keys(headers)
    });
  }
  
  return headers;
}

// ============================================================================
// CORE REQUEST FUNCTION
// ============================================================================

/**
 * Make authenticated API request with retry logic and timeout
 * Production-ready with comprehensive error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  
  if (CONFIG.enableLogging) {
    console.log('🚀 Making API request:', {
      url,
      method,
      endpoint,
      hasBody: !!options.body
    });
  }
  
  let lastError;
  
  // Retry logic
  for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
    try {
      const headers = await buildHeaders(options.headers);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
      
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (CONFIG.enableLogging) {
        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          attempt,
          url: response.url
        });
      }
      
      // Handle different response types
      if (response.status === 204) {
        return null; // No content
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        const error = new APIError(
          `API ${response.status}: ${errorData.message || response.statusText}`,
          response.status,
          errorData,
          url
        );
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw error;
        }
        
        // Retry on server errors (5xx) or network issues
        lastError = error;
        if (attempt < CONFIG.retryAttempts) {
          if (CONFIG.enableLogging) {
            console.warn(`⚠️ Request failed (attempt ${attempt}/${CONFIG.retryAttempts}), retrying...`, {
              status: response.status,
              error: errorData.message
            });
          }
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
          continue;
        }
        
        throw error;
      }
      
      const data = await response.json();
      
      if (CONFIG.enableLogging) {
        console.log('✅ API Success:', {
          status: response.status,
          dataKeys: Object.keys(data),
          attempt
        });
      }
      
      return data;
      
    } catch (error) {
      lastError = error;
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        const timeoutError = new APIError(
          `Request timeout after ${CONFIG.timeout}ms`,
          408,
          { timeout: true },
          url
        );
        
        if (attempt < CONFIG.retryAttempts) {
          if (CONFIG.enableLogging) {
            console.warn(`⚠️ Request timeout (attempt ${attempt}/${CONFIG.retryAttempts}), retrying...`);
          }
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
          continue;
        }
        
        throw timeoutError;
      }
      
      // Network errors - retry
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (attempt < CONFIG.retryAttempts) {
          if (CONFIG.enableLogging) {
            console.warn(`⚠️ Network error (attempt ${attempt}/${CONFIG.retryAttempts}), retrying...`, error.message);
          }
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
          continue;
        }
      }
      
      // Don't retry on API errors (already handled above)
      if (error instanceof APIError) {
        throw error;
      }
      
      // Other errors - retry
      if (attempt < CONFIG.retryAttempts) {
        if (CONFIG.enableLogging) {
          console.warn(`⚠️ Request failed (attempt ${attempt}/${CONFIG.retryAttempts}), retrying...`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new APIError('Request failed after all retry attempts', 0, {}, url);
}

/**
 * Custom API Error class for better error handling
 */
class APIError extends Error {
  constructor(message, status, data, url) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
    this.url = url;
    this.timestamp = new Date().toISOString();
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      data: this.data,
      url: this.url,
      timestamp: this.timestamp
    };
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

const api = {
  // ============================================================================
  // DASHBOARD
  // ============================================================================
  dashboard: {
    overview: () => request('/dashboard/overview', { method: 'GET' }),
    quickStats: () => request('/dashboard/quick-stats', { method: 'GET' }),
  },

  // ============================================================================
  // CONTACTS
  // ============================================================================
  contacts: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/contacts?${queryString}`, { method: 'GET' });
    },
    get: (id) => request(`/contacts/${id}`, { method: 'GET' }),
    create: (data) => request('/contacts', { method: 'POST', body: data }),
    update: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
    import: (data) => request('/contacts/import', { method: 'POST', body: data }),
    export: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/contacts/export?${queryString}`, { method: 'GET' });
    },
    stats: () => request('/contacts/stats', { method: 'GET' }),
    validate: (data) => request('/contacts/validate', { method: 'POST', body: data }),
  },

  // ============================================================================
  // CAMPAIGNS
  // ============================================================================
  campaigns: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/campaigns?${queryString}`, { method: 'GET' });
    },
    get: (id) => request(`/campaigns/${id}`, { method: 'GET' }),
    create: (data) => request('/campaigns', { method: 'POST', body: data }),
    update: (id, data) => request(`/campaigns/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
    send: (id) => request(`/campaigns/${id}/send`, { method: 'POST' }),
    schedule: (id, data) => request(`/campaigns/${id}/schedule`, { method: 'POST', body: data }),
    cancel: (id) => request(`/campaigns/${id}/cancel`, { method: 'POST' }),
    duplicate: (id) => request(`/campaigns/${id}/duplicate`, { method: 'POST' }),
    stats: (id) => request(`/campaigns/${id}/stats`, { method: 'GET' }),
    audience: (id) => request(`/campaigns/${id}/audience`, { method: 'GET' }),
  },

  // ============================================================================
  // AUTOMATIONS
  // ============================================================================
  automations: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/automations?${queryString}`, { method: 'GET' });
    },
    get: (id) => request(`/automations/${id}`, { method: 'GET' }),
    update: (id, data) => request(`/automations/${id}`, { method: 'PUT', body: data }),
    toggle: (id) => request(`/automations/${id}/toggle`, { method: 'POST' }),
    sync: () => request('/automations/sync', { method: 'POST' }),
    stats: () => request('/automations/stats', { method: 'GET' }),
  },

  // ============================================================================
  // TEMPLATES
  // ============================================================================
  templates: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/templates?${queryString}`, { method: 'GET' });
    },
    get: (id) => request(`/templates/${id}`, { method: 'GET' }),
    create: (data) => request('/templates', { method: 'POST', body: data }),
    update: (id, data) => request(`/templates/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/templates/${id}`, { method: 'DELETE' }),
    duplicate: (id) => request(`/templates/${id}/duplicate`, { method: 'POST' }),
    stats: () => request('/templates/stats', { method: 'GET' }),
  },

  // ============================================================================
  // REPORTS
  // ============================================================================
  reports: {
    overview: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/overview?${queryString}`, { method: 'GET' });
    },
    campaigns: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/campaigns?${queryString}`, { method: 'GET' });
    },
    contacts: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/contacts?${queryString}`, { method: 'GET' });
    },
    automations: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/automations?${queryString}`, { method: 'GET' });
    },
    export: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/export?${queryString}`, { method: 'GET' });
    },
  },

  // ============================================================================
  // BILLING & SETTINGS
  // ============================================================================
  billing: {
    balance: () => request('/billing/balance', { method: 'GET' }),
    packages: () => request('/billing/packages', { method: 'GET' }),
    history: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/billing/history?${queryString}`, { method: 'GET' });
    },
    checkout: (data) => request('/billing/checkout', { method: 'POST', body: data }),
    webhook: (data) => request('/billing/webhook', { method: 'POST', body: data }),
  },

  settings: {
    get: () => request('/settings', { method: 'GET' }),
    update: (data) => request('/settings', { method: 'PUT', body: data }),
    testSms: (data) => request('/settings/test-sms', { method: 'POST', body: data }),
  },

  // ============================================================================
  // TRACKING & WEBHOOKS
  // ============================================================================
  tracking: {
    status: (messageId) => request(`/tracking/${messageId}/status`, { method: 'GET' }),
    webhook: (data) => request('/tracking/webhook', { method: 'POST', body: data }),
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  health: () => request('/health', { method: 'GET' }),
  
  // Get current shop domain
  getShopDomain: () => getShopDomain(),
  
  // Get current session token
  getSessionToken: () => getSessionToken(),
  
  // Build headers manually
  buildHeaders: () => buildHeaders(),
  
  // Configuration access
  getConfig: () => ({ ...CONFIG }),
  
  // Set configuration
  setConfig: (newConfig) => {
    Object.assign(CONFIG, newConfig);
  },
  
  // Check if running in production
  isProduction: () => {
    return typeof window !== 'undefined' && 
           window.location?.hostname !== 'localhost' && 
           !window.location?.hostname.includes('127.0.0.1');
  },
  
  // Get base URL
  getBaseUrl: () => BASE_URL,
  
  // Test connection
  testConnection: async () => {
    try {
      const response = await request('/health', { method: 'GET' });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default api;

// Named exports for specific use cases
export { 
  getShopDomain, 
  getSessionToken, 
  buildHeaders, 
  request, 
  normalizeShopDomain,
  APIError,
  CONFIG
};

// ============================================================================
// PRODUCTION USAGE EXAMPLES
// ============================================================================

/*
// Basic usage
import api from './api-client.js';

// Dashboard
const overview = await api.dashboard.overview();
const stats = await api.dashboard.quickStats();

// Contacts
const contacts = await api.contacts.list({ page: 1, limit: 10 });
const contact = await api.contacts.get('contact-id');
const newContact = await api.contacts.create({ name: 'John', phone: '+1234567890' });

// Campaigns
const campaigns = await api.campaigns.list({ status: 'active' });
const campaign = await api.campaigns.create({
  name: 'Welcome Campaign',
  message: 'Welcome to our store!',
  audience: { segment: 'new_customers' }
});

// Production error handling
try {
  const data = await api.dashboard.overview();
  console.log('Success:', data);
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', {
      message: error.message,
      status: error.status,
      data: error.data,
      url: error.url,
      timestamp: error.timestamp
    });
  } else {
    console.error('Unexpected Error:', error.message);
  }
}

// Configuration
api.setConfig({
  timeout: 60000, // 60 seconds
  retryAttempts: 5,
  enableLogging: false // Disable in production
});

// Connection testing
const connectionTest = await api.testConnection();
if (connectionTest.success) {
  console.log('API connection successful');
} else {
  console.error('API connection failed:', connectionTest.error);
}

// Production environment detection
if (api.isProduction()) {
  console.log('Running in production mode');
  api.setConfig({ enableLogging: false });
}
*/
