// Debug script to show Shopify headers
// Run this in your frontend console or as a component

// Method 1: Check all available headers in the current request
console.log('=== SHOPIFY HEADERS DEBUG ===');

// Check if we're in a Shopify app context
if (window.Shopify) {
  console.log('Shopify object available:', window.Shopify);
}

// Check for Shopify App Bridge
if (window.shopifyApp) {
  console.log('Shopify App Bridge available:', window.shopifyApp);
}

// Check URL parameters
const urlParams = new URLSearchParams(window.location.search);
console.log('URL Parameters:', Object.fromEntries(urlParams));

// Check for shop in URL
const shopFromUrl = urlParams.get('shop') || urlParams.get('shop_domain');
console.log('Shop from URL:', shopFromUrl);

// Check for shop in hash
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const shopFromHash = hashParams.get('shop') || hashParams.get('shop_domain');
console.log('Shop from Hash:', shopFromHash);

// Check localStorage for Shopify data
const shopifyData = localStorage.getItem('shopify_app_session');
if (shopifyData) {
  try {
    const parsed = JSON.parse(shopifyData);
    console.log('Shopify session data:', parsed);
  } catch (e) {
    console.log('Shopify session data (raw):', shopifyData);
  }
}

// Check sessionStorage
const sessionData = sessionStorage.getItem('shopify_app_session');
if (sessionData) {
  try {
    const parsed = JSON.parse(sessionData);
    console.log('Shopify session data (session):', parsed);
  } catch (e) {
    console.log('Shopify session data (raw):', sessionData);
  }
}

// Method 2: Create a test API call to see what headers are sent
const testApiCall = async () => {
  console.log('=== TESTING API CALL ===');
  
  try {
    const response = await fetch('/dashboard/overview', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Try to add shop domain if we found it
        ...(shopFromUrl && { 'X-Shopify-Shop-Domain': shopFromUrl }),
        ...(shopFromHash && { 'X-Shopify-Shop-Domain': shopFromHash }),
      }
    });
    
    console.log('API Response Status:', response.status);
    const data = await response.json();
    console.log('API Response:', data);
  } catch (error) {
    console.error('API Call Error:', error);
  }
};

// Method 3: Check for Shopify App Bridge context
const checkAppBridge = () => {
  console.log('=== CHECKING APP BRIDGE ===');
  
  // Check if App Bridge is loaded
  if (window.shopifyApp) {
    console.log('App Bridge available');
    
    // Try to get shop info
    try {
      const shop = window.shopifyApp.shop;
      console.log('Shop from App Bridge:', shop);
    } catch (e) {
      console.log('Could not get shop from App Bridge:', e);
    }
  } else {
    console.log('App Bridge not available');
  }
  
  // Check for Shopify global
  if (window.Shopify) {
    console.log('Shopify global available:', window.Shopify);
    
    // Check for shop in Shopify global
    if (window.Shopify.shop) {
      console.log('Shop from Shopify global:', window.Shopify.shop);
    }
  }
};

// Method 4: Check for shop in meta tags
const checkMetaTags = () => {
  console.log('=== CHECKING META TAGS ===');
  
  const metaTags = document.querySelectorAll('meta');
  metaTags.forEach(meta => {
    if (meta.name && (meta.name.includes('shop') || meta.name.includes('shopify'))) {
      console.log('Meta tag found:', meta.name, meta.content);
    }
  });
};

// Run all checks
console.log('Running Shopify headers debug...');
checkAppBridge();
checkMetaTags();

// Wait a bit then test API call
setTimeout(() => {
  testApiCall();
}, 1000);

console.log('=== DEBUG COMPLETE ===');
console.log('Copy the output above and send it to the backend developer');
