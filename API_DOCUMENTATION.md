# Sendly Marketing Backend - Complete API Documentation

**Version:** 1.0.0  
**Base URL:** `https://sendly-marketing-backend.onrender.com`  
**API Version:** `v1` (default)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Request/Response Format](#requestresponse-format)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Caching](#caching)
7. [API Endpoints](#api-endpoints)
8. [Webhooks](#webhooks)
9. [Code Examples](#code-examples)

---

## 🏗️ Architecture Overview

### Multi-Tenant Architecture

Sendly Backend implements a **complete multi-tenant architecture** where each Shopify store operates as an isolated tenant with:

- **Complete Data Isolation:** All data is scoped to a specific store via `shopId`
- **Store Resolution:** Automatic store detection from request headers
- **Shared Infrastructure:** Single codebase serves all tenants
- **Security:** Database-level filtering ensures no cross-tenant data access

### Request Flow

```
┌─────────────────┐
│   Client        │
│   Request       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Security Middleware                                  │
│    - Helmet (Security headers)                          │
│    - CORS (Cross-origin)                                │
│    - HPP (HTTP Parameter Pollution)                     │
│    - Compression                                        │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Request Processing                                   │
│    - Request ID generation                              │
│    - Performance monitoring                             │
│    - Security monitoring                                │
│    - Metrics collection                                 │
│    - Request sanitization                                │
│    - Content-Type validation                            │
│    - Request size validation                            │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 3. API Versioning                                       │
│    - Version detection (header/query)                  │
│    - Backward compatibility                             │
│    - Versioned responses                                │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Body Parsing                                         │
│    - JSON parsing                                      │
│    - URL-encoded parsing                                │
│    - Raw body storage (for webhooks)                    │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Store Resolution (for store-scoped routes)          │
│    - Extract shop domain from headers/query/body        │
│    - Query database for store record                    │
│    - Attach store context to request (req.ctx.store)    │
│    - Validate store exists and is active                │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Route-Specific Middleware                            │
│    - Rate limiting                                      │
│    - Input validation (Zod schemas)                     │
│    - Caching (Redis)                                    │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Controller                                           │
│    - Business logic                                     │
│    - Service layer calls                                │
│    - Response formatting                                │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ 8. Error Handling                                       │
│    - Global error handler                               │
│    - Error logging                                      │
│    - Standardized error responses                       │
└─────────────────────────────────────────────────────────┘
```

### Middleware Stack

The application uses a layered middleware approach:

#### 1. **Security Layer**
- `helmet` - Security headers (CSP, XSS protection, etc.)
- `cors` - Cross-origin resource sharing
- `hpp` - HTTP Parameter Pollution protection
- `compression` - Response compression

#### 2. **Request Processing Layer**
- `requestId` - Unique request ID generation
- `performanceMonitor` - Request timing
- `securityMonitor` - Security event logging
- `metricsMiddleware` - Prometheus metrics
- `sanitizeRequest` - Input sanitization
- `validateContentType` - Content-Type validation
- `validateRequestSize` - Request size limits (5MB)

#### 3. **API Versioning Layer**
- `apiVersioning` - Version detection
- `backwardCompatibility` - Legacy version support
- `versionedResponse` - Version-specific responses

#### 4. **Store Resolution Layer**
- `resolveStore` - Extract and validate store context
- `requireStore` - Enforce store context requirement

#### 5. **Route-Specific Layer**
- `rateLimits` - Per-route rate limiting
- `validation` - Zod schema validation
- `cache` - Redis caching middleware

### Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis Cloud (TLS required)
- **Queue:** BullMQ for background jobs
- **SMS Provider:** Mitto API
- **Payments:** Stripe
- **Validation:** Zod schemas
- **Logging:** Winston with structured logging

### Data Flow

```
Request → Middleware Stack → Store Resolution → Route Handler
                                                      │
                                                      ▼
                                              Service Layer
                                                      │
                                                      ▼
                                              Database/External APIs
                                                      │
                                                      ▼
                                              Response Formatter
                                                      │
                                                      ▼
                                              Client Response
```

---

## 🔐 Authentication & Authorization

### Store Context Resolution

All store-scoped endpoints require store context, which is resolved automatically from:

1. **Headers (Primary):**
   ```
   X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com
   X-Shopify-Shop: sms-blossom-dev.myshopify.com
   X-Shopify-Shop-Name: sms-blossom-dev
   ```

2. **Query Parameters:**
   ```
   ?shop=sms-blossom-dev.myshopify.com
   ?shop_domain=sms-blossom-dev.myshopify.com
   ```

3. **Request Body:**
   ```json
   {
     "shop": "sms-blossom-dev.myshopify.com",
     "shop_domain": "sms-blossom-dev.myshopify.com"
   }
   ```

4. **URL Path (Embedded Apps):**
   ```
   /store/{shop-domain}/apps/{app-name}/app
   ```

### Store Context Object

Once resolved, store context is attached to `req.ctx.store`:

```javascript
{
  id: "cmhrigaa300080arcrw5r4fia",        // Database ID
  shopDomain: "sms-blossom-dev.myshopify.com",
  credits: 1000,                          // Available SMS credits
  currency: "EUR",                         // Store currency
  timezone: "Europe/Athens",              // Store timezone
  senderNumber: "Sendly",                  // SMS sender ID
  senderName: "Sendly",                   // SMS sender name
  settings: { /* store settings */ },
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
}
```

### Shopify API Authentication

For Shopify API calls (discounts, products, etc.), the system uses:

1. **Access Token:** Stored in database (`Shop.accessToken`)
2. **Session Creation:** Automatic session creation from database
3. **Token Validation:** Validates token exists and is not "pending"

**Setup Required:**
```bash
# Add to .env
SHOPIFY_ACCESS_TOKEN=shpat_your_full_token_here

# Run setup script
npm run setup:shop
```

### Webhook Authentication

Webhooks use signature verification:

- **Stripe Webhooks:** HMAC signature verification
- **Mitto Webhooks:** Signature validation
- **Automation Webhooks:** Custom signature validation

---

## 📨 Request/Response Format

### Request Headers

**Required for Store-Scoped Endpoints:**
```
X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com
Content-Type: application/json
```

**Optional Headers:**
```
API-Version: v1
X-Request-ID: custom-request-id
X-Client-Version: 1.0.0
X-Client-Platform: web
```

### Request Body

All POST/PUT/PATCH requests must have:
- `Content-Type: application/json`
- Valid JSON body (if body is required)

**Example:**
```json
{
  "name": "Black Friday Sale",
  "message": "Get 50% off!",
  "audience": "all"
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-11-10T23:00:00.000Z",
  "requestId": "req_1234567890"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-11-10T23:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2025-11-10T23:00:00.000Z",
  "path": "/contacts",
  "method": "POST",
  "requestId": "req_1234567890"
}
```

### HTTP Status Codes

- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Validation error, invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity` - Business logic error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## ⚠️ Error Handling

### Error Types

1. **ValidationError** (400)
   - Invalid input data
   - Schema validation failures

2. **NotFoundError** (404)
   - Resource not found
   - Store not found

3. **UnauthorizedError** (401)
   - Missing authentication
   - Invalid credentials

4. **ForbiddenError** (403)
   - Insufficient permissions
   - Access denied

5. **ConflictError** (409)
   - Duplicate resources
   - Resource conflicts

6. **InsufficientCreditsError** (422)
   - Not enough SMS credits
   - Credit validation failed

7. **AppError** (500)
   - Internal server errors
   - Unexpected errors

### Error Response Structure

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "field_name",
      "message": "Field-specific error"
    }
  ],
  "timestamp": "2025-11-10T23:00:00.000Z",
  "path": "/api/v1/endpoint",
  "method": "POST",
  "requestId": "req_1234567890",
  "apiVersion": "v1"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `validation_error` | Input validation failed |
| `not_found` | Resource not found |
| `unauthorized` | Authentication required |
| `forbidden` | Access denied |
| `conflict` | Resource conflict |
| `insufficient_credits` | Not enough credits |
| `app_error` | Internal server error |
| `invalid_content_type` | Content-Type must be application/json |
| `rate_limit_exceeded` | Too many requests |
| `store_not_found` | Store context not found |

---

## 🚦 Rate Limiting

### Rate Limit Strategy

Rate limiting is implemented per-route using sliding window algorithm:

- **Window:** 15 minutes (900 seconds)
- **Limit:** Varies by endpoint (see below)
- **Storage:** Redis
- **Headers:** Rate limit info in response headers

### Rate Limit Headers

```
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: 1636560000
```

### Endpoint-Specific Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Campaign Send | 10 requests | 15 minutes |
| Contact Import | 5 requests | 15 minutes |
| Billing Purchase | 20 requests | 15 minutes |

### Rate Limit Response

```json
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 300,
  "timestamp": "2025-11-10T23:00:00.000Z"
}
```

---

## 💾 Caching

### Caching Strategy

- **Storage:** Redis Cloud
- **Strategy:** Cache-aside pattern
- **TTL:** Varies by endpoint (see below)
- **Invalidation:** Automatic on mutations

### Cached Endpoints

| Endpoint | TTL | Invalidation |
|----------|-----|--------------|
| Campaign List | 60s | On create/update/delete |
| Campaign Metrics | 300s | On send/update |
| Contact List | 60s | On create/update/delete |
| Contact Stats | 300s | On create/update/delete |
| Dashboard Overview | 30s | On any mutation |
| Templates List | 3600s | On admin template update |

### Cache Headers

```
Cache-Control: public, max-age=60
X-Cache: HIT
X-Cache-Key: campaigns:list:store_123:page_1
```

---

## 📡 API Endpoints

### Base URL

```
Production: https://sendly-marketing-backend.onrender.com
Development: http://localhost:3000
```

### API Versioning

API version is specified via:
- **Header:** `API-Version: v1`
- **Query:** `?api_version=v1`
- **Default:** `v1` if not specified

---

## 🔧 Core Endpoints

### Health & Status

#### `GET /`
Get API status and basic information.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Sendly Marketing Backend",
    "version": "1.0.0",
    "status": "operational",
    "timestamp": "2025-11-10T23:00:00.000Z"
  }
}
```

#### `GET /health`
Basic health check.

**Response:**
```json
{
  "status": "ok"
}
```

#### `GET /health/config`
Configuration health check.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "shopify": "configured"
  }
}
```

#### `GET /health/full`
Comprehensive health check with diagnostics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T23:00:00.000Z",
  "services": {
    "database": {
      "status": "healthy",
      "latency": "15ms"
    },
    "redis": {
      "status": "healthy",
      "latency": "5ms"
    },
    "shopify": {
      "status": "configured",
      "apiVersion": "2024-04"
    }
  },
  "uptime": 3600,
  "memory": {
    "used": "150MB",
    "total": "512MB"
  }
}
```

#### `GET /metrics`
Application metrics (Prometheus format).

**Query Parameters:**
- `format` (optional): `json` or `prometheus` (default: `prometheus`)

**Response (JSON):**
```json
{
  "requests": {
    "total": 1000,
    "success": 950,
    "errors": 50
  },
  "responseTime": {
    "avg": "120ms",
    "p95": "250ms",
    "p99": "500ms"
  }
}
```

---

## 🏠 Dashboard

### `GET /dashboard/overview`

Get comprehensive dashboard data.

**Headers:**
```
X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalContacts": 1250,
      "totalCampaigns": 45,
      "totalSent": 12500,
      "totalCredits": 1000
    },
    "recentActivity": [
      {
        "type": "campaign_sent",
        "message": "Black Friday campaign sent",
        "timestamp": "2025-11-10T22:00:00Z"
      }
    ],
    "walletBalance": 1000
  }
}
```

**Cache:** 30 seconds

### `GET /dashboard/quick-stats`

Get quick statistics for dashboard widgets.

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": 1250,
    "campaigns": 45,
    "sentToday": 150,
    "credits": 1000
  }
}
```

**Cache:** 30 seconds

---

## 👥 Contacts

### `GET /contacts`

List contacts with filtering, search, and pagination.

**Query Parameters:**
- `page` (default: 1) - Page number
- `pageSize` (default: 20, max: 100) - Items per page
- `filter` (optional) - Filter by consent: `all`, `consented`, `nonconsented`
- `q` (optional) - Search in name, email, phone
- `gender` (optional) - Filter by gender: `male`, `female`, `other`
- `smsConsent` (optional) - Filter by SMS consent: `opted_in`, `opted_out`, `unknown`
- `hasBirthDate` (optional) - Filter by birthday: `true`, `false`

**Example:**
```
GET /contacts?page=1&pageSize=20&filter=consented&q=john
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contact_123",
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+306984303406",
      "email": "john@example.com",
      "gender": "male",
      "smsConsent": "opted_in",
      "tags": ["vip"],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1250,
    "totalPages": 63
  }
}
```

**Cache:** 60 seconds

### `POST /contacts`

Create a new contact.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneE164": "+306984303406",
  "email": "john@example.com",
  "gender": "male",
  "birthDate": "1990-01-01T00:00:00.000Z",
  "smsConsent": "opted_in",
  "tags": ["vip", "newsletter"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306984303406",
    "email": "john@example.com",
    "smsConsent": "opted_in",
    "createdAt": "2025-11-10T23:00:00Z"
  },
  "message": "Contact created successfully"
}
```

