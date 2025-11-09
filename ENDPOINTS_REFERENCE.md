# 📡 API Endpoints Reference

**Sendly Marketing Backend - Complete Endpoints Documentation**

**Base URL:** `https://sendly-marketing-backend.onrender.com`  
**API Version:** 1.0.0

---

## 📋 Table of Contents

1. [Authentication & Headers](#authentication--headers)
2. [Response Format](#response-format)
3. [Dashboard Endpoints](#dashboard-endpoints)
4. [Campaigns Endpoints](#campaigns-endpoints)
5. [Contacts Endpoints](#contacts-endpoints)
6. [Billing Endpoints](#billing-endpoints)
7. [Automations Endpoints](#automations-endpoints)
8. [Reports Endpoints](#reports-endpoints)
9. [Discounts Endpoints](#discounts-endpoints)
10. [Settings Endpoints](#settings-endpoints)
11. [Templates Endpoints](#templates-endpoints)
12. [Audiences Endpoints](#audiences-endpoints)
13. [Tracking Endpoints](#tracking-endpoints)
14. [Shopify Endpoints](#shopify-endpoints)
15. [Core Endpoints](#core-endpoints)

---

## 🔐 Authentication & Headers

### Required Headers for Store-Scoped Endpoints

All store-scoped endpoints require the **Shopify store domain** to be provided in one of the following ways:

#### **Option 1: Header (Recommended)**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

#### **Option 2: Alternative Headers**
```http
X-Shopify-Shop: your-store.myshopify.com
X-Shopify-Shop-Name: your-store
```

#### **Option 3: Query Parameter**
```
GET /campaigns?shop=your-store.myshopify.com
```

#### **Option 4: Body Parameter** (for POST/PUT requests)
```json
{
  "shop": "your-store.myshopify.com",
  ...
}
```

#### **Option 5: URL Path** (for embedded Shopify apps)
```
/store/your-store.myshopify.com/campaigns
```

### Standard Headers

```http
Content-Type: application/json
Accept: application/json
API-Version: 1.0.0          # Optional: API version
X-Request-ID: {uuid}         # Optional: Request tracking
```

### Authorization Header (if applicable)

```http
Authorization: Bearer {token}
```

---

## 📦 Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Paginated Response

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

### Error Response

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/campaigns",
  "method": "POST",
  "requestId": "req-abc123"
}
```

**Common Error Codes:**
- `validation_error` (400)
- `authentication_error` (401)
- `authorization_error` (403)
- `not_found` (404)
- `conflict_error` (409)
- `rate_limit_error` (429)
- `external_service_error` (502)
- `server_error` (500)

---

## 📊 Dashboard Endpoints

### GET `/dashboard/overview`

Get comprehensive dashboard data including stats, recent activity, and wallet balance.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
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
        "id": "msg-uuid",
        "phoneE164": "+306977123456",
        "status": "delivered",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "recentTransactions": [
      {
        "id": "txn-uuid",
        "type": "purchase",
        "amount": 50,
        "currency": "EUR",
        "createdAt": "2024-01-15T09:00:00Z"
      }
    ]
  }
}
```

---

### GET `/dashboard/quick-stats`

Get quick statistics for dashboard widgets.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "smsSent": 1250,
    "walletBalance": 500
  }
}
```

---

## 🎯 Campaigns Endpoints

### GET `/campaigns`

List campaigns with filtering, search, and pagination.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `pageSize` | number | Items per page (max 100) | 20 |
| `status` | string | Filter by status: `draft`, `scheduled`, `sending`, `sent`, `failed`, `cancelled` | - |
| `sortBy` | string | Sort field: `createdAt`, `updatedAt`, `name`, `scheduleAt` | `createdAt` |
| `sortOrder` | string | Sort order: `asc`, `desc` | `desc` |

**Example Request:**
```http
GET /campaigns?page=1&pageSize=20&status=sent&sortBy=createdAt&sortOrder=desc
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "campaign-uuid-456",
        "shopId": "store-uuid-123",
        "name": "Summer Sale Campaign",
        "message": "Get 20% off on all summer items!",
        "audience": "all",
        "discountId": "discount-uuid-789",
        "scheduleType": "immediate",
        "scheduleAt": null,
        "recurringDays": null,
        "status": "sent",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:35:00Z",
        "metrics": {
          "sent": 1000,
          "delivered": 950,
          "failed": 50,
          "opened": 200,
          "clicked": 50
        }
      }
    ],
    "campaigns": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### GET `/campaigns/:id`

Get a single campaign by ID.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Campaign ID (UUID) |

**Example Request:**
```http
GET /campaigns/campaign-uuid-456
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "campaign-uuid-456",
    "shopId": "store-uuid-123",
    "name": "Summer Sale Campaign",
    "message": "Get 20% off on all summer items!",
    "audience": "all",
    "discountId": "discount-uuid-789",
    "scheduleType": "immediate",
    "scheduleAt": null,
    "recurringDays": null,
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "metrics": {
      "id": "metrics-uuid-789",
      "campaignId": "campaign-uuid-456",
      "sent": 0,
      "delivered": 0,
      "failed": 0,
      "opened": 0,
      "clicked": 0
    },
    "recipients": [
      {
        "id": "recipient-uuid",
        "contactId": "contact-uuid",
        "phoneE164": "+306977123456",
        "status": "pending"
      }
    ]
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "not_found",
  "message": "Campaign not found",
  "code": "NOT_FOUND"
}
```

---

### POST `/campaigns`

Create a new campaign.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer Sale Campaign",
  "message": "Get 20% off on all summer items! Use code SUMMER20",
  "audience": "all",
  "discountId": "discount-uuid-789",
  "scheduleType": "immediate",
  "scheduleAt": null,
  "recurringDays": null
}
```

**Field Validation:**
- `name`: **required**, string, min 1 char, max 200 chars
- `message`: **required**, string, min 1 char, max 1600 chars
- `audience`: optional, enum: `"all"`, `"male"`, `"female"`, `"men"`, `"women"`, `"segment:{id}"` (default: `"all"`)
- `discountId`: optional, string (UUID)
- `scheduleType`: **required**, enum: `"immediate"`, `"scheduled"`, `"recurring"` (default: `"immediate"`)
- `scheduleAt`: **required if** `scheduleType = "scheduled"`, ISO 8601 datetime, must be in future
- `recurringDays`: **required if** `scheduleType = "recurring"`, number (1-365)

**Example Request:**
```http
POST /campaigns
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "name": "Summer Sale Campaign",
  "message": "Get 20% off on all summer items!",
  "audience": "all",
  "scheduleType": "immediate"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "campaign-uuid-456",
    "shopId": "store-uuid-123",
    "name": "Summer Sale Campaign",
    "message": "Get 20% off on all summer items!",
    "audience": "all",
    "discountId": null,
    "scheduleType": "immediate",
    "scheduleAt": null,
    "recurringDays": null,
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Campaign created successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Campaign name is required",
  "code": "VALIDATION_ERROR"
}
```

---

### PUT `/campaigns/:id`

Update an existing campaign.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Campaign ID (UUID) |

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Campaign Name",
  "message": "Updated message",
  "audience": "male",
  "discountId": "discount-uuid-789",
  "scheduleType": "scheduled",
  "scheduleAt": "2024-01-20T10:00:00Z",
  "recurringDays": null
}
```

**Example Request:**
```http
PUT /campaigns/campaign-uuid-456
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "name": "Updated Campaign Name",
  "message": "Updated message"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "campaign-uuid-456",
    "name": "Updated Campaign Name",
    "message": "Updated message",
    ...
  },
  "message": "Campaign updated successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Cannot update a campaign that has already been sent",
  "code": "VALIDATION_ERROR"
}
```

---

### DELETE `/campaigns/:id`

Delete a campaign.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Campaign ID (UUID) |

**Example Request:**
```http
DELETE /campaigns/campaign-uuid-456
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Campaign deleted successfully"
}
```

---

### POST `/campaigns/:id/prepare`

Prepare campaign for sending (validate recipients and credits).

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Campaign ID (UUID) |

**Example Request:**
```http
POST /campaigns/campaign-uuid-456/prepare
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recipientCount": 1000,
    "requiredCredits": 1000,
    "availableCredits": 500,
    "canSend": false,
    "message": "Insufficient credits. Required: 1000, Available: 500"
  },
  "message": "Campaign prepared successfully"
}
```

**Error Response (402 Payment Required):**
```json
{
  "success": false,
  "error": "insufficient_credits",
  "message": "Insufficient credits. Required: 1000, Available: 500",
  "code": "INSUFFICIENT_CREDITS"
}
```

---

### POST `/campaigns/:id/send`

Send campaign immediately.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Campaign ID (UUID) |

**Example Request:**
```http
POST /campaigns/campaign-uuid-456/send
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-uuid-456",
    "status": "sending",
    "queued": true,
    "messageCount": 1000
  },
  "message": "Campaign queued for sending"
}
```

**Error Response (402 Payment Required):**
```json
{
  "success": false,
  "error": "insufficient_credits",
  "message": "Insufficient credits. Required: 1000, Available: 500",
  "code": "INSUFFICIENT_CREDITS"
}
```

---

### PUT `/campaigns/:id/schedule`

Schedule campaign for later.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Campaign ID (UUID) |

**Request Body:**
```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2024-01-20T10:00:00Z",
  "recurringDays": null
}
```

**Field Validation:**
- `scheduleType`: **required**, enum: `"scheduled"`, `"recurring"` (default: `"scheduled"`)
- `scheduleAt`: **required**, ISO 8601 datetime, must be in future
- `recurringDays`: optional, number (1-365)

**Example Request:**
```http
PUT /campaigns/campaign-uuid-456/schedule
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "scheduleType": "scheduled",
  "scheduleAt": "2024-01-20T10:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scheduled": true,
    "campaign": {
      "id": "campaign-uuid-456",
      "scheduleType": "scheduled",
      "scheduleAt": "2024-01-20T10:00:00Z",
      "status": "scheduled"
    }
  },
  "message": "Campaign scheduled successfully"
}
```

---

### GET `/campaigns/:id/metrics`

Get campaign metrics.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Campaign ID (UUID) |

**Example Request:**
```http
GET /campaigns/campaign-uuid-456/metrics
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "metrics-uuid-789",
    "campaignId": "campaign-uuid-456",
    "sent": 1000,
    "delivered": 950,
    "failed": 50,
    "opened": 200,
    "clicked": 50,
    "deliveryRate": 0.95,
    "openRate": 0.21,
    "clickRate": 0.05
  }
}
```

---

### GET `/campaigns/stats/summary`

Get campaign statistics summary.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /campaigns/stats/summary
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "draft": 10,
    "scheduled": 5,
    "sending": 2,
    "sent": 25,
    "failed": 2,
    "cancelled": 1,
    "totalSent": 50000,
    "totalDelivered": 47500,
    "totalFailed": 2500,
    "averageDeliveryRate": 0.95
  }
}
```

---

## 👥 Contacts Endpoints

### GET `/contacts`

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
| `filter` | string | Filter: `all`, `male`, `female`, `consented`, `nonconsented` | `all` |
| `q` | string | Search in name, email, phone | - |
| `sortBy` | string | Sort field: `createdAt`, `updatedAt`, `firstName`, `lastName`, `birthDate` | `createdAt` |
| `sortOrder` | string | Sort order: `asc`, `desc` | `desc` |
| `gender` | string | Filter by gender: `male`, `female`, `other` | - |
| `smsConsent` | string | Filter by SMS consent: `opted_in`, `opted_out`, `unknown` | - |
| `hasBirthDate` | string | Filter by birthday: `true`, `false` | - |

**Example Request:**
```http
GET /contacts?page=1&pageSize=20&filter=consented&q=john&sortBy=firstName&sortOrder=asc
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "contact-uuid-123",
        "shopId": "store-uuid-123",
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
    "contacts": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "applied": {
        "filter": "consented",
        "q": "john"
      },
      "available": {
        "genders": ["male", "female", "other"],
        "consentStatuses": ["opted_in", "opted_out", "unknown"]
      }
    }
  }
}
```

---

### GET `/contacts/:id`

Get a single contact by ID.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Contact ID (UUID) |

**Example Request:**
```http
GET /contacts/contact-uuid-123
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "contact-uuid-123",
    "shopId": "store-uuid-123",
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

---

### POST `/contacts`

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

**Field Validation:**
- `phoneE164`: **required**, string, E.164 format (e.g., `+306977123456`)
- `firstName`: optional, string, max 100 chars
- `lastName`: optional, string, max 100 chars
- `email`: optional, string, valid email format
- `gender`: optional, enum: `"male"`, `"female"`, `"other"`
- `birthDate`: optional, ISO 8601 datetime, cannot be in future
- `smsConsent`: optional, enum: `"opted_in"`, `"opted_out"`, `"unknown"` (default: `"unknown"`)
- `tags`: optional, array of strings (default: `[]`)

**Example Request:**
```http
POST /contacts
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneE164": "+306977123456",
  "email": "john@example.com",
  "smsConsent": "opted_in"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "contact-uuid-123",
    "shopId": "store-uuid-123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306977123456",
    "email": "john@example.com",
    "gender": null,
    "birthDate": null,
    "smsConsent": "opted_in",
    "tags": [],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Contact created successfully"
}
```

---

### PUT `/contacts/:id`

Update an existing contact.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Contact ID (UUID) |

**Request Body:** (all fields optional)
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "gender": "female",
  "birthDate": "1995-05-15T00:00:00.000Z",
  "smsConsent": "opted_in",
  "tags": ["vip"]
}
```

**Example Request:**
```http
PUT /contacts/contact-uuid-123
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "firstName": "Jane",
  "smsConsent": "opted_in"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "contact-uuid-123",
    "firstName": "Jane",
    "smsConsent": "opted_in",
    ...
  },
  "message": "Contact updated successfully"
}
```

---

### DELETE `/contacts/:id`

Delete a contact.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Contact ID (UUID) |

**Example Request:**
```http
DELETE /contacts/contact-uuid-123
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Contact deleted successfully"
}
```

---

### GET `/contacts/stats`

Get contact statistics.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /contacts/stats
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 2500,
    "optedIn": 2100,
    "optedOut": 400,
    "unknown": 0,
    "male": 1200,
    "female": 1000,
    "other": 300,
    "withBirthDate": 1500,
    "withoutBirthDate": 1000
  }
}
```

