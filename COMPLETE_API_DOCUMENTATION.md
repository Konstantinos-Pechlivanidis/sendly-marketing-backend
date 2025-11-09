# 📚 Complete API Documentation

**Sendly Marketing Backend - Complete API Reference**

**Version:** 1.0.0  
**Base URL:** `https://sendly-marketing-backend.onrender.com`  
**Last Updated:** 2025-01-XX

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Shopify Configuration](#shopify-configuration)
3. [Authentication & Store Resolution](#authentication--store-resolution)
4. [API Endpoints](#api-endpoints)
   - [Core Endpoints](#core-endpoints)
   - [Dashboard](#dashboard)
   - [Contacts](#contacts)
   - [Campaigns](#campaigns)
   - [Automations](#automations)
   - [Billing](#billing)
   - [Settings](#settings)
   - [Reports](#reports)
   - [Templates](#templates)
   - [Audiences](#audiences)
   - [Discounts](#discounts)
   - [Tracking](#tracking)
   - [Shopify Integration](#shopify-integration)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Webhooks](#webhooks)

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis (optional, falls back to memory cache)
- Shopify Partner account
- Mitto SMS account

### Base URL

```
Production: https://sendly-marketing-backend.onrender.com
Development: http://localhost:3001
```

### API Version

Current API version: `1.0.0`

Specify version via:
- Header: `API-Version: 1.0.0`
- Query: `?version=1.0.0`

---

## Shopify Configuration

### 1. Create Shopify App

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Create a new app
3. Configure app settings:
   - **App URL:** `https://sendly-marketing-backend.onrender.com`
   - **Allowed redirection URL(s):** `https://sendly-marketing-backend.onrender.com/auth/callback`

### 2. Required Scopes

Your app needs the following scopes:

```
read_customers
write_customers
read_orders
read_discounts
write_discounts
read_checkouts
read_price_rules
write_price_rules
read_products
```

### 3. Environment Variables

Add these to your `.env` file:

```bash
# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SCOPES=read_customers,write_customers,read_orders,read_discounts,write_discounts,read_checkouts,read_price_rules,write_price_rules,read_products
HOST=https://sendly-marketing-backend.onrender.com
```

### 4. OAuth Flow

The app uses Shopify OAuth 2.0 for authentication:

1. **Installation URL:**
   ```
   https://{shop}.myshopify.com/admin/oauth/authorize?client_id={SHOPIFY_API_KEY}&scope={SCOPES}&redirect_uri={HOST}/auth/callback
   ```

2. **Callback Handler:**
   - Receives authorization code
   - Exchanges code for access token
   - Stores token in database (`Shop.accessToken`)

3. **Session Management:**
   - Sessions stored in `ShopifySession` table
   - Access tokens stored in `Shop.accessToken`
   - Automatic token refresh handled by Shopify API library

### 5. App Installation

When a merchant installs your app:

1. Shopify redirects to your callback URL
2. Your backend exchanges the code for an access token
3. Store is created/updated in database:
   ```javascript
   {
     shopDomain: "store.myshopify.com",
     accessToken: "shpat_...",
     status: "active"
   }
   ```

### 6. Making Shopify API Calls

```javascript
import { getShopifySession } from './services/shopify.js';

const session = await getShopifySession('store.myshopify.com');
const client = new shopifyApi.clients.Rest({ session });

// Get discount codes
const response = await client.get({
  path: 'discount_codes',
  query: { limit: 10 }
});
```

---

## Authentication & Store Resolution

### Store Context

All store-scoped endpoints require **store context** to identify which Shopify store the request belongs to.

### Methods to Provide Store Context

#### Method 1: Header (Recommended)

```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/contacts" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

#### Method 2: Alternative Headers

```http
X-Shopify-Shop: your-store.myshopify.com
X-Shopify-Shop-Name: your-store
```

#### Method 3: Query Parameter

```http
GET /campaigns?shop=your-store.myshopify.com
```

#### Method 4: Body Parameter (POST/PUT)

```json
{
  "shop": "your-store.myshopify.com",
  "name": "Campaign Name",
  ...
}
```

#### Method 5: URL Path (Embedded Apps)

```
/store/your-store.myshopify.com/campaigns
```

### Standard Headers

```http
Content-Type: application/json
Accept: application/json
API-Version: 1.0.0
X-Request-ID: {uuid}
```

### Response Format

All responses follow a standardized format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Paginated:**
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
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

**Error:**
```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": [ ... ]
}
```

---

## API Endpoints

### Core Endpoints

#### GET `/`

Basic API status check.

**Request:**
```bash
curl https://sendly-marketing-backend.onrender.com/
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "message": "Sendly API",
  "time": 1705312200000
}
```

---

#### GET `/health`

Basic health check.

**Request:**
```bash
curl https://sendly-marketing-backend.onrender.com/health
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "t": 1705312200000
}
```

---

#### GET `/health/config`

Configuration health check.

**Request:**
```bash
curl https://sendly-marketing-backend.onrender.com/health/config
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "shopify": {
    "hasApiKey": true,
    "hasApiSecret": true,
    "scopesCount": 9,
    "embedded": true,
    "apiVersion": "April25"
  },
  "redis": true,
  "mitto": {
    "base": "https://messaging.mittoapi.com",
    "hasKey": true
  }
}
```

---

#### GET `/health/full`

Comprehensive health check with all services.

**Request:**
```bash
curl https://sendly-marketing-backend.onrender.com/health/full
```

**Response:** `200 OK`
```json
{
  "ok": true,
  "checks": {
    "db": {
      "status": "healthy",
      "responseTime": "5ms"
    },
    "redis": {
      "status": "healthy",
      "responseTime": "2ms",
      "latency": "2ms"
    },
    "cache": {
      "status": "healthy"
    },
    "queue": {
      "status": "healthy",
      "responseTime": "10ms"
    },
    "mitto": {
      "status": "healthy",
      "responseTime": "50ms"
    },
    "shopify": {
      "apiKey": true,
      "apiSecret": true
    }
  },
  "metrics": {
    "memory": { ... },
    "cpu": { ... },
    "uptime": 3600,
    "nodeVersion": "v18.0.0",
    "platform": "linux"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "responseTime": "100ms"
}
```

---

#### GET `/whoami`

Get current store context information.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/whoami" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "shop": {
    "id": "shop-id-123",
    "shopDomain": "your-store.myshopify.com",
    "credits": 500,
    "currency": "EUR",
    "timezone": "Europe/Athens"
  }
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "STORE_CONTEXT_REQUIRED",
  "message": "Store context required. Please ensure you are properly authenticated."
}
```

---

#### GET `/metrics`

Get application metrics.

**Query Parameters:**
- `format` (optional): `json` or `prometheus` (default: `json`)

**Request:**
```bash
curl "https://sendly-marketing-backend.onrender.com/metrics?format=json"
```

**Response:** `200 OK`
```json
{
  "requests": {
    "total": 1000,
    "successful": 950,
    "failed": 50,
    "byMethod": {
      "GET": 600,
      "POST": 300,
      "PUT": 80,
      "DELETE": 20
    }
  },
  "errors": {
    "total": 50,
    "byType": {
      "ValidationError": 30,
      "NotFoundError": 15,
      "InternalError": 5
    }
  },
  "database": {
    "queries": 5000,
    "avgResponseTime": 5,
    "slowQueries": 10
  },
  "cache": {
    "hits": 800,
    "misses": 200,
    "hitRate": 0.8
  }
}
```

---

### Dashboard

#### GET `/dashboard/overview`

Get comprehensive dashboard data.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/dashboard/overview" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
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
    "recentMessages": [
      {
        "id": "msg-123",
        "phoneE164": "+306977123456",
        "status": "delivered",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "recentTransactions": [
      {
        "id": "txn-123",
        "type": "purchase",
        "credits": 1000,
        "createdAt": "2024-01-15T09:00:00Z"
      }
    ]
  }
}
```

---

#### GET `/dashboard/quick-stats`

Get quick statistics for dashboard widgets.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/dashboard/quick-stats" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "smsSent": 1250,
    "walletBalance": 500,
    "totalContacts": 2500,
    "activeCampaigns": 5
  }
}
```

---

### Contacts

#### GET `/contacts`

List contacts with filtering, search, and pagination.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `pageSize` | number | Items per page (max 100) | 20 |
| `filter` | string | Filter by consent (`all`, `consented`, `nonconsented`) | `all` |
| `q` | string | Search in name, email, phone | - |
| `gender` | string | Filter by gender (`male`, `female`, `other`) | - |
| `smsConsent` | string | Filter by SMS consent (`opted_in`, `opted_out`, `unknown`) | - |
| `hasBirthDate` | string | Filter by birthday availability (`true`, `false`) | - |
| `sortBy` | string | Sort field (`createdAt`, `updatedAt`, `firstName`, `lastName`) | `createdAt` |
| `sortOrder` | string | Sort order (`asc`, `desc`) | `desc` |

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/contacts?page=1&pageSize=20&filter=consented&q=john" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "contact-123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+306977123456",
        "email": "john@example.com",
        "gender": "male",
        "birthDate": "1990-01-01T00:00:00.000Z",
        "smsConsent": "opted_in",
        "tags": ["vip", "customer"],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
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

---

#### POST `/contacts`

Create a new contact.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneE164": "+306977123456",
  "email": "john@example.com",
  "gender": "male",
  "birthDate": "1990-01-01T00:00:00.000Z",
  "smsConsent": "opted_in",
  "tags": ["vip", "customer"]
}
```

**Request:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/contacts" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306977123456",
    "email": "john@example.com",
    "smsConsent": "opted_in"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "contact-123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306977123456",
    "email": "john@example.com",
    "gender": "male",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "smsConsent": "opted_in",
    "tags": ["vip", "customer"],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Contact created successfully"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed",
  "details": [
    {
      "field": "phoneE164",
      "message": "Phone number must be in E.164 format (e.g., +1234567890)"
    }
  ]
}
```

---

#### GET `/contacts/:id`

Get a single contact by ID.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/contacts/contact-123" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "contact-123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306977123456",
    "email": "john@example.com",
    "gender": "male",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "smsConsent": "opted_in",
    "tags": ["vip", "customer"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Contact not found"
}
```

---

#### PUT `/contacts/:id`

Update an existing contact.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "smsConsent": "opted_out"
}
```

**Request:**
```bash
curl -X PUT "https://sendly-marketing-backend.onrender.com/contacts/contact-123" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "smsConsent": "opted_out"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "contact-123",
    "firstName": "Jane",
    "lastName": "Doe",
    "phoneE164": "+306977123456",
    "email": "jane@example.com",
    "smsConsent": "opted_out",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### DELETE `/contacts/:id`

Delete a contact.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X DELETE "https://sendly-marketing-backend.onrender.com/contacts/contact-123" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

---

#### GET `/contacts/stats`

Get contact statistics.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/contacts/stats" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total": 2500,
    "optedIn": 2100,
    "optedOut": 400,
    "byGender": {
      "male": 1200,
      "female": 900,
      "other": 100
    }
  }
}
```

---

#### GET `/contacts/birthdays`

Get contacts with upcoming birthdays.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `daysAhead` | number | Days ahead to check (max 365) | 7 |

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/contacts/birthdays?daysAhead=7" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "contact-123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+306977123456",
        "birthDate": "1990-01-22T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

#### POST `/contacts/import`

Import multiple contacts (bulk import).

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "contacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+306977123456",
      "email": "john@example.com",
      "smsConsent": "opted_in"
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "phoneE164": "+306977123457",
      "email": "jane@example.com",
      "smsConsent": "opted_in"
    }
  ]
}
```

**Request:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/contacts/import" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {
        "firstName": "John",
        "phoneE164": "+306977123456",
        "smsConsent": "opted_in"
      }
    ]
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "imported": 10,
    "failed": 2,
    "errors": [
      {
        "index": 5,
        "phoneE164": "+1234567890",
        "error": "Invalid phone number format"
      }
    ]
  }
}
```

---

### Campaigns

#### GET `/campaigns`

List campaigns with filtering and pagination.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `pageSize` | number | Items per page (max 100) | 20 |
| `status` | string | Filter by status (`draft`, `scheduled`, `sending`, `sent`, `failed`, `cancelled`) | - |
| `sortBy` | string | Sort field (`createdAt`, `updatedAt`, `name`, `scheduleAt`) | `createdAt` |
| `sortOrder` | string | Sort order (`asc`, `desc`) | `desc` |

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/campaigns?page=1&pageSize=20&status=sent" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "campaign-123",
        "name": "Summer Sale",
        "message": "Get 20% off on summer items!",
        "audience": "all",
        "status": "sent",
        "scheduleType": "immediate",
        "scheduleAt": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

#### POST `/campaigns`

Create a new campaign.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer Sale",
  "message": "Get 20% off on summer items! Use code SUMMER20",
  "audience": "all",
  "discountId": null,
  "scheduleType": "immediate"
}
```

**Request:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/campaigns" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale",
    "message": "Get 20% off on summer items!",
    "audience": "all",
    "scheduleType": "immediate"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "campaign-123",
    "name": "Summer Sale",
    "message": "Get 20% off on summer items! Use code SUMMER20",
    "audience": "all",
    "status": "draft",
    "scheduleType": "immediate",
    "scheduleAt": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Campaign created successfully"
}
```

---

#### POST `/campaigns/:id/prepare`

Prepare campaign for sending (validate and calculate recipient count).

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/campaigns/campaign-123/prepare" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "recipientsCount": 100,
    "estimatedCredits": 100,
    "canSend": true
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "INSUFFICIENT_CREDITS",
  "message": "Insufficient credits. Required: 100, Available: 50"
}
```

---

#### POST `/campaigns/:id/send`

Send campaign immediately.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/campaigns/campaign-123/send" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "status": "sending",
    "recipientsCount": 100,
    "jobsQueued": 5,
    "batches": 5
  },
  "message": "Campaign queued for sending"
}
```

---

#### PUT `/campaigns/:id/schedule`

Schedule campaign for later sending.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2024-12-01T10:00:00Z",
  "recurringDays": null
}
```

**Request:**
```bash
curl -X PUT "https://sendly-marketing-backend.onrender.com/campaigns/campaign-123/schedule" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleType": "scheduled",
    "scheduleAt": "2024-12-01T10:00:00Z"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "campaign-123",
    "scheduleType": "scheduled",
    "scheduleAt": "2024-12-01T10:00:00Z",
    "status": "scheduled"
  }
}
```

---

#### GET `/campaigns/:id/metrics`

Get campaign performance metrics.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/campaigns/campaign-123/metrics" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "totalSent": 100,
    "totalDelivered": 95,
    "totalFailed": 5,
    "deliveryRate": 0.95,
    "totalClicked": 20
  }
}
```

---

#### POST `/campaigns/:id/retry-failed`

Retry failed SMS messages for a campaign.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/campaigns/campaign-123/retry-failed" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "retriedCount": 5,
    "status": "queued"
  },
  "message": "Failed messages queued for retry"
}
```

---

### Billing

#### GET `/billing/balance`

Get current credit balance.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/billing/balance" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
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

---

#### GET `/billing/packages`

Get available credit packages.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/billing/packages" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "package_1000",
      "name": "Starter",
      "credits": 1000,
      "price": 50,
      "priceCents": 5000,
      "currency": "EUR",
      "description": "Perfect for small businesses",
      "isPopular": false,
      "features": []
    },
    {
      "id": "package_5000",
      "name": "Professional",
      "credits": 5000,
      "price": 200,
      "priceCents": 20000,
      "currency": "EUR",
      "description": "Best for growing businesses",
      "isPopular": true,
      "features": []
    }
  ]
}
```

---

#### POST `/billing/purchase`

Create Stripe checkout session for credit purchase.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "packageId": "package_5000",
  "successUrl": "https://your-store.myshopify.com/admin/apps/sendly/success",
  "cancelUrl": "https://your-store.myshopify.com/admin/apps/sendly/cancel"
}
```

**Request:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/billing/purchase" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "package_5000",
    "successUrl": "https://your-store.myshopify.com/admin/apps/sendly/success",
    "cancelUrl": "https://your-store.myshopify.com/admin/apps/sendly/cancel"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/c/pay/cs_test_...",
    "packageInfo": {
      "id": "package_5000",
      "name": "Professional",
      "credits": 5000,
      "price": 200,
      "currency": "EUR"
    }
  },
  "message": "Checkout session created successfully"
}
```

---

### Settings

#### GET `/settings`

Get shop settings and configuration.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/settings" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "shop": {
      "id": "shop-id",
      "shopDomain": "your-store.myshopify.com",
      "credits": 500,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "settings": {
      "currency": "EUR",
      "timezone": "Europe/Athens",
      "senderNumber": "Sendly",
      "senderName": "Sendly"
    }
  }
}
```

---

#### PUT `/settings/sender`

Update sender number and name.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "senderNumber": "Sendly",
  "senderName": "Sendly"
}
```