**Validation:**
- `phoneE164`: Required, valid E.164 format
- `smsConsent`: Required, one of: `opted_in`, `opted_out`, `unknown`
- `email`: Optional, valid email format
- `firstName`, `lastName`: Optional, max 50 characters
- `gender`: Optional, one of: `male`, `female`, `other`
- `tags`: Optional, array of strings (max 10 tags)

### `GET /contacts/:id`

Get a specific contact by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306984303406",
    "email": "john@example.com",
    "gender": "male",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "smsConsent": "opted_in",
    "tags": ["vip"],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-11-10T23:00:00Z"
  }
}
```

### `PUT /contacts/:id`

Update an existing contact.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "smsConsent": "opted_out"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "firstName": "Jane",
    "lastName": "Smith",
    "smsConsent": "opted_out",
    "updatedAt": "2025-11-10T23:00:00Z"
  },
  "message": "Contact updated successfully"
}
```

### `DELETE /contacts/:id`

Delete a contact.

**Response:**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

### `GET /contacts/stats`

Get contact statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "optedIn": 1000,
    "optedOut": 200,
    "unknown": 50,
    "withBirthDate": 800,
    "byGender": {
      "male": 600,
      "female": 500,
      "other": 150
    }
  }
}
```

**Cache:** 300 seconds

### `GET /contacts/birthdays`

Get contacts with upcoming birthdays.

**Query Parameters:**
- `daysAhead` (default: 7, max: 365) - Number of days to look ahead

**Example:**
```
GET /contacts/birthdays?daysAhead=30
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contact_123",
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+306984303406",
      "birthDate": "1990-11-15T00:00:00.000Z",
      "daysUntilBirthday": 5
    }
  ]
}
```

### `POST /contacts/import`

Import multiple contacts from CSV data.

**Request Body:**
```json
{
  "contacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+306984303406",
      "email": "john@example.com",
      "smsConsent": "opted_in"
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "phoneE164": "+306979623266",
      "email": "jane@example.com",
      "smsConsent": "opted_in"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 2,
    "skipped": 0,
    "errors": []
  },
  "message": "Contacts imported successfully"
}
```

**Rate Limit:** 5 requests per 15 minutes

---

## 📢 Campaigns

### `GET /campaigns`

List campaigns with filtering and pagination.

**Query Parameters:**
- `page` (default: 1) - Page number
- `pageSize` (default: 20) - Items per page
- `status` (optional) - Filter by status: `draft`, `scheduled`, `sending`, `sent`, `failed`, `cancelled`
- `sortBy` (default: `createdAt`) - Sort field: `createdAt`, `updatedAt`, `name`, `scheduleAt`
- `sortOrder` (default: `desc`) - Sort direction: `asc`, `desc`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "campaign_123",
      "name": "Black Friday Sale",
      "message": "Get 50% off everything!",
      "audience": "all",
      "status": "sent",
      "scheduleType": "immediate",
      "createdAt": "2025-11-10T20:00:00Z",
      "sentAt": "2025-11-10T20:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Cache:** 60 seconds

### `POST /campaigns`

Create a new campaign.

**Request Body:**
```json
{
  "name": "Black Friday Sale",
  "message": "Get 50% off everything! Use code BLACKFRIDAY",
  "audience": "all",
  "discountId": null,
  "scheduleType": "immediate"
}
```

**Request Body (Scheduled):**
```json
{
  "name": "Holiday Sale",
  "message": "Happy Holidays! Special offer inside.",
  "audience": "all",
  "scheduleType": "scheduled",
  "scheduleAt": "2025-12-01T10:00:00Z"
}
```

**Validation:**
- `name`: Required, 1-200 characters
- `message`: Required, 1-1600 characters
- `audience`: Optional, default `all`. Values: `all`, `male`, `female`, `men`, `women`, `segment:{id}`
- `discountId`: Optional, can be `null`
- `scheduleType`: Optional, default `immediate`. Values: `immediate`, `scheduled`, `recurring`
- `scheduleAt`: Required if `scheduleType` is `scheduled`, must be future date
- `recurringDays`: Required if `scheduleType` is `recurring`, 1-365 days

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Black Friday Sale",
    "message": "Get 50% off everything!",
    "audience": "all",
    "status": "draft",
    "scheduleType": "immediate",
    "shopId": "cmhrigaa300080arcrw5r4fia",
    "createdAt": "2025-11-10T23:00:00Z"
  },
  "message": "Campaign created successfully"
}
```