---

### GET `/contacts/birthdays`

Get contacts with upcoming birthdays.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `daysAhead` | number | Days ahead to check (max 365) | 7 |

**Example Request:**
```http
GET /contacts/birthdays?daysAhead=30
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "contact-uuid-123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+306977123456",
        "birthDate": "1990-01-20T00:00:00.000Z",
        "daysUntilBirthday": 5
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 15,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### POST `/contacts/import`

Import contacts from CSV (bulk import).

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
      "phoneE164": "+306977123789",
      "email": "jane@example.com",
      "smsConsent": "opted_in"
    }
  ]
}
```

**Field Validation:**
- `contacts`: **required**, array, min 1 contact, max 1000 contacts per import
- Each contact follows the same validation as `POST /contacts`

**Example Request:**
```http
POST /contacts/import
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "contacts": [
    {
      "phoneE164": "+306977123456",
      "firstName": "John",
      "smsConsent": "opted_in"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "imported": 2,
    "failed": 0,
    "errors": []
  },
  "message": "Contacts imported successfully"
}
```

---

## 💳 Billing Endpoints

### GET `/billing/balance`

Get current credit balance.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /billing/balance
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "balance": 500,
    "currency": "EUR"
  }
}
```

---

### GET `/billing/packages`

Get available credit packages.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /billing/packages
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "package_1000",
        "name": "1,000 Credits",
        "credits": 1000,
        "price": 50,
        "currency": "EUR"
      },
      {
        "id": "package_5000",
        "name": "5,000 Credits",
        "credits": 5000,
        "price": 200,
        "currency": "EUR"
      },
      {
        "id": "package_10000",
        "name": "10,000 Credits",
        "credits": 10000,
        "price": 350,
        "currency": "EUR"
      },
      {
        "id": "package_25000",
        "name": "25,000 Credits",
        "credits": 25000,
        "price": 750,
        "currency": "EUR"
      }
    ]
  }
}
```

