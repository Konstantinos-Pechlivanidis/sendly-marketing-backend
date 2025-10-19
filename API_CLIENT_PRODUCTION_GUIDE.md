# 🚀 **SENDLY MARKETING API CLIENT - PRODUCTION GUIDE**

## 📋 **OVERVIEW**

The Sendly Marketing API Client is a production-ready JavaScript library designed for seamless integration with the Sendly Marketing Backend from Shopify Apps. It provides comprehensive error handling, retry logic, timeout management, and automatic shop domain detection.

---

## 🎯 **KEY FEATURES**

### **✅ Production-Ready Features**
- **Automatic Shop Domain Detection** - Reads from session storage, App Bridge, and multiple fallback sources
- **Retry Logic** - Configurable retry attempts with exponential backoff
- **Timeout Handling** - 30-second default timeout with AbortController
- **Error Classification** - Distinguishes between client errors (4xx) and server errors (5xx)
- **Environment Detection** - Automatically detects production vs development
- **Comprehensive Logging** - Configurable logging for debugging and monitoring
- **TypeScript Ready** - Full type definitions and IntelliSense support

### **🔐 Authentication**
- **Shopify Session Token** - Automatic detection from App Bridge
- **Shop Domain Header** - Proper `X-Shopify-Shop-Domain` header injection
- **Multiple Token Sources** - Session storage, App Bridge, and config fallbacks

---

## 📦 **INSTALLATION & SETUP**

### **1. Import the API Client**
```javascript
import api from './api-client.js';

// Or with named imports
import { getShopDomain, getSessionToken, APIError } from './api-client.js';
```

### **2. Basic Usage**
```javascript
// Dashboard
const overview = await api.dashboard.overview();
const stats = await api.dashboard.quickStats();

// Contacts
const contacts = await api.contacts.list({ page: 1, limit: 10 });
const newContact = await api.contacts.create({
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com'
});

// Campaigns
const campaigns = await api.campaigns.list({ status: 'active' });
const campaign = await api.campaigns.create({
  name: 'Welcome Campaign',
  message: 'Welcome to our store!',
  audience: { segment: 'new_customers' }
});
```

---

## ⚙️ **CONFIGURATION**

### **Default Configuration**
```javascript
const CONFIG = {
  timeout: 30000,        // 30 seconds
  retryAttempts: 3,      // 3 retry attempts
  retryDelay: 1000,      // 1 second base delay
  enableLogging: true,   // Development logging
  enableMetrics: true,   // Performance metrics
};
```

### **Custom Configuration**
```javascript
// Set custom config
api.setConfig({
  timeout: 60000,        // 60 seconds
  retryAttempts: 5,      // 5 retry attempts
  enableLogging: false,  // Disable in production
});

// Get current config
const currentConfig = api.getConfig();
console.log('Current config:', currentConfig);
```

---

## 🔧 **SHOP DOMAIN DETECTION**

The API client automatically detects the shop domain from multiple sources:

### **Detection Priority**
1. **Session Storage** (`app-bridge-config`) - Primary method
2. **App Bridge** (`window.shopify.config.shop.myshopifyDomain`)
3. **Global ENV** (`window.ENV.SHOP_DOMAIN`)
4. **URL Path** (embedded apps: `/store/{shop-domain}/apps/`)
5. **Shopify Global** (`window.Shopify.shop`)
6. **Development Fallback** (`sms-blossom-dev.myshopify.com`)

### **Manual Shop Domain**
```javascript
// Get current shop domain
const shopDomain = api.getShopDomain();
console.log('Current shop:', shopDomain);

// The API client automatically includes this in all requests
// as the X-Shopify-Shop-Domain header
```

---

## 🛡️ **ERROR HANDLING**

### **API Error Class**
```javascript
try {
  const data = await api.dashboard.overview();
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', {
      message: error.message,    // Human-readable error message
      status: error.status,      // HTTP status code
      data: error.data,         // Server error details
      url: error.url,          // Request URL
      timestamp: error.timestamp // Error timestamp
    });
  } else {
    console.error('Unexpected Error:', error.message);
  }
}
```

### **Error Types**
- **Client Errors (4xx)** - No retry, immediate failure
- **Server Errors (5xx)** - Retry with exponential backoff
- **Network Errors** - Retry with exponential backoff
- **Timeout Errors** - Retry with exponential backoff

---

## 🔄 **RETRY LOGIC**