**Request:**
```bash
curl -X PUT "https://sendly-marketing-backend.onrender.com/settings/sender" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "senderNumber": "Sendly",
    "senderName": "Sendly"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "senderNumber": "Sendly",
    "senderName": "Sendly",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Sender number updated successfully"
}
```

---

### Reports

#### GET `/reports/kpis`

Get key performance indicators.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/reports/kpis" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
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
      "optedIn": 2100
    },
    "campaigns": {
      "total": 50,
      "sent": 30,
      "scheduled": 10
    }
  }
}
```

---

### Audiences

#### GET `/audiences`

Get predefined audiences for campaign targeting.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/audiences" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "audiences": [
      {
        "id": "all",
        "name": "All (SMS Consented)",
        "description": "All contacts who have opted in to receive SMS messages",
        "type": "predefined",
        "contactCount": 2100,
        "isAvailable": true
      },
      {
        "id": "men",
        "name": "Men",
        "description": "Male contacts who have opted in to receive SMS messages",
        "type": "predefined",
        "contactCount": 1200,
        "isAvailable": true
      },
      {
        "id": "women",
        "name": "Women",
        "description": "Female contacts who have opted in to receive SMS messages",
        "type": "predefined",
        "contactCount": 900,
        "isAvailable": true
      }
    ],
    "totalContacts": 2100
  }
}
```