---

### GET `/billing/history`

Get transaction history.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `pageSize` | number | Items per page (max 100) | 20 |
| `type` | string | Filter by type: `purchase`, `debit`, `credit`, `refund`, `adjustment` | - |
| `startDate` | string | Start date (ISO 8601) | - |
| `endDate` | string | End date (ISO 8601) | - |

**Example Request:**
```http
GET /billing/history?page=1&pageSize=20&type=purchase
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "txn-uuid-123",
        "type": "purchase",
        "amount": 50,
        "credits": 1000,
        "currency": "EUR",
        "status": "completed",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### GET `/billing/billing-history`

Get billing history (Stripe transactions).

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `pageSize` | number | Items per page (max 100) | 20 |
| `status` | string | Filter by status: `pending`, `completed`, `failed` | - |

**Example Request:**
```http
GET /billing/billing-history?page=1&pageSize=20
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "billing-uuid-123",
        "stripeSessionId": "cs_test_...",
        "packageId": "package_1000",
        "amount": 50,
        "credits": 1000,
        "currency": "EUR",
        "status": "completed",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### POST `/billing/purchase`

Create Stripe checkout session for credit purchase.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "packageId": "package_1000",
  "successUrl": "https://your-store.myshopify.com/admin/apps/sendly/success",
  "cancelUrl": "https://your-store.myshopify.com/admin/apps/sendly/cancel"
}
```

**Field Validation:**
- `packageId`: **required**, enum: `"package_1000"`, `"package_5000"`, `"package_10000"`, `"package_25000"`
- `successUrl`: **required**, string, valid URL
- `cancelUrl`: **required**, string, valid URL

**Example Request:**
```http
POST /billing/purchase
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "packageId": "package_1000",
  "successUrl": "https://your-store.myshopify.com/admin/apps/sendly/success",
  "cancelUrl": "https://your-store.myshopify.com/admin/apps/sendly/cancel"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_abc123",
    "url": "https://checkout.stripe.com/pay/cs_test_abc123"
  },
  "message": "Checkout session created successfully"
}
```

---

## 🤖 Automations Endpoints

### GET `/automations`

Get user automations.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /automations
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "automations": [
      {
        "id": "auto-uuid-123",
        "shopId": "store-uuid-123",
        "trigger": "order_placed",
        "enabled": true,
        "message": "Thank you for your order!",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

### GET `/automations/stats`

Get automation statistics.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /automations/stats
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "enabled": 3,
    "disabled": 2,
    "totalSent": 1000
  }
}
```