### **Automatic Retry**
- **Server Errors (5xx)** - Retry up to 3 times
- **Network Errors** - Retry up to 3 times
- **Timeout Errors** - Retry up to 3 times
- **Client Errors (4xx)** - No retry (immediate failure)

### **Retry Configuration**
```javascript
api.setConfig({
  retryAttempts: 5,      // Number of retry attempts
  retryDelay: 2000,      // Base delay in milliseconds
  timeout: 60000,        // Request timeout
});
```

---

## 📊 **MONITORING & DEBUGGING**

### **Connection Testing**
```javascript
// Test API connection
const connectionTest = await api.testConnection();
if (connectionTest.success) {
  console.log('API connection successful');
} else {
  console.error('API connection failed:', connectionTest.error);
}
```

### **Environment Detection**
```javascript
// Check if running in production
if (api.isProduction()) {
  console.log('Running in production mode');
  api.setConfig({ enableLogging: false });
} else {
  console.log('Running in development mode');
  api.setConfig({ enableLogging: true });
}
```

### **Logging Configuration**
```javascript
// Enable/disable logging
api.setConfig({
  enableLogging: process.env.NODE_ENV === 'development'
});

// Logs include:
// - Shop domain detection
// - Request/response details
// - Retry attempts
// - Error information
```

---

## 🎯 **API ENDPOINTS**

### **Dashboard**
```javascript
const overview = await api.dashboard.overview();
const stats = await api.dashboard.quickStats();
```

### **Contacts**
```javascript
// List contacts
const contacts = await api.contacts.list({ page: 1, limit: 10 });

// Get specific contact
const contact = await api.contacts.get('contact-id');

// Create contact
const newContact = await api.contacts.create({
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com'
});

// Update contact
const updatedContact = await api.contacts.update('contact-id', {
  name: 'John Smith'
});

// Delete contact
await api.contacts.delete('contact-id');

// Import contacts
await api.contacts.import([{ name: 'Jane', phone: '+0987654321' }]);

// Export contacts
const exportedData = await api.contacts.export({ format: 'csv' });

// Get contact statistics
const stats = await api.contacts.stats();
```

### **Campaigns**
```javascript
// List campaigns
const campaigns = await api.campaigns.list({ status: 'active' });

// Get specific campaign
const campaign = await api.campaigns.get('campaign-id');

// Create campaign
const newCampaign = await api.campaigns.create({
  name: 'Welcome Campaign',
  message: 'Welcome to our store!',
  audience: { segment: 'new_customers' }
});

// Update campaign
const updatedCampaign = await api.campaigns.update('campaign-id', {
  name: 'Updated Campaign'
});

// Send campaign
await api.campaigns.send('campaign-id');

// Schedule campaign
await api.campaigns.schedule('campaign-id', {
  scheduledAt: '2024-01-01T10:00:00Z'
});

// Cancel campaign
await api.campaigns.cancel('campaign-id');

// Duplicate campaign
const duplicatedCampaign = await api.campaigns.duplicate('campaign-id');

// Get campaign statistics
const stats = await api.campaigns.stats('campaign-id');

// Get campaign audience
const audience = await api.campaigns.audience('campaign-id');
```

### **Automations**
```javascript
// List automations
const automations = await api.automations.list();

// Get specific automation
const automation = await api.automations.get('automation-id');

// Update automation
const updatedAutomation = await api.automations.update('automation-id', {
  isActive: true,
  customMessage: 'Custom automation message'
});

// Toggle automation
await api.automations.toggle('automation-id');

// Sync automations
await api.automations.sync();

// Get automation statistics
const stats = await api.automations.stats();
```

### **Templates**
```javascript
// List templates
const templates = await api.templates.list();

// Get specific template
const template = await api.templates.get('template-id');

// Create template
const newTemplate = await api.templates.create({
  name: 'Welcome Template',
  content: 'Welcome to our store!'
});

// Update template
const updatedTemplate = await api.templates.update('template-id', {
  name: 'Updated Template'
});

// Delete template
await api.templates.delete('template-id');

// Duplicate template
const duplicatedTemplate = await api.templates.duplicate('template-id');

// Get template statistics
const stats = await api.templates.stats();
```