---

### Tracking

#### GET `/tracking/mitto/:messageId`

Get delivery status for a specific Mitto message.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/tracking/mitto/message-123" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "messageId": "message-123",
    "status": "delivered",
    "deliveredAt": "2024-01-15T10:05:00.000Z",
    "deliveryStatus": "Delivered"
  }
}
```

---

#### GET `/tracking/campaign/:campaignId`

Get delivery status for all messages in a campaign.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/tracking/campaign/campaign-123" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-123",
    "total": 100,
    "delivered": 95,
    "failed": 5,
    "pending": 0,
    "messages": [
      {
        "id": "recipient-123",
        "phoneE164": "+306977123456",
        "status": "delivered",
        "deliveredAt": "2024-01-15T10:05:00.000Z"
      }
    ]
  }
}
```

---

### Shopify Integration

#### GET `/shopify/discounts`

Get available discount codes from Shopify.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Request:**
```bash
curl -X GET "https://sendly-marketing-backend.onrender.com/shopify/discounts" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "id": "discount-123",
        "title": "Summer Sale",
        "code": "SUMMER20",
        "isActive": true,
        "isExpired": false,
        "status": "ACTIVE"
      }
    ],
    "total": 10,
    "active": 8
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "phoneE164",
      "message": "Phone number must be in E.164 format"
    }
  ]
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `STORE_NOT_FOUND` | 404 | Store not found in database |
| `STORE_CONTEXT_REQUIRED` | 401 | Store context required but not provided |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `INSUFFICIENT_CREDITS` | 400 | Not enough credits to perform action |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Error Examples

**Validation Error:**
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
      "message": "Email must be a valid email address"
    }
  ]
}
```