---

### PUT `/automations/:id`

Update user automation.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Automation ID (UUID) |

**Request Body:**
```json
{
  "enabled": true,
  "message": "Updated automation message"
}
```

**Example Request:**
```http
PUT /automations/auto-uuid-123
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "enabled": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "auto-uuid-123",
    "enabled": false,
    ...
  },
  "message": "Automation updated successfully"
}
```

---

### GET `/automations/defaults`

Get system default automations.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /automations/defaults
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "defaults": [
      {
        "trigger": "order_placed",
        "message": "Thank you for your order!",
        "enabled": true
      }
    ]
  }
}
```

---

### POST `/automations/sync`

Sync system default automations.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
POST /automations/sync
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "synced": 3
  },
  "message": "Automations synced successfully"
}
```

---

## 📈 Reports Endpoints

### GET `/reports/overview`

Get reports overview.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /reports/overview
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
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
    "campaigns": {
      "total": 45,
      "sent": 25,
      "scheduled": 5
    }
  }
}
```

---

### GET `/reports/kpis`

Get key performance indicators.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /reports/kpis
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deliveryRate": 0.95,
    "openRate": 0.21,
    "clickRate": 0.05,
    "averageResponseTime": 2.5
  }
}
```

---

### GET `/reports/campaigns`

Get campaign reports.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /reports/campaigns
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign-uuid-456",
        "name": "Summer Sale",
        "sent": 1000,
        "delivered": 950,
        "failed": 50,
        "opened": 200,
        "clicked": 50
      }
    ]
  }
}
```

---

### GET `/reports/campaigns/:id`

Get specific campaign report.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Campaign ID (UUID) |

**Example Request:**
```http
GET /reports/campaigns/campaign-uuid-456
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "campaign-uuid-456",
      "name": "Summer Sale",
      "sent": 1000,
      "delivered": 950,
      "failed": 50,
      "opened": 200,
      "clicked": 50
    }
  }
}
```

---

### GET `/reports/export`

Export data.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Export type: `campaigns`, `contacts`, `transactions` |
| `format` | string | Export format: `csv`, `json` |

**Example Request:**
```http
GET /reports/export?type=campaigns&format=csv
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```http
Content-Type: text/csv
Content-Disposition: attachment; filename="campaigns-2024-01-15.csv"

id,name,sent,delivered,failed
...
```

