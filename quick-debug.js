// Quick debug command for browser console
// Copy and paste this into your browser console

console.log('=== QUICK SHOPIFY DEBUG ===');

// 1. Check URL for shop parameter
const urlParams = new URLSearchParams(window.location.search);
const shopFromUrl = urlParams.get('shop') || urlParams.get('shop_domain');
console.log('Shop from URL:', shopFromUrl);

// 2. Check for Shopify global
console.log('Shopify global:', window.Shopify);

// 3. Check for App Bridge
console.log('App Bridge:', window.shopifyApp);

// 4. Check localStorage
const shopifySession = localStorage.getItem('shopify_app_session');
console.log('Shopify session:', shopifySession);

// 5. Test API call with shop domain
if (shopFromUrl) {
  console.log('Testing API call with shop domain:', shopFromUrl);
  
  fetch('/dashboard/overview', {
    headers: {
      'X-Shopify-Shop-Domain': shopFromUrl,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('API Response:', data);
  })
  .catch(error => {
    console.error('API Error:', error);
  });
} else {
  console.log('No shop domain found in URL');
  console.log('Current URL:', window.location.href);
}