**Insufficient Credits:**
```json
{
  "success": false,
  "error": "INSUFFICIENT_CREDITS",
  "message": "Insufficient credits. Required: 100, Available: 50"
}
```

**Store Context Required:**
```json
{
  "success": false,
  "error": "STORE_CONTEXT_REQUIRED",
  "message": "Shop context is required to access this resource. Please ensure you are properly authenticated."
}
```

---

## Rate Limiting

### Rate Limits

Different endpoints have different rate limits:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Standard endpoints | 100 requests | 1 minute |
| Campaign send | 10 requests | 1 minute |
| Contact import | 5 requests | 1 minute |
| Reports export | 2 requests | 1 minute |

### Rate Limit Headers

Responses include rate limit information:

```http
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: 1705312260
```

### Rate Limit Exceeded Response

**Status:** `429 Too Many Requests`

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## Webhooks

### Stripe Webhooks

**Endpoint:** `POST /webhooks/stripe`

**Headers:**
```http
Stripe-Signature: t=...,v1=...
Content-Type: application/json
```

**Events Handled:**
- `checkout.session.completed` - Credit purchase completed
- `payment_intent.succeeded` - Payment succeeded

### Mitto Webhooks

**Endpoint:** `POST /webhooks/mitto/dlr`

**Headers:**
```http
Content-Type: application/json
```