---

## 🎟️ Discounts Endpoints

### GET `/discounts`

Get available Shopify discount codes.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /discounts
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "id": "discount-uuid-789",
        "code": "SUMMER20",
        "title": "Summer Sale 20% Off",
        "type": "percentage",
        "value": 20,
        "status": "active"
      }
    ]
  }
}
```

---

### GET `/discounts/:id`

Get specific discount code.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Discount ID (UUID) |

**Example Request:**
```http
GET /discounts/discount-uuid-789
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "discount-uuid-789",
    "code": "SUMMER20",
    "title": "Summer Sale 20% Off",
    "type": "percentage",
    "value": 20,
    "status": "active"
  }
}
```

---

### GET `/discounts/validate/:code`

Validate discount code for campaign use.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Discount code |

**Example Request:**
```http
GET /discounts/validate/SUMMER20
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "SUMMER20",
    "title": "Summer Sale 20% Off",
    "type": "percentage",
    "value": 20
  }
}
```

---

## ⚙️ Settings Endpoints

### GET `/settings`

Get store settings.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /settings
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "currency": "EUR",
    "timezone": "Europe/Athens",
    "senderNumber": "Sendly",
    "senderName": "Sendly"
  }
}
```

---

### GET `/settings/account`

Get account information.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /settings/account
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "shopDomain": "your-store.myshopify.com",
    "shopName": "Your Store",
    "credits": 500,
    "currency": "EUR",
    "status": "active"
  }
}
```

---

### PUT `/settings/sender`

Update sender number/name.

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

**Example Request:**
```http
PUT /settings/sender
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "senderNumber": "MyStore",
  "senderName": "My Store"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "senderNumber": "MyStore",
    "senderName": "My Store"
  },
  "message": "Sender settings updated successfully"
}
```

---

## 📝 Templates Endpoints

### GET `/templates`

Get all templates (public, no authentication required).

**Example Request:**
```http
GET /templates
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template-uuid-123",
        "name": "Welcome Message",
        "category": "welcome",
        "message": "Welcome to our store!",
        "variables": ["firstName"]
      }
    ]
  }
}
```

---

### GET `/templates/categories`

Get template categories.

**Example Request:**
```http
GET /templates/categories
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      "welcome",
      "promotional",
      "abandoned_cart",
      "order_confirmation"
    ]
  }
}
```

---

### GET `/templates/:id`

Get template by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Template ID (UUID) |

**Example Request:**
```http
GET /templates/template-uuid-123
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "template-uuid-123",
    "name": "Welcome Message",
    "category": "welcome",
    "message": "Welcome to our store, {{firstName}}!",
    "variables": ["firstName"]
  }
}
```

---

### POST `/templates/:id/track`

Track template usage (requires store context).

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Template ID (UUID) |

**Example Request:**
```http
POST /templates/template-uuid-123/track
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tracked": true
  },
  "message": "Template usage tracked"
}
```

---

## 👥 Audiences Endpoints

### GET `/audiences`

Get predefined audiences.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /audiences
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "audiences": [
      {
        "id": "all",
        "name": "All Contacts",
        "count": 2500
      },
      {
        "id": "male",
        "name": "Male Contacts",
        "count": 1200
      },
      {
        "id": "female",
        "name": "Female Contacts",
        "count": 1000
      }
    ]
  }
}
```