### `GET /campaigns/:id`

Get a specific campaign by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Black Friday Sale",
    "message": "Get 50% off everything!",
    "audience": "all",
    "status": "sent",
    "scheduleType": "immediate",
    "metrics": {
      "sent": 1000,
      "delivered": 950,
      "failed": 50
    },
    "createdAt": "2025-11-10T20:00:00Z"
  }
}
```

### `PUT /campaigns/:id`

Update an existing campaign.

**Request Body:**
```json
{
  "name": "Updated Campaign Name",
  "message": "Updated message content",
  "audience": "male"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Updated Campaign Name",
    "message": "Updated message content",
    "updatedAt": "2025-11-10T23:00:00Z"
  },
  "message": "Campaign updated successfully"
}
```

### `DELETE /campaigns/:id`

Delete a campaign.

**Response:**
```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

### `POST /campaigns/:id/prepare`

Validate campaign and calculate recipient count without sending.

**Response:**
```json
{
  "success": true,
  "data": {
    "recipientCount": 1000,
    "estimatedCost": 100,
    "creditsRequired": 100,
    "creditsAvailable": 1000,
    "canSend": true
  },
  "message": "Campaign prepared successfully"
}
```

### `POST /campaigns/:id/send`

Send campaign immediately. Validates credits and queues messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "status": "sending",
    "recipientCount": 1000,
    "queuedAt": "2025-11-10T23:00:00Z"
  },
  "message": "Campaign queued for sending"
}
```

**Rate Limit:** 10 requests per 15 minutes

### `PUT /campaigns/:id/schedule`

Schedule campaign for later sending.

**Request Body:**
```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2025-12-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "scheduleType": "scheduled",
    "scheduleAt": "2025-12-01T10:00:00Z",
    "status": "scheduled"
  },
  "message": "Campaign scheduled successfully"
}
```

### `GET /campaigns/:id/metrics`

Get campaign performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 1000,
    "delivered": 950,
    "failed": 50,
    "deliveryRate": 95.0,
    "failureRate": 5.0,
    "cost": 100,
    "sentAt": "2025-11-10T20:05:00Z",
    "completedAt": "2025-11-10T20:10:00Z"
  }
}
```

