// Frontend command to extract shop domain from Shopify app URL and send it as header
// Copy and paste this into your browser console

console.log('=== SHOP DOMAIN EXTRACTOR ===');

// Extract shop domain from current URL
const currentUrl = window.location.href;
console.log('Current URL:', currentUrl);

// Extract shop domain from URL path
const urlMatch = currentUrl.match(/\/store\/([^\/]+)\//);
let shopDomain = null;

if (urlMatch && urlMatch[1]) {
  shopDomain = urlMatch[1];
  // Ensure it has .myshopify.com suffix
  if (!shopDomain.includes('.')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }
  console.log('Extracted shop domain:', shopDomain);
} else {
  console.log('No shop domain found in URL path');
}

// Test API call with extracted shop domain
if (shopDomain) {
  console.log('Testing API call with extracted shop domain:', shopDomain);
  
  fetch('/dashboard/overview', {
    method: 'GET',
    headers: {
      'X-Shopify-Shop-Domain': shopDomain,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('API Response:', data);
    console.log('✅ SUCCESS: API call worked with extracted shop domain!');
  })
  .catch(error => {
    console.error('API Error:', error);
  });
} else {
  console.log('❌ No shop domain found to test with');
}

// Also test without headers (fallback)
console.log('Testing API call without headers (fallback)...');

fetch('/dashboard/overview')
.then(response => {
  console.log('Fallback response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Fallback API Response:', data);
  console.log('✅ SUCCESS: Fallback API call worked!');
})
.catch(error => {
  console.error('Fallback API Error:', error);
});