---

### GET `/audiences/:audienceId/details`

Get audience details with contact list.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `audienceId` | string | Audience ID |

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (max 100) | 20 |

**Example Request:**
```http
GET /audiences/all/details?page=1&limit=20
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "audience": {
      "id": "all",
      "name": "All Contacts",
      "count": 2500
    },
    "contacts": [
      {
        "id": "contact-uuid-123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+306977123456"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2500,
      "totalPages": 125
    }
  }
}
```

---

### POST `/audiences/validate`

Validate audience selection.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "audienceId": "all"
}
```

**Example Request:**
```http
POST /audiences/validate
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "audienceId": "all"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "audienceId": "all",
    "count": 2500
  }
}
```

---

## 📊 Tracking Endpoints

### GET `/tracking/mitto/:messageId`

Get delivery status for a specific Mitto message.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `messageId` | string | Mitto message ID |

**Example Request:**
```http
GET /tracking/mitto/mitto-msg-123
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messageId": "mitto-msg-123",
    "phoneE164": "+306977123456",
    "status": "delivered",
    "deliveryStatus": "delivered",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:05:00Z",
    "campaign": {
      "name": "Summer Sale Campaign",
      "status": "sent"
    }
  }
}
```

---

### GET `/tracking/campaign/:campaignId`

Get delivery status for all messages in a campaign.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `campaignId` | string | Campaign ID (UUID) |

**Example Request:**
```http
GET /tracking/campaign/campaign-uuid-456
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign-uuid-456",
    "total": 1000,
    "delivered": 950,
    "failed": 50,
    "pending": 0,
    "messages": [
      {
        "id": "msg-uuid-123",
        "phoneE164": "+306977123456",
        "status": "delivered",
        "deliveryStatus": "delivered"
      }
    ]
  }
}
```

---

### POST `/tracking/bulk-update`

Bulk update delivery status for multiple messages.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "messageIds": ["mitto-msg-123", "mitto-msg-456"],
  "status": "delivered"
}
```