**Cache:** 300 seconds

### `GET /campaigns/stats/summary`

Get overall campaign statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "byStatus": {
      "draft": 5,
      "scheduled": 10,
      "sending": 2,
      "sent": 25,
      "failed": 3
    },
    "totalSent": 12500,
    "totalDelivered": 11875,
    "deliveryRate": 95.0
  }
}
```

**Cache:** 60 seconds

### `POST /campaigns/:id/retry-failed`

Retry failed SMS messages for a campaign.

**Response:**
```json
{
  "success": true,
  "data": {
    "retried": 50,
    "queued": 50
  },
  "message": "Failed messages queued for retry"
}
```

---

## 🤖 Automations

### `GET /automations`

Get list of all automations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "automation_welcome",
      "name": "Welcome Message",
      "trigger": "customer_created",
      "message": "Welcome to our store!",
      "isActive": true
    },
    {
      "id": "automation_birthday",
      "name": "Birthday Wishes",
      "trigger": "birthday",
      "message": "Happy Birthday!",
      "isActive": true
    }
  ]
}
```

### `GET /automations/stats`

Get automation statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "active": 2,
    "inactive": 1,
    "totalSent": 500,
    "byTrigger": {
      "customer_created": 200,
      "birthday": 150,
      "abandoned_cart": 150
    }
  }
}
```

### `PUT /automations/:id`

Update an existing automation.

**Request Body:**
```json
{
  "name": "Updated Birthday Wishes",
  "message": "Happy Birthday! Here's a special gift for you!",
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "automation_birthday",
    "name": "Updated Birthday Wishes",
    "isActive": false,
    "updatedAt": "2025-11-10T23:00:00Z"
  },
  "message": "Automation updated successfully"
}
```

### `GET /automations/defaults`

Get system default automations.

**Response:**
```json
{
  "success": true,
  "data": {
    "welcome": {
      "name": "Welcome Message",
      "message": "Welcome to our store!",
      "isActive": true
    },
    "birthday": {
      "name": "Birthday Wishes",
      "message": "Happy Birthday!",
      "isActive": true
    }
  }
}
```

### `POST /automations/sync`

Sync system default automations.

**Response:**
```json
{
  "success": true,
  "message": "Automations synced successfully"
}
```

---

## 📄 Templates

### `GET /templates`

Get list of public templates with filtering.

**Query Parameters:**
- `category` (optional) - Filter by category
- `search` (optional) - Search in title and content
- `page` (default: 1) - Page number
- `pageSize` (default: 20) - Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "template_123",
      "title": "Welcome Message",
      "category": "welcome",
      "content": "Welcome to our store! Get 10% off with code WELCOME10",
      "tags": ["welcome", "discount"]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 50
  }
}
```