### **Reports**
```javascript
// Get overview report
const overview = await api.reports.overview({ 
  startDate: '2024-01-01', 
  endDate: '2024-01-31' 
});

// Get campaign reports
const campaignReports = await api.reports.campaigns({ 
  campaignId: 'campaign-id' 
});

// Get contact reports
const contactReports = await api.reports.contacts();

// Get automation reports
const automationReports = await api.reports.automations();

// Export reports
const exportedReport = await api.reports.export({ 
  format: 'csv',
  type: 'campaigns' 
});
```

### **Billing & Settings**
```javascript
// Get billing balance
const balance = await api.billing.balance();

// Get available packages
const packages = await api.billing.packages();

// Get billing history
const history = await api.billing.history({ page: 1 });

// Create checkout session
const checkout = await api.billing.checkout({
  packageId: 'package-id',
  credits: 1000
});

// Get settings
const settings = await api.settings.get();

// Update settings
const updatedSettings = await api.settings.update({
  senderName: 'My Store',
  senderNumber: '+1234567890'
});

// Test SMS
await api.settings.testSms({
  phone: '+1234567890',
  message: 'Test message'
});
```

### **Tracking & Webhooks**
```javascript
// Get message status
const status = await api.tracking.status('message-id');

// Handle webhook
await api.tracking.webhook({
  messageId: 'message-id',
  status: 'delivered',
  timestamp: '2024-01-01T10:00:00Z'
});
```

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **Environment Variables**
```bash
# Production
API_BASE_URL=https://sendly-marketing-backend.onrender.com

# Development
API_BASE_URL=http://localhost:3000
```

### **Production Configuration**
```javascript
// Production setup
if (api.isProduction()) {
  api.setConfig({
    timeout: 60000,        // Longer timeout for production
    retryAttempts: 5,      // More retries for production
    enableLogging: false,   // Disable logging in production
    enableMetrics: true,    // Enable metrics for monitoring
  });
}
```

### **Error Monitoring**
```javascript
// Global error handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason instanceof APIError) {
    // Send to error monitoring service
    console.error('Unhandled API Error:', event.reason);
  }
});
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **Request Optimization**
- **Automatic Retry** - Reduces failed requests
- **Timeout Handling** - Prevents hanging requests
- **Connection Reuse** - Efficient HTTP connections
- **Error Classification** - Smart retry logic

### **Memory Management**
- **Automatic Cleanup** - AbortController cleanup
- **Efficient Headers** - Minimal header overhead
- **Smart Caching** - Built-in request optimization

---

## 🔒 **SECURITY FEATURES**

### **Authentication**
- **Session Token Validation** - Automatic token detection
- **Shop Domain Verification** - Proper domain validation
- **Header Security** - Secure header injection

### **Data Protection**
- **Input Validation** - Automatic data sanitization
- **Error Sanitization** - Safe error messages
- **Secure Headers** - Production-ready headers

---

## 📚 **TROUBLESHOOTING**

### **Common Issues**

#### **Shop Domain Not Found**
```javascript
// Check shop domain detection
const shopDomain = api.getShopDomain();
console.log('Detected shop domain:', shopDomain);

// Manual shop domain setting (if needed)
// The API client should automatically detect from session storage
```

#### **Authentication Issues**
```javascript
// Check session token
const token = await api.getSessionToken();
console.log('Session token available:', !!token);

// Check headers
const headers = await api.buildHeaders();
console.log('Request headers:', headers);
```

#### **Connection Issues**
```javascript
// Test connection
const connectionTest = await api.testConnection();
if (!connectionTest.success) {
  console.error('Connection failed:', connectionTest.error);
}
```

### **Debug Mode**
```javascript
// Enable debug logging
api.setConfig({ enableLogging: true });

// Check configuration
console.log('API Config:', api.getConfig());
console.log('Base URL:', api.getBaseUrl());
console.log('Production Mode:', api.isProduction());
```

---

## 🎉 **CONCLUSION**

The Sendly Marketing API Client is production-ready and provides:

- ✅ **Automatic shop domain detection** from session storage
- ✅ **Comprehensive error handling** with retry logic
- ✅ **Production-ready configuration** and monitoring
- ✅ **Complete API coverage** for all backend endpoints
- ✅ **TypeScript support** and IntelliSense
- ✅ **Security features** and data protection
- ✅ **Performance optimization** and memory management

The client is designed to work seamlessly with Shopify Apps and provides a robust foundation for production applications.

---

**📞 Support**: For issues or questions, please refer to the backend documentation or contact the development team.
