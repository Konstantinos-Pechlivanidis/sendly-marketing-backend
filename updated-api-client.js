/**
 * Sendly Marketing API Client
 * Integrates with backend using X-Shopify-Shop-Domain authentication
 */

// Environment-based configuration
const BASE_URL = typeof window !== 'undefined' && window.ENV?.API_BASE_URL
  ? window.ENV.API_BASE_URL
  : (process.env.NODE_ENV === 'production'
    ? 'https://sendly-marketing-backend.onrender.com'
    : 'http://localhost:8080');

const DEFAULT_HEADERS = { 
  "Content-Type": "application/json"
};

/**
 * Get shop domain from Shopify context
 * Updated to extract from URL path for embedded Shopify apps
 */
function getShopDomain() {
  if (typeof window === 'undefined') return null;
  
  console.log('🔍 Detecting shop domain...', {
    hostname: window.location.hostname,
    href: window.location.href,
    hasShopify: !!window.shopify,
    hasEnv: !!window.ENV,
  });
  
  // Method 1: Try to get from Session Storage (App Bridge config)
  try {
    const appBridgeConfig = sessionStorage.getItem('app-bridge-config');
    if (appBridgeConfig) {
      const config = JSON.parse(appBridgeConfig);
      if (config.shop) {
        console.log('✅ Shop domain from Session Storage (app-bridge-config):', config.shop);
        return config.shop;
      }
    }
  } catch (e) {
    console.warn('Failed to read app-bridge-config from session storage:', e);
  }
  
  // Method 2: Try to get from window.shopify (App Bridge)
  if (window.shopify?.config?.shop?.myshopifyDomain) {
    console.log('✅ Shop domain from App Bridge:', window.shopify.config.shop.myshopifyDomain);
    return window.shopify.config.shop.myshopifyDomain;
  }
  
  // Method 3: Try to get from global ENV
  if (window.ENV?.SHOP_DOMAIN) {
    console.log('✅ Shop domain from ENV:', window.ENV.SHOP_DOMAIN);
    return window.ENV.SHOP_DOMAIN;
  }
  
  // Method 3: Extract from URL path (for embedded Shopify apps)
  // URL pattern: /store/{shop-domain}/apps/{app-name}/app
  const currentUrl = window.location.href;
  const pathMatch = currentUrl.match(/\/store\/([^\/]+)\//);
  
  if (pathMatch && pathMatch[1]) {
    let shopDomain = pathMatch[1];
    // Ensure it has .myshopify.com suffix
    if (!shopDomain.includes('.')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    console.log('Extracted shop domain from URL:', shopDomain);
    return shopDomain;
  }
  
  // Method 3.5: Development fallback
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    console.log('Using development fallback shop domain');
    return 'sms-blossom-dev.myshopify.com';
  }
  
  // Method 4: Try to get from Shopify global object
  if (window.Shopify?.shop) {
    let shopDomain = window.Shopify.shop;
    if (!shopDomain.includes('.')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    return shopDomain;
  }
  
  // Method 5: Try to get from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const shopFromQuery = urlParams.get('shop') || urlParams.get('shop_domain');
  if (shopFromQuery) {
    let shopDomain = shopFromQuery;
    if (!shopDomain.includes('.')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    console.log('✅ Shop domain from URL params:', shopDomain);
    return shopDomain;
  }
  
  console.warn('❌ No shop domain found in any method');
  return null;
}

/**
 * Core request function with automatic store scoping
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const shopDomain = getShopDomain();
  
  const headers = {
    ...DEFAULT_HEADERS,
    ...(options.headers || {}),
  };
  
  // Add X-Shopify-Shop-Domain header if available
  if (shopDomain) {
    headers['X-Shopify-Shop-Domain'] = shopDomain;
    console.log('Sending request with shop domain:', shopDomain);
  } else {
    console.warn('No shop domain found, sending request without X-Shopify-Shop-Domain header');
  }
  
  const merged = {
    ...options,
    headers,
  };
  
  console.log('Making API request:', { url, headers });
  
  const res = await fetch(url, merged);
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

/**
 * Sendly Marketing API Service
 */
export const api = {
  // Base methods
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
  
  // Dashboard endpoints
  dashboard: {
    overview: () => request('/dashboard/overview', { method: 'GET' }),
    quickStats: () => request('/dashboard/quick-stats', { method: 'GET' }),
  },
  
  // Contacts endpoints
  contacts: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/contacts?${queryString}`, { method: 'GET' });
    },
    get: (id) => request(`/contacts/${id}`, { method: 'GET' }),
    create: (data) => request('/contacts', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    update: (id, data) => request(`/contacts/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    delete: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),
    stats: () => request('/contacts/stats', { method: 'GET' }),
    birthdays: () => request('/contacts/birthdays', { method: 'GET' }),
  },
  
  // Campaigns endpoints
  campaigns: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/campaigns?${queryString}`, { method: 'GET' });
    },
    get: (id) => request(`/campaigns/${id}`, { method: 'GET' }),
    create: (data) => request('/campaigns', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    update: (id, data) => request(`/campaigns/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    delete: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),
    prepare: (id) => request(`/campaigns/${id}/prepare`, { method: 'POST' }),
    send: (id) => request(`/campaigns/${id}/send`, { method: 'POST' }),
    schedule: (id, scheduleData) => request(`/campaigns/${id}/schedule`, { 
      method: 'PUT', 
      body: JSON.stringify(scheduleData) 
    }),
    metrics: (id) => request(`/campaigns/${id}/metrics`, { method: 'GET' }),
  },
  
  // Automations endpoints
  automations: {
    list: () => request('/automations', { method: 'GET' }),
    update: (id, data) => request(`/automations/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    stats: () => request('/automations/stats', { method: 'GET' }),
  },
  
  // Templates endpoints
  templates: {
    list: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/templates?${queryString}`, { method: 'GET' });
    },
    get: (id) => request(`/templates/${id}`, { method: 'GET' }),
    categories: () => request('/templates/categories', { method: 'GET' }),
    track: (id) => request(`/templates/${id}/track`, { method: 'POST' }),
  },
  
  // Reports endpoints
  reports: {
    overview: () => request('/reports/overview', { method: 'GET' }),
    kpis: () => request('/reports/kpis', { method: 'GET' }),
    campaigns: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/campaigns?${queryString}`, { method: 'GET' });
    },
    automations: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/automations?${queryString}`, { method: 'GET' });
    },
    credits: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/credits?${queryString}`, { method: 'GET' });
    },
    contacts: () => request('/reports/contacts', { method: 'GET' }),
    export: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/reports/export?${queryString}`, { method: 'GET' });
    },
  },
  
  // Settings & Billing endpoints
  settings: {
    get: () => request('/settings', { method: 'GET' }),
    account: () => request('/settings/account', { method: 'GET' }),
    updateSender: (data) => request('/settings/sender', { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  },
  
  billing: {
    balance: () => request('/billing/balance', { method: 'GET' }),
    packages: () => request('/billing/packages', { method: 'GET' }),
    history: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/billing/history?${queryString}`, { method: 'GET' });
    },
    purchase: (data) => request('/billing/purchase', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  },
  
  // Shopify Integration endpoints
  shopify: {
    discounts: () => request('/shopify/discounts', { method: 'GET' }),
    discount: (id) => request(`/shopify/discounts/${id}`, { method: 'GET' }),
    validateDiscount: (data) => request('/shopify/discounts/validate', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  },
  
  // Tracking endpoints
  tracking: {
    mittoStatus: (messageId) => request(`/tracking/mitto/${messageId}`, { method: 'GET' }),
    campaignStatus: (campaignId) => request(`/tracking/campaign/${campaignId}`, { method: 'GET' }),
    bulkUpdate: (updates) => request('/tracking/bulk-update', { 
      method: 'POST', 
      body: JSON.stringify({ updates }) 
    }),
  },
};
