/**
 * Shopify App Bridge API Client - Production Ready
 * Designed specifically for Shopify Apps with proper authentication
 */

(function() {
  'use strict';
  
  console.log('🚀 Loading Sendly API Client for Shopify App...');
  
  // Configuration
  const BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://sendly-marketing-backend.onrender.com';
    
  const CONFIG = {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true,
  };

  // Enhanced shop domain detection
  function getShopDomain() {
    console.log('🔍 Detecting shop domain...');
    
    // Method 1: Session Storage (PRIMARY - App Bridge)
    try {
      const appBridgeConfig = sessionStorage.getItem('app-bridge-config');
      if (appBridgeConfig) {
        const config = JSON.parse(appBridgeConfig);
        if (config.shop && typeof config.shop === 'string') {
          console.log('✅ Shop domain from Session Storage (app-bridge-config):', config.shop);
          return config.shop;
        }
      }
    } catch (e) {
      console.warn('Failed to read app-bridge-config from session storage:', e);
    }
    
    // Method 2: App Bridge
    if (window.shopify?.config?.shop?.myshopifyDomain) {
      console.log('✅ Shop domain from App Bridge:', window.shopify.config.shop.myshopifyDomain);
      return window.shopify.config.shop.myshopifyDomain;
    }
    
    // Method 3: URL path extraction
    const currentUrl = window.location.href;
    const pathMatch = currentUrl.match(/\/store\/([^\/]+)\//);
    if (pathMatch && pathMatch[1]) {
      let shopDomain = pathMatch[1];
      if (!shopDomain.includes('.')) {
        shopDomain = `${shopDomain}.myshopify.com`;
      }
      console.log('✅ Shop domain from URL path:', shopDomain);
      return shopDomain;
    }
    
    // Method 4: Development fallback
    if (window.location.hostname === 'localhost') {
      console.log('✅ Using development fallback shop domain');
      return 'sms-blossom-dev.myshopify.com';
    }
    
    console.warn('❌ No shop domain found, using fallback');
    return 'sms-blossom-dev.myshopify.com';
  }

  // Enhanced session token detection
  async function getSessionToken() {
    console.log('🔐 Detecting session token...');
    
    try {
      // Method 1: App Bridge session
      if (window.shopify?.session?.token) {
        console.log('✅ Session token from App Bridge');
        return window.shopify.session.token;
      }
      
      // Method 2: Session storage
      const sessionData = sessionStorage.getItem('shopify-session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.token) {
          console.log('✅ Session token from session storage');
          return session.token;
        }
      }
      
      // Method 3: App Bridge config
      const appBridgeConfig = sessionStorage.getItem('app-bridge-config');
      if (appBridgeConfig) {
        const config = JSON.parse(appBridgeConfig);
        if (config.token) {
          console.log('✅ Session token from app-bridge-config');
          return config.token;
        }
      }
      
      // Method 4: Try to get from App Bridge directly
      if (window.shopify && typeof window.shopify.getSessionToken === 'function') {
        try {
          const token = await window.shopify.getSessionToken();
          if (token) {
            console.log('✅ Session token from App Bridge getSessionToken()');
            return token;
          }
        } catch (e) {
          console.warn('App Bridge getSessionToken failed:', e);
        }
      }
      
      console.warn('❌ No session token found');
      return null;
    } catch (error) {
      console.error('Failed to get session token:', error);
      return null;
    }
  }

  // Build headers with authentication
  async function buildHeaders(customHeaders = {}) {
    const shopDomain = getShopDomain();
    const sessionToken = await getSessionToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Shopify-Shop-Domain': shopDomain,
      'X-Client-Version': '1.0.0',
      'X-Client-Platform': 'shopify-app',
      ...customHeaders
    };
    
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    
    console.log('🔐 Request headers:', {
      shopDomain,
      hasToken: !!sessionToken,
      tokenPreview: sessionToken ? sessionToken.substring(0, 20) + '...' : 'none'
    });
    
    return headers;
  }

  // Enhanced request function with retry logic
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const method = options.method || 'GET';
    
    console.log('🚀 Making API request:', {
      url,
      method,
      endpoint
    });
    
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
        
        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          attempt
        });
        
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
          
          const error = new Error(`API ${response.status}: ${errorData.message || response.statusText}`);
          error.status = response.status;
          error.data = errorData;
          error.url = url;
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          
          // Retry on server errors (5xx)
          lastError = error;
          if (attempt < CONFIG.retryAttempts) {
            console.warn(`⚠️ Request failed (attempt ${attempt}/${CONFIG.retryAttempts}), retrying...`, {
              status: response.status,
              error: errorData.message
            });
            await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
            continue;
          }
          
          throw error;
        }
        
        const data = await response.json();
        
        console.log('✅ API Success:', {
          status: response.status,
          dataKeys: Object.keys(data),
          attempt
        });
        
        return data;
        
      } catch (error) {
        lastError = error;
        
        // Handle timeout
        if (error.name === 'AbortError') {
          const timeoutError = new Error(`Request timeout after ${CONFIG.timeout}ms`);
          timeoutError.status = 408;
          timeoutError.url = url;
          
          if (attempt < CONFIG.retryAttempts) {
            console.warn(`⚠️ Request timeout (attempt ${attempt}/${CONFIG.retryAttempts}), retrying...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
            continue;
          }
          
          throw timeoutError;
        }
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          if (attempt < CONFIG.retryAttempts) {
            console.warn(`⚠️ Network error (attempt ${attempt}/${CONFIG.retryAttempts}), retrying...`, error.message);
            await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
            continue;
          }
        }
        
        // Don't retry on API errors (already handled above)
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Other errors - retry
        if (attempt < CONFIG.retryAttempts) {
          console.warn(`⚠️ Request failed (attempt ${attempt}/${CONFIG.retryAttempts}), retrying...`, error.message);
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * attempt));
          continue;
        }
        
        throw error;
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Request failed after all retry attempts');
  }

  // API object
  window.SendlyAPI = {
    // Dashboard
    dashboard: {
      overview: () => request('/dashboard/overview'),
      quickStats: () => request('/dashboard/quick-stats'),
    },
    
    // Contacts
    contacts: {
      list: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/contacts?${queryString}`);
      },
      get: (id) => request(`/contacts/${id}`),
      create: (data) => request('/contacts', { method: 'POST', body: data }),
      update: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: data }),
      delete: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
      import: (data) => request('/contacts/import', { method: 'POST', body: data }),
      export: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/contacts/export?${queryString}`);
      },
      stats: () => request('/contacts/stats'),
    },
    
    // Campaigns
    campaigns: {
      list: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/campaigns?${queryString}`);
      },
      get: (id) => request(`/campaigns/${id}`),
      create: (data) => request('/campaigns', { method: 'POST', body: data }),
      update: (id, data) => request(`/campaigns/${id}`, { method: 'PUT', body: data }),
      delete: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
      send: (id) => request(`/campaigns/${id}/send`, { method: 'POST' }),
      schedule: (id, data) => request(`/campaigns/${id}/schedule`, { method: 'POST', body: data }),
      cancel: (id) => request(`/campaigns/${id}/cancel`, { method: 'POST' }),
      duplicate: (id) => request(`/campaigns/${id}/duplicate`, { method: 'POST' }),
      stats: (id) => request(`/campaigns/${id}/stats`),
    },
    
    // Automations
    automations: {
      list: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/automations?${queryString}`);
      },
      get: (id) => request(`/automations/${id}`),
      update: (id, data) => request(`/automations/${id}`, { method: 'PUT', body: data }),
      toggle: (id) => request(`/automations/${id}/toggle`, { method: 'POST' }),
      sync: () => request('/automations/sync', { method: 'POST' }),
      stats: () => request('/automations/stats'),
    },
    
    // Templates
    templates: {
      list: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/templates?${queryString}`);
      },
      get: (id) => request(`/templates/${id}`),
      create: (data) => request('/templates', { method: 'POST', body: data }),
      update: (id, data) => request(`/templates/${id}`, { method: 'PUT', body: data }),
      delete: (id) => request(`/templates/${id}`, { method: 'DELETE' }),
      duplicate: (id) => request(`/templates/${id}/duplicate`, { method: 'POST' }),
      stats: () => request('/templates/stats'),
    },
    
    // Reports
    reports: {
      overview: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/reports/overview?${queryString}`);
      },
      campaigns: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/reports/campaigns?${queryString}`);
      },
      contacts: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/reports/contacts?${queryString}`);
      },
      automations: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/reports/automations?${queryString}`);
      },
      export: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/reports/export?${queryString}`);
      },
    },
    
    // Billing & Settings
    billing: {
      balance: () => request('/billing/balance'),
      packages: () => request('/billing/packages'),
      history: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/billing/history?${queryString}`);
      },
      checkout: (data) => request('/billing/checkout', { method: 'POST', body: data }),
    },
    
    settings: {
      get: () => request('/settings'),
      update: (data) => request('/settings', { method: 'PUT', body: data }),
      testSms: (data) => request('/settings/test-sms', { method: 'POST', body: data }),
    },
    
    // Tracking
    tracking: {
      status: (messageId) => request(`/tracking/${messageId}/status`),
      webhook: (data) => request('/tracking/webhook', { method: 'POST', body: data }),
    },
    
    // Utility methods
    health: () => request('/health'),
    getShopDomain: () => getShopDomain(),
    getSessionToken: () => getSessionToken(),
    testConnection: async () => {
      try {
        const response = await request('/health');
        return { success: true, data: response };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    // Debug methods
    debug: {
      getShopifyContext: () => ({
        shopify: window.shopify,
        sessionStorage: {
          'app-bridge-config': sessionStorage.getItem('app-bridge-config'),
          'shopify-session': sessionStorage.getItem('shopify-session')
        },
        location: window.location.href
      }),
      testAuth: async () => {
        const shopDomain = getShopDomain();
        const sessionToken = await getSessionToken();
        return { shopDomain, hasToken: !!sessionToken, tokenPreview: sessionToken ? sessionToken.substring(0, 20) + '...' : 'none' };
      }
    }
  };

  console.log('✅ Sendly API Client loaded successfully!');
  console.log('📖 Usage: SendlyAPI.dashboard.overview()');
  console.log('🔧 Debug: SendlyAPI.debug.testAuth()');
})();