**Example Request:**
```http
POST /tracking/bulk-update
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "messageIds": ["mitto-msg-123"],
  "status": "delivered"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "updated": 1,
    "failed": 0
  },
  "message": "Delivery status updated successfully"
}
```

---

## 🛍️ Shopify Endpoints

### GET `/shopify/discounts`

Get available Shopify discount codes.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Example Request:**
```http
GET /shopify/discounts
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "id": "discount-uuid-789",
        "code": "SUMMER20",
        "title": "Summer Sale 20% Off",
        "type": "percentage",
        "value": 20
      }
    ]
  }
}
```

---

### GET `/shopify/discounts/:id`

Get specific Shopify discount code.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Discount ID (UUID) |

**Example Request:**
```http
GET /shopify/discounts/discount-uuid-789
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "discount-uuid-789",
    "code": "SUMMER20",
    "title": "Summer Sale 20% Off",
    "type": "percentage",
    "value": 20
  }
}
```

---

### POST `/shopify/discounts/validate`

Validate discount code for campaign use.

**Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json
```

**Request Body:**
```json
{
  "discountId": "discount-uuid-789"
}
```

**Example Request:**
```http
POST /shopify/discounts/validate
X-Shopify-Shop-Domain: your-store.myshopify.com
Content-Type: application/json

{
  "discountId": "discount-uuid-789"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountId": "discount-uuid-789",
    "code": "SUMMER20"
  }
}
```

---

## 🔧 Core Endpoints

### GET `/`

Health check endpoint.

**Example Request:**
```http
GET /
```

**Response (200 OK):**
```json
{
  "ok": true,
  "message": "Sendly API",
  "time": 1705312200000
}
```

---

### GET `/health`

Basic health check.

**Example Request:**
```http
GET /health
```

**Response (200 OK):**
```json
{
  "ok": true,
  "t": 1705312200000
}
```

---

### GET `/health/full`

Full health check with system diagnostics.

**Example Request:**
```http
GET /health/full
```

**Response (200 OK):**
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
      "responseTime": "2ms"
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

### GET `/metrics`

Get application metrics.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `format` | string | Format: `json`, `prometheus` | `json` |

**Example Request:**
```http
GET /metrics?format=json
```

**Response (200 OK):**
```json
{
  "requests": {
    "total": 1000,
    "success": 950,
    "errors": 50
  },
  "database": {
    "queries": 5000,
    "averageTime": 10
  }
}
```

---

### POST `/webhooks/app_uninstalled`

Shopify app uninstall webhook.

**Note:** Shopify webhook validation should be implemented via `Registry.process`.

**Request Body:**
```json
{
  "myshopify_domain": "your-store.myshopify.com"
}
```

**Example Request:**
```http
POST /webhooks/app_uninstalled
Content-Type: application/json

{
  "myshopify_domain": "your-store.myshopify.com"
}
```

**Response (200 OK):**
```
OK
```

---

## 📝 Notes

### Rate Limiting

Most endpoints have rate limiting applied. If you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": "rate_limit_error",
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_ERROR"
}
```

### Caching

GET endpoints may be cached. Cache is automatically invalidated on mutations (POST, PUT, DELETE).

### Pagination

List endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20, max: 100)

### Error Handling

All errors follow a standardized format. Check the `error` and `code` fields for specific error types.

### Multi-Tenancy

All store-scoped endpoints automatically filter data by the store identified in the `X-Shopify-Shop-Domain` header. You cannot access data from other stores.

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0