### `GET /templates/categories`

Get all template categories.

**Response:**
```json
{
  "success": true,
  "data": [
    "welcome",
    "promotional",
    "abandoned-cart",
    "birthday",
    "order-confirmation"
  ]
}
```

### `GET /templates/:id`

Get a specific template by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_123",
    "title": "Welcome Message",
    "category": "welcome",
    "content": "Welcome to our store!",
    "tags": ["welcome"],
    "usageCount": 150
  }
}
```

### `POST /templates/:id/track`

Track template usage for analytics.

**Response:**
```json
{
  "success": true,
  "message": "Template usage tracked"
}
```

---

## 📊 Reports

### `GET /reports/kpis`

Get key performance indicators.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalContacts": 1250,
    "totalCampaigns": 45,
    "totalSent": 12500,
    "deliveryRate": 95.0,
    "averageCost": 0.10,
    "totalSpent": 1250
  }
}
```

### `GET /reports/overview`

Get reports overview.

**Query Parameters:**
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    },
    "campaigns": {
      "total": 10,
      "sent": 8,
      "scheduled": 2
    },
    "messaging": {
      "sent": 5000,
      "delivered": 4750,
      "failed": 250
    }
  }
}
```

### `GET /reports/campaigns`

Get campaign performance reports.

**Query Parameters:**
- `startDate` (required) - Start date (YYYY-MM-DD)
- `endDate` (required) - End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    },
    "campaigns": [
      {
        "id": "campaign_123",
        "name": "Black Friday Sale",
        "sent": 1000,
        "delivered": 950,
        "deliveryRate": 95.0
      }
    ],
    "summary": {
      "totalSent": 5000,
      "totalDelivered": 4750,
      "averageDeliveryRate": 95.0
    }
  }
}
```