**Payload:**
```json
{
  "messageId": "mitto-msg-123",
  "status": "Delivered",
  "timestamp": "2024-01-15T10:05:00Z"
}
```

### Shopify Webhooks

**Endpoint:** `POST /automation-webhooks/shopify/orders/create`

**Headers:**
```http
X-Shopify-Topic: orders/create
X-Shopify-Shop-Domain: your-store.myshopify.com
X-Shopify-Hmac-Sha256: ...
Content-Type: application/json
```

**Events Handled:**
- `orders/create` - Order created (triggers order confirmation automation)
- `carts/abandoned` - Cart abandoned (triggers abandoned cart automation)

---

## Data Types

### Phone Numbers

- **Format:** E.164 format
- **Example:** `+306977123456`
- **Validation:** Must start with `+` followed by country code and number

### Dates

- **Format:** ISO 8601
- **Example:** `2024-01-15T10:00:00.000Z`
- **Timezone:** UTC

### Currency

- **Format:** ISO 4217 codes
- **Examples:** `EUR`, `USD`, `GBP`

### Timezones

- **Format:** IANA timezone database
- **Examples:** `Europe/Athens`, `America/New_York`, `UTC`

---

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'https://sendly-marketing-backend.onrender.com';
const SHOP_DOMAIN = 'your-store.myshopify.com';

