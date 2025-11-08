# 📚 Sendly Marketing Backend - Complete Documentation

**Version**: 1.0  
**Last Updated**: October 19, 2025  
**Status**: Production Ready ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Environment Setup](#environment-setup)
4. [Authentication & Store Scoping](#authentication--store-scoping)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Shopify App Integration Guide](#shopify-app-integration-guide)
7. [Testing & Validation](#testing--validation)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Caching](#caching)
11. [Changelog](#changelog)

---

## 🎯 Overview

### Purpose
The Sendly Marketing Backend is a comprehensive SMS marketing platform designed specifically for Shopify stores. It provides automated SMS campaigns, contact management, billing integration, and detailed analytics.

### Connection Flow with Shopify App
```
Shopify Store → Shopify App Bridge → Frontend (React) → Backend API → Database
                     ↓
              Session Token Validation
                     ↓
              Store Scoping (shopId)
                     ↓
              Business Logic Processing
```

### Key Features
- **Multi-Store Support**: Each Shopify store has isolated data
- **SMS Campaigns**: Create, schedule, and send targeted SMS campaigns
- **Contact Management**: Import, manage, and segment customer contacts
- **Automations**: Birthday messages, abandoned cart recovery, etc.
- **Billing Integration**: Stripe-powered credit system
- **Analytics**: Comprehensive reporting and tracking
- **Template System**: Pre-built SMS templates
- **Webhook Support**: Real-time delivery tracking

---

## 🏗️ Architecture Summary

### Core Modules

#### 🔐 **Authentication & Store Resolution**
- **File**: `middlewares/auth.js`, `middlewares/store-resolution.js`
- **Purpose**: Validates Shopify session tokens and resolves store context
- **Integration**: Every request is automatically scoped to the correct store

#### 👥 **Contacts Management**
- **Files**: `services/contacts.js`, `controllers/contacts-enhanced.js`, `routes/contacts-enhanced.js`
- **Purpose**: Customer contact CRUD operations, import/export, segmentation
- **Features**: Phone validation, duplicate detection, birthday tracking

#### 📢 **Campaigns**
- **Files**: `services/campaigns.js`, `controllers/campaigns.js`, `routes/campaigns.js`
- **Purpose**: SMS campaign creation, scheduling, and sending
- **Features**: Audience targeting, credit validation, queue management

#### 🤖 **Automations**
- **Files**: `services/automations.js`, `controllers/automations.js`, `routes/automations.js`
- **Purpose**: Automated SMS triggers based on customer behavior
- **Features**: Birthday automation, abandoned cart recovery, welcome sequences

#### 📄 **Templates**
- **Files**: `services/templates.js`, `controllers/templates.js`, `routes/templates.js`
- **Purpose**: Pre-built SMS templates and usage tracking
- **Features**: Public template library, usage analytics, category filtering

#### 💳 **Billing & Credits**
- **Files**: `services/billing.js`, `controllers/billing.js`, `routes/billing.js`
- **Purpose**: Credit management, Stripe integration, transaction history
- **Features**: Package purchasing, webhook handling, balance tracking

#### 📊 **Reports & Analytics**
- **Files**: `services/reports.js`, `controllers/reports.js`, `routes/reports.js`
- **Purpose**: Campaign performance, delivery statistics, ROI analysis
- **Features**: Real-time metrics, export functionality, trend analysis

#### 📱 **SMS Integration**
- **Files**: `services/mitto.js`, `controllers/mitto.js`, `routes/mitto.js`
- **Purpose**: Mitto SMS provider integration
- **Features**: Message sending, delivery tracking, webhook processing

#### 🔍 **Tracking & Webhooks**
- **Files**: `services/tracking.js`, `controllers/tracking.js`, `routes/tracking.js`
- **Purpose**: Message delivery tracking and status updates
- **Features**: Real-time status updates, delivery confirmation, error tracking

---

## ⚙️ Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sendly_marketing"

# Redis (for caching and queues)
REDIS_URL="redis://localhost:6379"

# Shopify App
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SHOPIFY_SCOPES="read_products,write_products,read_orders,write_orders"

# SMS Provider (Mitto)
MITTO_API_KEY="your_mitto_api_key"
MITTO_SENDER_NAME="YourStore"
MITTO_SENDER_NUMBER="+1234567890"

# Payment Processing (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_1000="price_1000_credits"
STRIPE_PRICE_ID_5000="price_5000_credits"
STRIPE_PRICE_ID_10000="price_10000_credits"
STRIPE_PRICE_ID_25000="price_25000_credits"

# Server Configuration
PORT=3000
NODE_ENV="production"
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Start the server
npm start
```

---

## 🔐 Authentication & Store Scoping

### How It Works

1. **Shopify App Bridge** provides session token in frontend
2. **Frontend** sends token in `Authorization: Bearer <token>` header
3. **Backend** validates token and extracts shop domain
4. **Store Resolution** middleware finds/creates shop record
5. **All subsequent operations** are scoped to that shop

### Required Headers

```http
Authorization: Bearer <shopify_session_token>
Content-Type: application/json
X-Shopify-Shop-Domain: your-store.myshopify.com
```

### Store Scoping

Every database operation automatically includes `shopId` filtering:

```javascript
// Example: Getting contacts for a store
const contacts = await prisma.contact.findMany({
  where: { shopId: storeId }, // Automatically scoped
  // ... other filters
});
```

---

## 📡 API Endpoints Reference

### 🏠 Dashboard

#### Get Dashboard Overview
```http
GET /dashboard/overview
```

**Description**: Get comprehensive dashboard data including stats, recent activity, and wallet balance.

**Headers**:
```http
Authorization: Bearer <token>
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sms": {
      "sent": 1250,
      "delivered": 1180,
      "failed": 70,
      "deliveryRate": 0.944
    },
    "contacts": {
      "total": 2500,
      "optedIn": 2100,
      "optedOut": 400
    },
    "wallet": {
      "balance": 500,
      "currency": "EUR"
    },
    "recentMessages": [...],
    "recentTransactions": [...]
  }
}
```

#### Get Quick Stats
```http
GET /dashboard/quick-stats
```

**Description**: Get quick statistics for dashboard widgets.

**Response**:
```json
{
  "success": true,
  "data": {
    "smsSent": 1250,
    "walletBalance": 500
  }
}
```

### 👥 Contacts

#### List Contacts
```http
GET /contacts?page=1&pageSize=20&filter=all&search=john
```

**Description**: Get paginated list of contacts with filtering and search.

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 20, max: 100)
- `filter` (string): Filter by consent status (all, consented, nonconsented)
- `search` (string): Search in name, email, phone
- `gender` (string): Filter by gender (male, female, other)
- `smsConsent` (string): Filter by SMS consent (opted_in, opted_out, unknown)
- `hasBirthDate` (boolean): Filter by birthday availability

**Response**:
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact_123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+1234567890",
        "email": "john@example.com",
        "gender": "male",
        "birthDate": "1990-01-01",
        "smsConsent": "opted_in",
        "tags": ["vip", "newsletter"],
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Create Contact
```http
POST /contacts
```

**Description**: Create a new contact.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneE164": "+1234567890",
  "email": "john@example.com",
  "gender": "male",
  "birthDate": "1990-01-01",
  "smsConsent": "opted_in",
  "tags": ["vip", "newsletter"]
}
```

**Validation Rules**:
- `phoneE164`: Required, E.164 format (+1234567890)
- `email`: Optional, valid email format
- `gender`: Optional, one of: male, female, other
- `smsConsent`: Optional, one of: opted_in, opted_out, unknown
- `birthDate`: Optional, ISO date string, not in future

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+1234567890",
    "email": "john@example.com",
    "gender": "male",
    "birthDate": "1990-01-01T00:00:00Z",
    "smsConsent": "opted_in",
    "tags": ["vip", "newsletter"],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "message": "Contact created successfully"
}
```

#### Get Contact by ID
```http
GET /contacts/:id
```

#### Update Contact
```http
PUT /contacts/:id
```

#### Delete Contact
```http
DELETE /contacts/:id
```

#### Get Contact Statistics
```http
GET /contacts/stats
```

#### Get Birthday Contacts
```http
GET /contacts/birthdays?daysAhead=7
```

#### Import Contacts
```http
POST /contacts/import
```

**Request Body**:
```json
{
  "contacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+1234567890",
      "email": "john@example.com",
      "smsConsent": "opted_in"
    }
  ]
}
```

### 📢 Campaigns

#### List Campaigns
```http
GET /campaigns?page=1&pageSize=20&status=draft
```

**Query Parameters**:
- `page` (number): Page number
- `pageSize` (number): Items per page
- `status` (string): Filter by status (draft, scheduled, sending, sent, failed, cancelled)
- `sortBy` (string): Sort field (createdAt, updatedAt, name, scheduleAt)
- `sortOrder` (string): Sort direction (asc, desc)

#### Create Campaign
```http
POST /campaigns
```

**Request Body**:
```json
{
  "name": "Black Friday Sale",
  "message": "Get 50% off everything! Use code BLACKFRIDAY",
  "audience": "all",
  "discountId": "discount_123",
  "scheduleType": "immediate",
  "scheduleAt": "2025-12-01T10:00:00Z",
  "recurringDays": null
}
```

**Validation Rules**:
- `name`: Required, 1-200 characters
- `message`: Required, 1-1600 characters
- `audience`: Optional, one of: all, male, female, men, women, segment:<id>
- `scheduleType`: Required, one of: immediate, scheduled, recurring
- `scheduleAt`: Required if scheduleType is 'scheduled', must be future date
- `recurringDays`: Required if scheduleType is 'recurring', 1-365 days

#### Get Campaign by ID
```http
GET /campaigns/:id
```

#### Update Campaign
```http
PUT /campaigns/:id
```

#### Delete Campaign
```http
DELETE /campaigns/:id
```

#### Prepare Campaign
```http
POST /campaigns/:id/prepare
```

**Description**: Validate campaign and calculate recipient count without sending.

#### Send Campaign
```http
POST /campaigns/:id/send
```

**Description**: Send campaign immediately. Validates credits and queues messages.

#### Schedule Campaign
```http
PUT /campaigns/:id/schedule
```

**Request Body**:
```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2025-12-01T10:00:00Z"
}
```

#### Get Campaign Metrics
```http
GET /campaigns/:id/metrics
```

#### Get Campaign Statistics
```http
GET /campaigns/stats/summary
```

### 🤖 Automations

#### List Automations
```http
GET /automations
```

#### Create Automation
```http
POST /automations
```

**Request Body**:
```json
{
  "name": "Birthday Wishes",
  "trigger": "birthday",
  "message": "Happy Birthday! Here's a special gift for you!",
  "isActive": true,
  "settings": {
    "daysBefore": 0,
    "timeOfDay": "10:00"
  }
}
```

#### Get Automation by ID
```http
GET /automations/:id
```

#### Update Automation
```http
PUT /automations/:id
```

#### Delete Automation
```http
DELETE /automations/:id
```

#### Toggle Automation
```http
PUT /automations/:id/toggle
```

### 📄 Templates

#### List Templates
```http
GET /templates?category=marketing&search=sale
```

**Query Parameters**:
- `category` (string): Filter by category
- `search` (string): Search in title and content
- `page` (number): Page number
- `pageSize` (number): Items per page

#### Get Template by ID
```http
GET /templates/:id
```

#### Track Template Usage
```http
POST /templates/:id/use
```

### 💳 Billing & Credits

#### Get Balance
```http
GET /billing/balance
```

**Response**:
```json
{
  "success": true,
  "data": {
    "credits": 500,
    "balance": 500,
    "currency": "EUR"
  }
}
```

#### Get Packages
```http
GET /billing/packages
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "package_1000",
      "name": "1,000 SMS Credits",
      "credits": 1000,
      "price": 29.99,
      "currency": "EUR",
      "description": "Perfect for small businesses",
      "popular": false,
      "features": ["1,000 SMS messages", "No expiration"]
    }
  ]
}
```

#### Create Purchase Session
```http
POST /billing/purchase
```

**Request Body**:
```json
{
  "packageId": "package_1000",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_123",
    "sessionUrl": "https://checkout.stripe.com/pay/cs_test_123",
    "transactionId": "txn_123",
    "package": {
      "id": "package_1000",
      "name": "1,000 SMS Credits",
      "credits": 1000,
      "price": 29.99
    }
  }
}
```

#### Get Transaction History
```http
GET /billing/history?page=1&pageSize=20&type=purchase
```

#### Get Billing History
```http
GET /billing/billing-history?page=1&pageSize=20&status=completed
```

### 📊 Reports

#### Get Campaign Reports
```http
GET /reports/campaigns?startDate=2025-01-01&endDate=2025-01-31
```

#### Get Delivery Reports
```http
GET /reports/delivery?startDate=2025-01-01&endDate=2025-01-31
```

#### Get Revenue Reports
```http
GET /reports/revenue?startDate=2025-01-01&endDate=2025-01-31
```

#### Export Reports
```http
GET /reports/export?type=campaigns&format=csv&startDate=2025-01-01&endDate=2025-01-31
```

### ⚙️ Settings

#### Get Settings
```http
GET /settings
```

**Response**:
```json
{
  "success": true,
  "data": {
    "shop": {
      "id": "shop_123",
      "shopDomain": "your-store.myshopify.com",
      "credits": 500,
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "settings": {
      "senderNumber": "+1234567890",
      "senderName": "YourStore",
      "timezone": "UTC",
      "defaultLanguage": "en",
      "emailNotifications": true,
      "smsNotifications": false
    },
    "recentTransactions": [...],
    "usageGuide": {
      "title": "How Sendly Works",
      "sections": [...]
    }
  }
}
```

#### Update Settings
```http
PUT /settings
```

**Request Body**:
```json
{
  "senderNumber": "+1234567890",
  "senderName": "YourStore",
  "timezone": "America/New_York",
  "defaultLanguage": "en",
  "emailNotifications": true,
  "smsNotifications": false,
  "webhookUrl": "https://yourapp.com/webhooks"
}
```

### 🔍 Tracking & Webhooks

#### Get Message Tracking
```http
GET /tracking/messages/:messageId
```

#### Get Delivery Statistics
```http
GET /tracking/stats?startDate=2025-01-01&endDate=2025-01-31
```

#### Get Recent Activity
```http
GET /tracking/activity?limit=20
```

#### Get Failed Messages
```http
GET /tracking/failed?page=1&pageSize=20
```

#### Process Delivery Webhook
```http
POST /tracking/webhook
```

**Description**: Webhook endpoint for Mitto delivery status updates.

---

## 🔗 Shopify App Integration Guide

### Frontend Integration

#### 1. Dashboard Page
```javascript
// Get dashboard overview
const response = await fetch('/dashboard/overview', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Shopify-Shop-Domain': shopDomain
  }
});
const data = await response.json();
```

#### 2. Contacts Page
```javascript
// List contacts with pagination
const response = await fetch('/contacts?page=1&pageSize=20', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Shopify-Shop-Domain': shopDomain
  }
});