### `GET /reports/campaigns/:id`

Get specific campaign report.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "campaign_123",
      "name": "Black Friday Sale"
    },
    "metrics": {
      "sent": 1000,
      "delivered": 950,
      "failed": 50
    },
    "timeline": [
      {
        "date": "2025-11-10",
        "sent": 1000,
        "delivered": 950
      }
    ]
  }
}
```

### `GET /reports/automations`

Get automations report.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "active": 2,
    "totalSent": 500,
    "byTrigger": {
      "customer_created": 200,
      "birthday": 150,
      "abandoned_cart": 150
    }
  }
}
```

### `GET /reports/messaging`

Get messaging report.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSent": 12500,
    "totalDelivered": 11875,
    "totalFailed": 625,
    "deliveryRate": 95.0,
    "byDay": [
      {
        "date": "2025-11-10",
        "sent": 500,
        "delivered": 475
      }
    ]
  }
}
```

### `GET /reports/credits`

Get credits report.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentBalance": 1000,
    "totalPurchased": 5000,
    "totalUsed": 4000,
    "transactions": [
      {
        "type": "purchase",
        "amount": 1000,
        "date": "2025-11-01T00:00:00Z"
      }
    ]
  }
}
```

### `GET /reports/contacts`

Get contacts report.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "optedIn": 1000,
    "optedOut": 200,
    "unknown": 50,
    "growth": {
      "thisMonth": 100,
      "lastMonth": 80
    }
  }
}
```

### `GET /reports/export`

Export reports in various formats.

**Query Parameters:**
- `type` (required) - Report type: `campaigns`, `contacts`, `automations`, `messaging`, `credits`
- `format` (required) - Export format: `csv`, `json`, `xlsx`
- `startDate` (required) - Start date
- `endDate` (required) - End date

**Response:** File download (CSV/JSON/XLSX)

---

## 💳 Billing & Settings

### `GET /billing/balance`

Get current credit balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1000,
    "currency": "EUR"
  }
}
```

### `GET /billing/packages`

Get available credit packages.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "package_1000",
      "name": "1000 Credits",
      "credits": 1000,
      "price": 100,
      "currency": "EUR"
    },
    {
      "id": "package_5000",
      "name": "5000 Credits",
      "credits": 5000,
      "price": 450,
      "currency": "EUR"
    }
  ]
}
```

### `POST /billing/purchase`

Create Stripe checkout session for credit purchase.

**Request Body:**
```json
{
  "packageId": "package_1000",
  "successUrl": "https://your-frontend.com/success",
  "cancelUrl": "https://your-frontend.com/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_123",
    "url": "https://checkout.stripe.com/pay/cs_test_123"
  }
}
```

### `GET /billing/history`

Get transaction history.

**Query Parameters:**
- `page` (default: 1) - Page number
- `pageSize` (default: 20) - Items per page
- `type` (optional) - Filter by type: `purchase`, `debit`, `credit`, `refund`, `adjustment`
- `startDate` (optional) - Start date filter
- `endDate` (optional) - End date filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction_123",
      "type": "purchase",
      "amount": 1000,
      "credits": 1000,
      "status": "completed",
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 50
  }
}
```

### `GET /billing/billing-history`

Get billing history (Stripe transactions).

**Query Parameters:**
- `page` (default: 1) - Page number
- `pageSize` (default: 20) - Items per page
- `status` (optional) - Filter by status: `pending`, `completed`, `failed`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "billing_123",
      "stripeSessionId": "cs_test_123",
      "amount": 100,
      "currency": "EUR",
      "status": "completed",
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 10
  }
}
```

### `GET /settings`

Get shop settings and configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "currency": "EUR",
    "timezone": "Europe/Athens",
    "senderNumber": "Sendly",
    "senderName": "Sendly",
    "notifications": {
      "email": true,
      "sms": false
    }
  }
}
```