// Create contact
async function createContact(contactData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/contacts`,
      contactData,
      {
        headers: {
          'X-Shopify-Shop-Domain': SHOP_DOMAIN,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error.response?.data);
    throw error;
  }
}

// Create and send campaign
async function createAndSendCampaign(campaignData) {
  try {
    // Create campaign
    const createResponse = await axios.post(
      `${BASE_URL}/campaigns`,
      campaignData,
      {
        headers: {
          'X-Shopify-Shop-Domain': SHOP_DOMAIN,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const campaignId = createResponse.data.data.id;
    
    // Send campaign
    const sendResponse = await axios.post(
      `${BASE_URL}/campaigns/${campaignId}/send`,
      {},
      {
        headers: {
          'X-Shopify-Shop-Domain': SHOP_DOMAIN
        }
      }
    );
    
    return sendResponse.data;
  } catch (error) {
    console.error('Error creating/sending campaign:', error.response?.data);
    throw error;
  }
}

// Usage
createContact({
  firstName: 'John',
  lastName: 'Doe',
  phoneE164: '+306977123456',
  email: 'john@example.com',
  smsConsent: 'opted_in'
}).then(contact => {
  console.log('Contact created:', contact);
});

createAndSendCampaign({
  name: 'Welcome Campaign',
  message: 'Welcome to our store! Get 10% off with code WELCOME10',
  audience: 'all',
  scheduleType: 'immediate'
}).then(result => {
  console.log('Campaign sent:', result);
});
```

### Python

```python
import requests

BASE_URL = 'https://sendly-marketing-backend.onrender.com'
SHOP_DOMAIN = 'your-store.myshopify.com'

headers = {
    'X-Shopify-Shop-Domain': SHOP_DOMAIN,
    'Content-Type': 'application/json'
}

# Create contact
def create_contact(contact_data):
    response = requests.post(
        f'{BASE_URL}/contacts',
        json=contact_data,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Get contacts
def get_contacts(page=1, page_size=20):
    params = {'page': page, 'pageSize': page_size}
    response = requests.get(
        f'{BASE_URL}/contacts',
        params=params,
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# Usage
contact = create_contact({
    'firstName': 'John',
    'lastName': 'Doe',
    'phoneE164': '+306977123456',
    'email': 'john@example.com',
    'smsConsent': 'opted_in'
})
print('Contact created:', contact)

contacts = get_contacts()
print('Contacts:', contacts)
```

### cURL Examples

**Create Contact:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/contacts" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306977123456",
    "email": "john@example.com",
    "smsConsent": "opted_in"
  }'