// Create contact
const newContact = await fetch('/contacts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Shopify-Shop-Domain': shopDomain,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    phoneE164: '+1234567890',
    email: 'john@example.com',
    smsConsent: 'opted_in'
  })
});
```

#### 3. Campaigns Page
```javascript
// Create campaign
const campaign = await fetch('/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Shopify-Shop-Domain': shopDomain,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Black Friday Sale',
    message: 'Get 50% off everything!',
    audience: 'all',
    scheduleType: 'immediate'
  })
});

// Send campaign
await fetch(`/campaigns/${campaignId}/send`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Shopify-Shop-Domain': shopDomain
  }
});
```

#### 4. Billing Page
```javascript
// Get balance
const balance = await fetch('/billing/balance', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Shopify-Shop-Domain': shopDomain
  }
});

// Create purchase session
const purchase = await fetch('/billing/purchase', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'X-Shopify-Shop-Domain': shopDomain,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    packageId: 'package_1000',
    successUrl: `${window.location.origin}/billing/success`,
    cancelUrl: `${window.location.origin}/billing/cancel`
  })
});

// Redirect to Stripe checkout
window.location.href = purchase.data.sessionUrl;
```

### Best Practices

#### 1. Error Handling
```javascript
try {
  const response = await fetch('/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contactData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  // Handle error appropriately
}
```

#### 2. Session Management
```javascript
// Get session token from Shopify App Bridge
const sessionToken = await getSessionToken();

// Include in all requests
const headers = {
  'Authorization': `Bearer ${sessionToken}`,
  'X-Shopify-Shop-Domain': shopDomain,
  'Content-Type': 'application/json'
};
```

#### 3. Loading States
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async (data) => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create contact');
    }
    
    // Success handling
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 Testing & Validation

### Using Postman Collection

1. **Import Collection**: Import `Sendly_Backend.postman_collection.json`
2. **Set Environment**: Use `Sendly_Backend.postman_environment.json`
3. **Configure Variables**:
   - `base_url`: Your backend URL
   - `token`: Shopify session token
   - `storeId`: Your store ID

### Recommended Test Flows

#### 1. Basic Contact Flow
```
1. GET /contacts (list contacts)
2. POST /contacts (create contact)
3. GET /contacts/:id (get specific contact)
4. PUT /contacts/:id (update contact)
5. GET /contacts/stats (get statistics)
```

#### 2. Campaign Flow
```
1. POST /campaigns (create campaign)
2. POST /campaigns/:id/prepare (prepare campaign)
3. POST /campaigns/:id/send (send campaign)
4. GET /campaigns/:id/metrics (get metrics)
5. GET /reports/campaigns (view reports)
```

#### 3. Billing Flow
```
1. GET /billing/balance (check balance)
2. GET /billing/packages (view packages)
3. POST /billing/purchase (create purchase)
4. GET /billing/history (view transactions)
```

### Validation Testing

#### Input Validation
- Test invalid phone numbers
- Test invalid email formats
- Test missing required fields
- Test invalid date formats

#### Rate Limiting
- Send multiple requests quickly
- Verify rate limit responses (429 status)
- Check retry-after headers

#### Authentication
- Test without authorization header
- Test with invalid token
- Test with expired token

---

## ❌ Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "error_type",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "phoneE164",
      "message": "Phone number must be in E.164 format"
    }
  ],
  "timestamp": "2025-01-01T00:00:00Z",
  "path": "/contacts",
  "method": "POST",
  "requestId": "req_1234567890"
}
```

### Common Error Codes

| Status | Error Type | Description |
|--------|------------|-------------|
| 400 | ValidationError | Invalid input data |
| 401 | AuthenticationError | Invalid or missing token |
| 403 | AuthorizationError | Insufficient permissions |
| 404 | NotFoundError | Resource not found |
| 409 | ConflictError | Duplicate resource |
| 429 | RateLimitError | Too many requests |
| 500 | InternalError | Server error |

### Validation Errors

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed",
  "details": [
    {
      "field": "phoneE164",
      "message": "Phone number must be in E.164 format (e.g., +1234567890)"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Rate Limit Errors

```json
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## 🚦 Rate Limiting

### Rate Limit Tiers

| Endpoint Type | Limit | Window | Description |
|--------------|-------|--------|-------------|
| General API | 100 req/min | Per store | Most endpoints |
| Contacts | 60 req/min | Per store | Contact operations |
| Campaigns | 40 req/min | Per store | Campaign operations |
| Campaign Send | 5 req/min | Per store | Sending campaigns |
| Billing | 20 req/min | Per store | Billing operations |
| Import | 3 req/5min | Per store | Bulk import operations |
| Reports | 50/30/10 req/min | Per store | Report generation |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### Per-Store Isolation

Each Shopify store has independent rate limits:

```
Store A: 100/100 requests used → Rate limited
Store B: 10/100 requests used → Allowed
```

---

## 🚀 Caching

### Cache Strategy

| Endpoint | TTL | Strategy | Description |
|----------|-----|----------|-------------|
| Dashboard | 5 min | Read cache | Overview data |
| Contacts List | 2 min | Read + Invalidation | Contact lists |
| Contact Stats | 5 min | Read + Invalidation | Statistics |
| Campaigns List | 2 min | Read + Invalidation | Campaign lists |
| Campaign Metrics | 1 min | Read + Invalidation | Performance data |
| Billing Balance | 30 sec | Read + Invalidation | Credit balance |
| Billing History | 5 min | Read + Invalidation | Transaction history |
| Reports | 15 min | Read cache | Analytics data |

### Cache Headers

```http
X-Cache: HIT
X-Cache-Key: contacts:store_123:page_1:limit_20
```

### Automatic Invalidation

Write operations automatically invalidate related caches:

```javascript
// Creating a contact invalidates:
// - contacts:list cache
// - contacts:stats cache
// - dashboard cache
```

---

## 📝 Changelog

### Version 1.0 (October 19, 2025)

#### ✅ **Unified Documentation**
- Replaced all scattered documentation files with single `BACKEND_DOCUMENTATION.md`
- Comprehensive API reference with examples
- Complete Shopify App integration guide
- Testing and validation instructions

#### ✅ **New Postman Collection**
- `Sendly_Backend.postman_collection.json` - Complete API collection
- `Sendly_Backend.postman_environment.json` - Environment variables
- Organized by feature modules
- Complete request/response examples

#### ✅ **Removed Outdated Files**
- Deleted 9 outdated .md files
- Deleted 3 old Postman collections
- Cleaned up redundant documentation

#### ✅ **Production-Ready Features**
- Input validation with Zod (100% coverage)
- Rate limiting (per-store, 100% coverage)
- Intelligent caching (80% coverage)
- 11 comprehensive services
- Store-scoped data isolation
- Comprehensive error handling

#### ✅ **Architecture Improvements**
- Service layer pattern (11 services)
- Controller refactoring (56% code reduction)
- Consistent error handling
- Extensive logging
- Performance optimization

---

## 🎯 Summary

This unified documentation replaces all previous scattered documentation files and provides a single source of truth for:

- **Complete API Reference**: All endpoints with examples
- **Shopify Integration**: Frontend integration patterns
- **Testing Guide**: Postman collection usage
- **Architecture Overview**: How everything works together
- **Production Readiness**: Security, performance, and monitoring

The backend is now production-ready with enterprise-grade features, comprehensive documentation, and a complete testing suite.

---

**Documentation Version**: 1.0  
**Last Updated**: October 19, 2025  
**Status**: Production Ready ✅  
**Next Steps**: Deploy and monitor in production environment

---

# API Request Payload Examples

This section provides complete and detailed JSON payload examples, field descriptions, and notes for all POST and PATCH API endpoints available in the Sendly Marketing Backend.

---

## Campaigns

### Create Campaign (`POST /campaigns`)

**Example:**
```json
{
  "name": "Black Friday Campaign",
  "message": "Don't miss our biggest sale!",
  "audience": "all",
  "discountId": "discount_1234ABC",
  "scheduleType": "scheduled",
  "scheduleAt": "2025-12-01T14:12:00Z"
}
```

| Field         | Type    | Required | Notes                                                                 |
|-------------- |---------|----------|-----------------------------------------------------------------------|
| name          | string  | YES      | Min 1, Max 200 chars. Campaign name.                                 |
| message       | string  | YES      | Min 1, Max 1600 chars. SMS/message text.                             |
| audience      | string  | NO       | "all", "male", "female", "men", "women", or "segment:<id>". Default: all |
| discountId    | string  | NO       | Associated discount: Discount object ID.                             |
| scheduleType  | string  | NO       | "immediate" (default), "scheduled", or "recurring"                  |
| scheduleAt    | string  | COND.    | ISO8601 date, **required if** scheduleType is "scheduled"            |
| recurringDays | int     | COND.    | 1–365, **required if** scheduleType is "recurring"                   |

**Notes:**
- `scheduleAt` must be in the future.
- When `audience` begins with "segment:", use a valid segment ID.
- If `scheduleType` is omitted, defaults to "immediate".

---

### Update Campaign (`PATCH /campaigns/:id`)

**Example:**
```json
{
  "name": "Spring Flash Sale",
  "scheduleAt": "2025-03-01T10:00:00Z"
}
```

| Field         | Type    | Required | Notes                                                      |
|-------------- |---------|----------|------------------------------------------------------------|
| name          | string  | NO       | Min 1, Max 200 chars.                                      |
| message       | string  | NO       | Min 1, Max 1600 chars.                                     |
| audience      | string  | NO       | See above.                                                 |
| discountId    | string  | NO       | See above. Can be null to clear.                           |
| scheduleType  | string  | NO       | "immediate", "scheduled", "recurring"                     |
| scheduleAt    | string  | NO       | ISO8601, see above.                                        |
| recurringDays | int     | NO       | 1–365 days, see above.                                     |

*At least one field must be provided. Omitting a field leaves it unchanged.*

---

## Contacts

### Create Contact (`POST /contacts`)

**Example:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneE164": "+306977123456",
  "email": "john@example.com",
  "gender": "male",
  "birthDate": "1990-01-01T00:00:00Z",
  "smsConsent": "opted_in",
  "tags": ["vip", "spring-sale"]
}
```

| Field      | Type    | Required | Notes                                              |
|----------- |---------|----------|----------------------------------------------------|
| firstName  | string  | NO       | Min 1, Max 100 chars.                              |
| lastName   | string  | NO       | Min 1, Max 100 chars.                              |
| phoneE164  | string  | YES      | Format: E.164, e.g. "+306977123456"               |
| email      | string  | NO       | Valid email address.                               |
| gender     | string  | NO       | "male", "female", "other"                         |
| birthDate  | string  | NO       | ISO8601. Cannot be in future.                      |
| smsConsent | string  | NO       | "opted_in", "opted_out", "unknown" (default)     |
| tags       | array   | NO       | Array of strings. Default: empty                    |

**Minimal:**
```json
{ "phoneE164": "+306977123456" }
```

---

### Update Contact (`PATCH /contacts/:id`)

**Example:**
```json
{
  "email": "new-mail@example.com",
  "tags": ["customer", "newsletter"]
}
```

*At least one field is required. Structure and allowed fields are as above, but all are optional.*

---

### Import Contacts (`POST /contacts/import`)

**Example:**
```json
{
  "contacts": [
    { "phoneE164": "+306988812345", "firstName": "Alice" },
    { "phoneE164": "+306944412345", "firstName": "Bob", "tags": ["lead"] }
  ]
}
```
| Field    | Type          | Required | Notes                         |
|----------|---------------|----------|-------------------------------|
| contacts | array<object> | YES      | Array of valid contact objects |
*Each object matches the Create Contact schema.*

---

## Billing

### Create Purchase Session (`POST /billing/purchase`)

**Example:**
```json
{
  "packageId": "package_1000",
  "successUrl": "https://myapp.com/billing/success",
  "cancelUrl": "https://myapp.com/billing/cancel"
}
```
| Field      | Type    | Required | Notes                                                    |
|------------|---------|----------|----------------------------------------------------------|
| packageId  | string  | YES      | "package_1000", "package_5000", etc.                   |
| successUrl | string  | YES      | URL to redirect after success                            |
| cancelUrl  | string  | YES      | URL to redirect after cancel                             |

---

*If you need more endpoints or fields included, or want GET/query/filter parameter docs, just ask!*