### `GET /settings/account`

Get account information.

**Response:**
```json
{
  "success": true,
  "data": {
    "shopDomain": "sms-blossom-dev.myshopify.com",
    "credits": 1000,
    "currency": "EUR",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### `PUT /settings/sender`

Update sender number and name.

**Request Body:**
```json
{
  "senderNumber": "Sendly",
  "senderName": "Sendly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "senderNumber": "Sendly",
    "senderName": "Sendly",
    "updatedAt": "2025-11-10T23:00:00Z"
  },
  "message": "Sender settings updated successfully"
}
```

---

## 🔍 Tracking

### `GET /tracking/mitto/:messageId`

Get delivery status for a specific Mitto message.

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "mitto-msg-123",
    "status": "delivered",
    "deliveredAt": "2025-11-10T20:05:00Z",
    "phoneE164": "+306984303406"
  }
}
```

### `GET /tracking/campaign/:campaignId`

Get delivery status for all messages in a campaign.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "total": 1000,
    "delivered": 950,
    "failed": 50,
    "pending": 0,
    "messages": [
      {
        "messageId": "mitto-msg-123",
        "phoneE164": "+306984303406",
        "status": "delivered",
        "deliveredAt": "2025-11-10T20:05:00Z"
      }
    ]
  }
}
```

### `POST /tracking/bulk-update`

Bulk update delivery status for multiple messages.

**Request Body:**
```json
{
  "messageIds": ["mitto-msg-123", "mitto-msg-456"],
  "status": "delivered"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 2
  },
  "message": "Delivery status updated"
}
```

---

## 🎟️ Discounts

### `GET /discounts`

Get available Shopify discount codes.

**Response:**
```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "id": "discount_123",
        "title": "Summer Sale",
        "code": "SUMMER20",
        "status": "ACTIVE",
        "isActive": true,
        "isExpired": false
      }
    ],
    "total": 10,
    "active": 8
  }
}
```

### `GET /discounts/:id`

Get specific discount code.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "discount_123",
    "title": "Summer Sale",
    "code": "SUMMER20",
    "status": "ACTIVE",
    "isActive": true,
    "isExpired": false,
    "value": 20,
    "valueType": "percentage"
  }
}
```

### `GET /discounts/validate/:code`

Validate discount code for campaign use.

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "SUMMER20",
    "isValid": true,
    "canUse": true,
    "discount": {
      "id": "discount_123",
      "title": "Summer Sale",
      "status": "ACTIVE"
    }
  }
}
```

---

## 👥 Audiences

### `GET /audiences`

Get predefined audiences.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "all",
      "name": "All Contacts",
      "description": "All opted-in contacts",
      "count": 1000
    },
    {
      "id": "male",
      "name": "Male Contacts",
      "description": "All male opted-in contacts",
      "count": 600
    },
    {
      "id": "female",
      "name": "Female Contacts",
      "description": "All female opted-in contacts",
      "count": 400
    }
  ]
}
```

### `GET /audiences/:id/details`

Get audience details with contact list.

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "audience": {
      "id": "all",
      "name": "All Contacts",
      "totalCount": 1000
    },
    "contacts": [
      {
        "id": "contact_123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+306984303406"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1000
    }
  }
}
```

### `POST /audiences/validate`

Validate audience selection.

**Request Body:**
```json
{
  "audienceId": "all"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "audienceId": "all",
    "isValid": true,
    "recipientCount": 1000
  }
}
```

---

## 🛍️ Shopify Integration

### `GET /shopify/discounts`

Get available Shopify discount codes.

**Response:** Same as `/discounts`

### `GET /shopify/discounts/:id`

Get specific Shopify discount code.

**Response:** Same as `/discounts/:id`

### `POST /shopify/discounts/validate`

Validate Shopify discount code for campaign use.

**Request Body:**
```json
{
  "discountId": "discount_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "discount": {
      "id": "discount_123",
      "title": "Summer Sale",
      "code": "SUMMER20",
      "status": "ACTIVE"
    },
    "isValid": true,
    "canUse": true
  }
}
```

---

## 🔧 Admin Templates

### `GET /admin/templates`

Get all templates (admin view).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "template_123",
      "title": "Welcome Message",
      "category": "welcome",
      "content": "Welcome to our store!",
      "usageCount": 150,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### `POST /admin/templates`

Create a new template (admin only).

**Request Body:**
```json
{
  "title": "Welcome Message",
  "category": "welcome",
  "content": "Welcome to our store! Get 10% off your first order with code WELCOME10",
  "previewImage": null,
  "tags": ["welcome", "discount"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_123",
    "title": "Welcome Message",
    "category": "welcome",
    "content": "Welcome to our store!",
    "createdAt": "2025-11-10T23:00:00Z"
  },
  "message": "Template created successfully"
}
```

### `GET /admin/templates/:id/stats`

Get template usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "templateId": "template_123",
    "usageCount": 150,
    "lastUsed": "2025-11-10T20:00:00Z",
    "byStore": [
      {
        "storeId": "store_123",
        "usageCount": 100
      }
    ]
  }
}
```