```

**Create Campaign:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/campaigns" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale",
    "message": "Get 20% off on summer items!",
    "audience": "all",
    "scheduleType": "immediate"
  }'
```

**Send Campaign:**
```bash
curl -X POST "https://sendly-marketing-backend.onrender.com/campaigns/campaign-123/send" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com"
```

---

## Best Practices

### 1. Always Include Store Domain

Always include the `X-Shopify-Shop-Domain` header in store-scoped requests:

```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

### 2. Handle Errors Gracefully

Always check for errors in responses:

```javascript
if (!response.data.success) {
  console.error('API Error:', response.data.error, response.data.message);
  // Handle error
}
```

### 3. Use Pagination

For list endpoints, use pagination to avoid loading too much data:

```javascript
let page = 1;
let allContacts = [];

while (true) {
  const response = await getContacts(page, 100);
  allContacts.push(...response.data.data.items);
  
  if (!response.data.data.pagination.hasNextPage) break;
  page++;
}
```

### 4. Validate Input

Validate data before sending requests:

```javascript
function validatePhone(phone) {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

if (!validatePhone(contact.phoneE164)) {
  throw new Error('Invalid phone number format');
}
```

### 5. Handle Rate Limits

Implement retry logic with exponential backoff:

```javascript
async function requestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, options);
      return response;
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const retryAfter = error.response.headers['retry-after'] || Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

---

## Support

For issues, questions, or feature requests:

- **Documentation:** [API Documentation](https://sendly-marketing-backend.onrender.com/docs/api)
- **Health Check:** `GET /health/full`
- **Metrics:** `GET /metrics`

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**API Version:** 1.0.0

