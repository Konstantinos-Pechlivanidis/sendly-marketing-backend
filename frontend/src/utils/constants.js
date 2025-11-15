// Design System Constants
export const COLORS = {
  PRIMARY_DARK: '#020202',
  PRIMARY_LIGHT: '#E5E5E5',
  ICE_ACCENT: '#99B5D7',
  ICE_LIGHT: '#B3CDDA',
  ICE_DARK: '#6686A9',
  BORDER_SUBTLE: '#94A9B4',
  ZOOM_FUCHSIA: '#C09DAE',
  ZOOM_FUCHSIA_DEEP: '#7C5A67',
  SURFACE_DARK: '#191819',
  SURFACE_MID: '#262425',
  BG_DARK: '#020202',
  BG_LIGHT: '#E5E5E5',
};

export const GLASS_COLORS = {
  WHITE: 'rgba(255, 255, 255, 0.10)',
  DARK: 'rgba(2, 2, 2, 0.30)',
  ICE: 'rgba(153, 181, 215, 0.20)',
  FUCHSIA: 'rgba(192, 157, 174, 0.22)',
  BORDER: 'rgba(148, 169, 180, 0.30)',
};

export const SPACING = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
};

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1280,
};

// Determine API URL based on environment
// In production, if VITE_API_URL is not set, detect backend URL from current hostname
// This function is called at runtime to ensure window is available
const getApiUrl = () => {
  // If explicitly set via environment variable, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (not localhost), detect backend URL
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    
    // If we're on the frontend domain, construct backend URL
    if (hostname === 'sendly-marketing-frontend.onrender.com') {
      return 'https://sendly-marketing-backend.onrender.com';
    }
    
    // If we're on a localhost frontend, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }
    
    // For any other production domain, try to construct backend URL
    // by replacing 'frontend' with 'backend' in the hostname
    if (hostname.includes('frontend')) {
      const backendHostname = hostname.replace('frontend', 'backend');
      return `https://${backendHostname}`;
    }
  }
  
  // Default fallback for build time or SSR
  return 'http://localhost:8080';
};

// Export as a getter function to ensure it's called at runtime
let _apiUrl = null;
export const getAPIUrl = () => {
  if (_apiUrl === null) {
    _apiUrl = getApiUrl();
  }
  return _apiUrl;
};

// Export constant for backward compatibility
// This will be evaluated at runtime when the module is loaded in the browser
// For SSR or build time, it will use the fallback
export const API_URL = (() => {
  try {
    if (typeof window !== 'undefined' && window.location) {
      return getApiUrl();
    }
  } catch (e) {
    // Fallback if window is not available
  }
  return 'http://localhost:8080';
})();
export const TOKEN_KEY = 'sendly_app_token';
export const STORE_KEY = 'sendly_store_info';