### `PUT /admin/templates/:id`

Update a template (admin only).

**Request Body:**
```json
{
  "title": "Updated Welcome Message",
  "content": "Updated content here",
  "tags": ["welcome", "updated"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_123",
    "title": "Updated Welcome Message",
    "updatedAt": "2025-11-10T23:00:00Z"
  },
  "message": "Template updated successfully"
}
```

### `DELETE /admin/templates/:id`

Delete a template (admin only).

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

---

## 🔔 Webhooks

### Stripe Webhooks

**Endpoint:** `POST /webhooks/stripe`

**Authentication:** HMAC signature verification

**Events:**
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment confirmed

### Mitto Webhooks

**Endpoint:** `POST /webhooks/mitto`

**Authentication:** Signature validation

**Events:**
- Message delivery status updates
- Delivery confirmations

### Automation Webhooks

**Endpoint:** `POST /automation-webhooks`

**Authentication:** Custom signature validation

**Events:**
- `customer.created` - Trigger welcome message
- `order.created` - Trigger order confirmation
- `cart.abandoned` - Trigger abandoned cart message

---

## 💻 Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const baseURL = 'https://sendly-marketing-backend.onrender.com';
const shopDomain = 'sms-blossom-dev.myshopify.com';

// Create a campaign
async function createCampaign() {
  try {
    const response = await axios.post(
      `${baseURL}/campaigns`,
      {
        name: 'Black Friday Sale',
        message: 'Get 50% off everything!',
        audience: 'all',
        scheduleType: 'immediate'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shopDomain
        }
      }
    );
    
    console.log('Campaign created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}

// Get contacts
async function getContacts(page = 1) {
  try {
    const response = await axios.get(
      `${baseURL}/contacts?page=${page}&pageSize=20`,
      {
        headers: {
          'X-Shopify-Shop-Domain': shopDomain
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}

// Send a campaign
async function sendCampaign(campaignId) {
  try {
    const response = await axios.post(
      `${baseURL}/campaigns/${campaignId}/send`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shopDomain
        }
      }
    );
    
    console.log('Campaign sent:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

### cURL

```bash
# Create a campaign
curl -X POST https://sendly-marketing-backend.onrender.com/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com" \
  -d '{
    "name": "Black Friday Sale",
    "message": "Get 50% off everything!",
    "audience": "all",
    "scheduleType": "immediate"
  }'

# Get contacts
curl -X GET "https://sendly-marketing-backend.onrender.com/contacts?page=1&pageSize=20" \
  -H "X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com"

# Send campaign
curl -X POST https://sendly-marketing-backend.onrender.com/campaigns/campaign_123/send \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com"
```

### Python

```python
import requests

BASE_URL = 'https://sendly-marketing-backend.onrender.com'
SHOP_DOMAIN = 'sms-blossom-dev.myshopify.com'

headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Shop-Domain': SHOP_DOMAIN
}

# Create a campaign
def create_campaign():
    response = requests.post(
        f'{BASE_URL}/campaigns',
        json={
            'name': 'Black Friday Sale',
            'message': 'Get 50% off everything!',
            'audience': 'all',
            'scheduleType': 'immediate'
        },
        headers=headers
    )
    return response.json()

# Get contacts
def get_contacts(page=1):
    response = requests.get(
        f'{BASE_URL}/contacts',
        params={'page': page, 'pageSize': 20},
        headers={'X-Shopify-Shop-Domain': SHOP_DOMAIN}
    )
    return response.json()

# Send campaign
def send_campaign(campaign_id):
    response = requests.post(
        f'{BASE_URL}/campaigns/{campaign_id}/send',
        headers=headers
    )
    return response.json()
```

---

## 📚 Additional Resources

- **[POSTMAN_SETUP.md](./POSTMAN_SETUP.md)** - Postman collection setup
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Environment variables
- **[SHOPIFY_ACCESS_TOKEN_SETUP.md](./SHOPIFY_ACCESS_TOKEN_SETUP.md)** - Shopify token setup
- **[REDIS_SETUP.md](./REDIS_SETUP.md)** - Redis configuration
- **[FIXES_SUMMARY.md](./FIXES_SUMMARY.md)** - Recent fixes

---

## 🔄 Changelog

### Version 1.0.0 (2025-11-10)
- Initial API documentation
- Complete endpoint coverage
- Architecture documentation
- Code examples

---

**Last Updated:** 2025-11-10  
**Maintained by:** Sendly Development Team

