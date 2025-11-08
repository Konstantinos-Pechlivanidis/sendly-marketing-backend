# 📚 Sendly Marketing Backend - Comprehensive API Documentation

**Version**: 2.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Authentication & Authorization](#authentication--authorization)
3. [Core & Health Endpoints](#core--health-endpoints)
4. [Dashboard Endpoints](#dashboard-endpoints)
5. [Contacts Endpoints](#contacts-endpoints)
6. [Campaigns Endpoints](#campaigns-endpoints)
7. [Automations Endpoints](#automations-endpoints)
8. [Billing & Credits Endpoints](#billing--credits-endpoints)
9. [Reports & Analytics Endpoints](#reports--analytics-endpoints)
10. [Templates Endpoints](#templates-endpoints)
11. [Audiences Endpoints](#audiences-endpoints)
12. [Settings Endpoints](#settings-endpoints)
13. [Tracking Endpoints](#tracking-endpoints)
14. [Discounts Endpoints](#discounts-endpoints)
15. [Webhooks](#webhooks)
16. [Error Handling](#error-handling)

---

## 🎯 Introduction

### Purpose

Sendly Marketing Backend is a comprehensive SMS marketing platform designed specifically for Shopify stores. It provides automated SMS campaigns, contact management, billing integration, and detailed analytics.

### Key Features

- **Multi-Store Support**: Each Shopify store has isolated data
- **SMS Campaigns**: Create, schedule, and send targeted SMS campaigns
- **Contact Management**: Import, manage, and segment customers
- **Automations**: Birthday messages, abandoned cart recovery, etc.
- **Billing Integration**: Credit system with Stripe integration
- **Analytics**: Comprehensive reports and tracking
- **Template System**: Pre-built SMS templates
- **Webhook Support**: Real-time delivery tracking

### Base URL

```
Production: https://sendly-marketing-backend.onrender.com
Development: http://localhost:3001
```

### Response Format

All endpoints return a standardized response format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Endpoint-specific data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

---

## 🔐 Authentication & Authorization

### Store Context

Most endpoints require store context, provided via headers:

**Required Headers:**
```http
X-Shopify-Shop-Domain: your-store.myshopify.com
```

**Alternative Headers:**
```http
X-Shopify-Shop: your-store.myshopify.com
X-Shopify-Shop-Name: your-store
Authorization: Bearer <token>
```

### Development Mode

In development, the app will attempt to auto-resolve store context if headers are missing.

---

## 🏥 Core & Health Endpoints

### GET `/`

**Purpose**: Root endpoint - API status check

**Description**: Returns basic API status and information.

**Request**: No parameters required

**Response** (200):
```json
{
  "ok": true,
  "message": "Sendly API",
  "time": 1703123456789
}
```

**Use Case**: Quick health check, API availability verification

---

### GET `/health`

**Purpose**: Basic health check

**Description**: Returns simple health status with timestamp.

**Request**: No parameters required

**Response** (200):
```json
{
  "ok": true,
  "t": 1703123456789
}
```

**Use Case**: Simple uptime monitoring, load balancer health checks

---

### GET `/health/config`

**Purpose**: Configuration health check

**Description**: Returns configuration status for external services.

**Request**: No parameters required

**Response** (200):
```json
{
  "ok": true,
  "shopify": {
    "configured": true,
    "apiKey": "***"
  },
  "redis": true,
  "mitto": {
    "base": "http://messaging.mittoapi.com",
    "hasKey": true
  }
}
```

**Use Case**: Verify service configuration, diagnose integration issues

---

### GET `/health/full`

**Purpose**: Comprehensive health check

**Description**: Performs full health check of all services (database, Redis, cache, queues, Mitto API).

**Request**: No parameters required

**Response** (200):
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
      "responseTime": "12ms"
    },
    "cache": {
      "status": "healthy"
    },
    "queue": {
      "status": "healthy",
      "responseTime": "8ms"
    },
    "mitto": {
      "status": "healthy",
      "responseTime": "45ms"
    },
    "shopify": {
      "configured": true
    }
  },
  "metrics": {
    "memory": {...},
    "cpu": {...},
    "uptime": 3600,
    "nodeVersion": "v18.17.0",
    "platform": "linux"
  },
  "timestamp": "2024-12-20T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "responseTime": "150ms"
}
```

**Use Case**: Comprehensive monitoring, service status dashboard, troubleshooting

---

### GET `/metrics`

**Purpose**: Application metrics

**Description**: Returns application metrics in JSON or Prometheus format.

**Query Parameters**:
- `format` (optional): `json` (default) or `prometheus`

**Request Example**:
```http
GET /metrics
GET /metrics?format=prometheus
```

**Response** (200 - JSON):
```json
{
  "requests": {
    "total": 1250,
    "successful": 1200,
    "failed": 50
  },
  "database": {
    "queries": 5000,
    "avgResponseTime": 15
  },
  "cache": {
    "hits": 800,
    "misses": 200
  }
}
```

**Response** (200 - Prometheus):
```
http_requests_total 1250
http_requests_successful 1200
database_queries_total 5000
cache_hits_total 800
```

**Use Case**: Monitoring integration, performance tracking, Prometheus scraping

---

### GET `/whoami`

**Purpose**: Get current shop information

**Description**: Returns information about the authenticated shop.

**Request**: Requires store context

**Response** (200):
```json
{
  "shop": {
    "id": "shop_123",
    "shopDomain": "your-store.myshopify.com",
    "shopName": "Your Store"
  }
}
```

**Use Case**: Verify authentication, get current shop context

---

### POST `/webhooks/app_uninstalled`

**Purpose**: Shopify app uninstall webhook

**Description**: Handles app uninstallation from Shopify store.

**Request**: Shopify webhook payload

**Response** (200):
```
OK
```

**Use Case**: Cleanup shop data when app is uninstalled

---

## 📊 Dashboard Endpoints

### GET `/dashboard/overview`

**Purpose**: Get comprehensive dashboard overview

**Description**: Returns aggregated dashboard data including SMS statistics, contact statistics, wallet balance, recent messages, and recent transactions.

**Request**: Requires store context

**Response** (200):
```json
{
  "success": true,
  "data": {
    "sms": {
      "sent": 1250,
      "delivered": 1180,
      "failed": 70,
      "deliveryRate": 94.4
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
        "id": "msg_123",
        "phoneE164": "+306977123456",
        "status": "delivered",
        "createdAt": "2024-12-20T10:00:00Z"
      }
    ],
    "recentTransactions": [
      {
        "id": "txn_123",
        "type": "purchase",
        "credits": 100,
        "createdAt": "2024-12-20T09:00:00Z"
      }
    ]
  }
}
```

**Use Case**: Main dashboard page, overview widgets, quick insights

---

### GET `/dashboard/quick-stats`

**Purpose**: Get quick statistics

**Description**: Returns quick statistics for dashboard widgets.

**Request**: Requires store context

**Response** (200):
```json
{
  "success": true,
  "data": {
    "smsSent": 1250,
    "walletBalance": 500
  }
}
```

**Use Case**: Dashboard widgets, quick stats display, summary cards

---

## 📇 Contacts Endpoints

### GET `/contacts`

**Purpose**: List contacts with filtering, search, and pagination

**Description**: Retrieves a paginated list of contacts with advanced filtering, search, and sorting capabilities.

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)
- `filter` (string, optional): Filter type (`all`, `consented`, `nonconsented`)
- `q` (string, optional): Search query (searches in name, email, phone)
- `sortBy` (string, optional): Sort field (`createdAt`, `firstName`, `lastName`, `email`)
- `sortOrder` (string, optional): Sort order (`asc`, `desc`, default: `desc`)
- `gender` (string, optional): Filter by gender (`male`, `female`, `other`)
- `smsConsent` (string, optional): Filter by SMS consent (`opted_in`, `opted_out`, `unknown`)
- `hasBirthDate` (boolean, optional): Filter by birthday availability

**Request Example**:
```http
GET /contacts?page=1&pageSize=20&filter=consented&q=john&sortBy=firstName&sortOrder=asc
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact_123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+306977123456",
        "email": "john@example.com",
        "gender": "male",
        "birthDate": "1990-01-15T00:00:00Z",
        "smsConsent": "opted_in",
        "tags": ["VIP", "Regular"],
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-12-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 2500,
      "totalPages": 125
    },
    "filters": {
      "applied": {
        "page": 1,
        "pageSize": 20,
        "filter": "consented",
        "q": "john"
      },
      "available": {
        "genders": ["male", "female", "other"],
        "smsConsent": ["opted_in", "opted_out", "unknown"],
        "filters": ["all", "male", "female", "consented", "nonconsented"]
      }
    }
  }
}
```

**Use Case**: Contact list page, contact management, customer database browsing

---

### GET `/contacts/:id`

**Purpose**: Get a single contact by ID

**Description**: Retrieves detailed information about a specific contact.

**Path Parameters**:
- `id` (string, required): Contact ID

**Request Example**:
```http
GET /contacts/contact_123
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneE164": "+306977123456",
    "email": "john@example.com",
    "gender": "male",
    "birthDate": "1990-01-15T00:00:00Z",
    "smsConsent": "opted_in",
    "tags": ["VIP", "Regular"],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-12-20T10:00:00Z"
  }
}
```

**Use Case**: Contact detail page, contact editing, customer profile view

---

### POST `/contacts`

**Purpose**: Create a new contact

**Description**: Creates a new contact in the database.

**Request Body**:
```json
{
  "phoneE164": "+306977123456",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "gender": "male",
  "birthDate": "1990-01-15",
  "smsConsent": "opted_in",
  "tags": ["VIP", "Regular"]
}
```

**Request Fields**:
- `phoneE164` (string, required): Phone number in E.164 format
- `firstName` (string, optional): First name
- `lastName` (string, optional): Last name
- `email` (string, optional): Email address (must be unique per shop)
- `gender` (string, optional): `male`, `female`, or `other`
- `birthDate` (string, optional): ISO date string (required for birthday automations)
- `smsConsent` (string, optional): `opted_in`, `opted_out`, or `unknown` (default: `unknown`)
- `tags` (array, optional): Array of tag strings

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "phoneE164": "+306977123456",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "smsConsent": "opted_in",
    "createdAt": "2024-12-20T10:00:00Z"
  },
  "message": "Contact created successfully"
}
```

**Use Case**: Manual contact creation, contact import, customer registration

---

### PUT `/contacts/:id`

**Purpose**: Update an existing contact

**Description**: Updates contact information.

**Path Parameters**:
- `id` (string, required): Contact ID

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "smsConsent": "opted_in",
  "tags": ["VIP"]
}
```

**Request Fields**: All fields are optional (partial update)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "firstName": "Jane",
    "lastName": "Smith",
    "phoneE164": "+306977123456",
    "email": "jane@example.com",
    "smsConsent": "opted_in",
    "updatedAt": "2024-12-20T10:30:00Z"
  },
  "message": "Contact updated successfully"
}
```

**Use Case**: Contact editing, updating customer information, consent management

---

### DELETE `/contacts/:id`

**Purpose**: Delete a contact

**Description**: Permanently deletes a contact from the database.

**Path Parameters**:
- `id` (string, required): Contact ID

**Response** (200):
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

**Use Case**: Contact removal, GDPR compliance, data cleanup

---

### GET `/contacts/stats`

**Purpose**: Get contact statistics

**Description**: Returns aggregated statistics about contacts.

**Request**: Requires store context

**Response** (200):
```json
{
  "success": true,
  "data": {
    "total": 2500,
    "optedIn": 2100,
    "optedOut": 400,
    "unknown": 0,
    "byGender": {
      "male": 1200,
      "female": 1100,
      "other": 50,
      "null": 150
    },
    "withBirthDate": 1800,
    "withoutBirthDate": 700
  }
}
```

**Use Case**: Contact statistics dashboard, analytics, reporting

---

### GET `/contacts/birthdays`

**Purpose**: Get contacts with birthdays

**Description**: Retrieves contacts with birthday information, optionally filtered by date range.

**Query Parameters**:
- `month` (number, optional): Filter by month (1-12)
- `day` (number, optional): Filter by specific day
- `upcoming` (number, optional): Get birthdays in next N days

**Request Example**:
```http
GET /contacts/birthdays?month=12
GET /contacts/birthdays?upcoming=30
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "contact_123",
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+306977123456",
      "birthDate": "1990-12-25T00:00:00Z",
      "smsConsent": "opted_in"
    }
  ]
}
```

**Use Case**: Birthday automation campaigns, birthday message scheduling, customer engagement

---

### POST `/contacts/import`

**Purpose**: Import contacts from CSV

**Description**: Imports multiple contacts from a CSV file or array.

**Request Body**:
```json
{
  "contacts": [
    {
      "phoneE164": "+306977111111",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "smsConsent": "opted_in"
    },
    {
      "phoneE164": "+306977222222",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "smsConsent": "opted_in"
    }
  ],
  "skipDuplicates": true
}
```

**Request Fields**:
- `contacts` (array, required): Array of contact objects
- `skipDuplicates` (boolean, optional): Skip duplicate contacts (default: `true`)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "imported": 95,
    "skipped": 5,
    "errors": 0,
    "results": [
      {
        "phoneE164": "+306977111111",
        "status": "imported",
        "id": "contact_123"
      },
      {
        "phoneE164": "+306977222222",
        "status": "skipped",
        "reason": "duplicate"
      }
    ]
  }
}
```

**Use Case**: Bulk contact import, CSV upload, customer database migration

---

## 📢 Campaigns Endpoints

### GET `/campaigns`

**Purpose**: List campaigns with filtering and pagination

**Description**: Retrieves a paginated list of campaigns with optional filtering.

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status (`draft`, `scheduled`, `sending`, `sent`, `failed`, `cancelled`)
- `sortBy` (string, optional): Sort field (`createdAt`, `name`, `scheduleAt`)
- `sortOrder` (string, optional): Sort order (`asc`, `desc`, default: `desc`)

**Request Example**:
```http
GET /campaigns?page=1&pageSize=20&status=sent
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign_123",
        "name": "Summer Sale",
        "message": "Get 20% off on summer collection!",
        "audience": "all",
        "status": "sent",
        "scheduleType": "immediate",
        "scheduleAt": null,
        "recurringDays": null,
        "createdAt": "2024-12-20T10:00:00Z",
        "updatedAt": "2024-12-20T10:05:00Z"
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

**Use Case**: Campaign list page, campaign management, campaign history

---

### GET `/campaigns/:id`

**Purpose**: Get a single campaign by ID

**Description**: Retrieves detailed information about a specific campaign.

**Path Parameters**:
- `id` (string, required): Campaign ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Summer Sale",
    "message": "Get 20% off on summer collection!",
    "audience": "all",
    "discountId": "discount_456",
    "status": "sent",
    "scheduleType": "immediate",
    "scheduleAt": null,
    "recurringDays": null,
    "createdAt": "2024-12-20T10:00:00Z",
    "updatedAt": "2024-12-20T10:05:00Z"
  }
}
```

**Use Case**: Campaign detail page, campaign editing, campaign review

---

### POST `/campaigns`

**Purpose**: Create a new campaign

**Description**: Creates a new SMS campaign.

**Request Body**:
```json
{
  "name": "Summer Sale",
  "message": "Get 20% off on summer collection! Use code SUMMER20",
  "audience": "all",
  "discountId": "discount_456",
  "scheduleType": "immediate",
  "status": "draft"
}
```

**Request Fields**:
- `name` (string, required): Campaign name (must be unique per shop)
- `message` (string, required): SMS message content
- `audience` (string, required): Audience filter (`all`, `consented`, `segment:segment_id`, etc.)
- `discountId` (string, optional): Shopify discount code ID
- `scheduleType` (string, required): `immediate`, `scheduled`, or `recurring`
- `scheduleAt` (string, optional): ISO datetime for scheduled campaigns
- `recurringDays` (number, optional): Days between recurring sends
- `status` (string, optional): `draft` (default), `scheduled`, `sending`, `sent`, `failed`

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Summer Sale",
    "message": "Get 20% off on summer collection! Use code SUMMER20",
    "audience": "all",
    "status": "draft",
    "scheduleType": "immediate",
    "createdAt": "2024-12-20T10:00:00Z"
  },
  "message": "Campaign created successfully"
}
```

**Use Case**: Campaign creation, marketing campaign setup, promotional messaging

---

### PUT `/campaigns/:id`

**Purpose**: Update a campaign

**Description**: Updates campaign information. Only draft campaigns can be updated.

**Path Parameters**:
- `id` (string, required): Campaign ID

**Request Body**: Partial update (all fields optional)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Updated Summer Sale",
    "message": "Updated message",
    "updatedAt": "2024-12-20T10:30:00Z"
  },
  "message": "Campaign updated successfully"
}
```

**Use Case**: Campaign editing, message updates, audience changes

---

### DELETE `/campaigns/:id`

**Purpose**: Delete a campaign

**Description**: Permanently deletes a campaign. Only draft campaigns can be deleted.

**Path Parameters**:
- `id` (string, required): Campaign ID

**Response** (200):
```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

**Use Case**: Campaign removal, campaign cleanup

---

### POST `/campaigns/:id/prepare`

**Purpose**: Prepare campaign for sending

**Description**: Validates campaign and calculates recipient count without sending.

**Path Parameters**:
- `id` (string, required): Campaign ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "recipientCount": 1250,
    "estimatedCost": 125,
    "valid": true,
    "warnings": []
  }
}
```

**Use Case**: Pre-send validation, cost estimation, recipient count verification

---

### POST `/campaigns/:id/send`

**Purpose**: Send campaign immediately

**Description**: Sends the campaign immediately to all recipients.

**Path Parameters**:
- `id` (string, required): Campaign ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "status": "sending",
    "recipientCount": 1250,
    "startedAt": "2024-12-20T10:30:00Z"
  },
  "message": "Campaign sending started"
}
```

**Use Case**: Immediate campaign sending, on-demand messaging

---

### PUT `/campaigns/:id/schedule`

**Purpose**: Schedule a campaign

**Description**: Schedules a campaign for future sending or sets up recurring sends.

**Path Parameters**:
- `id` (string, required): Campaign ID

**Request Body**:
```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2024-12-25T10:00:00Z",
  "recurringDays": null
}
```

**Request Fields**:
- `scheduleType` (string, required): `scheduled` or `recurring`
- `scheduleAt` (string, required for scheduled): ISO datetime
- `recurringDays` (number, required for recurring): Days between sends

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "status": "scheduled",
    "scheduleType": "scheduled",
    "scheduleAt": "2024-12-25T10:00:00Z",
    "updatedAt": "2024-12-20T10:30:00Z"
  },
  "message": "Campaign scheduled successfully"
}
```

**Use Case**: Scheduled campaigns, recurring messaging, automated sends

---

### GET `/campaigns/:id/metrics`

**Purpose**: Get campaign metrics

**Description**: Returns detailed metrics for a campaign including delivery statistics.

**Path Parameters**:
- `id` (string, required): Campaign ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "totalSent": 1250,
    "totalDelivered": 1180,
    "totalFailed": 70,
    "deliveryRate": 94.4,
    "totalClicked": 45,
    "clickRate": 3.8,
    "createdAt": "2024-12-20T10:00:00Z",
    "sentAt": "2024-12-20T10:05:00Z",
    "completedAt": "2024-12-20T10:10:00Z"
  }
}
```

**Use Case**: Campaign analytics, performance tracking, delivery reports

---

### GET `/campaigns/stats/summary`

**Purpose**: Get campaign statistics summary

**Description**: Returns aggregated statistics for all campaigns.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byStatus": {
      "draft": 10,
      "scheduled": 5,
      "sending": 2,
      "sent": 30,
      "failed": 3
    },
    "totalSent": 50000,
    "totalDelivered": 47500,
    "avgDeliveryRate": 95.0
  }
}
```

**Use Case**: Campaign overview, statistics dashboard, campaign analytics

---

## 💰 Billing & Credits Endpoints

### GET `/billing/balance`

**Purpose**: Get current credit balance

**Description**: Returns the current credit balance and currency for the shop.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "balance": 500,
    "credits": 500,
    "currency": "EUR"
  }
}
```

**Use Case**: Balance display, credit checking, wallet management

---

### GET `/billing/packages`

**Purpose**: Get available credit packages

**Description**: Returns list of available credit packages for purchase.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "package_100_credits",
        "name": "100 Credits",
        "credits": 100,
        "price": 10.00,
        "currency": "EUR",
        "description": "Starter package"
      },
      {
        "id": "package_500_credits",
        "name": "500 Credits",
        "credits": 500,
        "price": 45.00,
        "currency": "EUR",
        "description": "Popular package",
        "isPopular": true
      }
    ]
  }
}
```

**Use Case**: Package selection, purchase flow, pricing display

---

### GET `/billing/history`

**Purpose**: Get transaction history

**Description**: Returns paginated wallet transaction history.

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)
- `type` (string, optional): Filter by type (`purchase`, `debit`, `credit`, `refund`, `adjustment`)
- `from` (string, optional): Start date (ISO format)
- `to` (string, optional): End date (ISO format)

**Request Example**:
```http
GET /billing/history?page=1&pageSize=20&type=debit&from=2024-12-01&to=2024-12-31
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "type": "debit",
        "credits": -10,
        "ref": "campaign:campaign_123",
        "meta": {
          "description": "SMS sent"
        },
        "createdAt": "2024-12-20T10:00:00Z"
      },
      {
        "id": "txn_456",
        "type": "purchase",
        "credits": 100,
        "ref": "stripe:session_789",
        "meta": {
          "packageId": "package_100_credits"
        },
        "createdAt": "2024-12-19T15:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Use Case**: Transaction history, credit usage tracking, billing statements

---

### GET `/billing/billing-history`

**Purpose**: Get billing history (Stripe transactions)

**Description**: Returns paginated billing transaction history from Stripe.

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status (`pending`, `completed`, `failed`)
- `from` (string, optional): Start date (ISO format)
- `to` (string, optional): End date (ISO format)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "btxn_123",
        "amount": 1000,
        "currency": "EUR",
        "creditsAdded": 100,
        "packageType": "package_100_credits",
        "status": "completed",
        "stripeSessionId": "cs_test_123",
        "stripePaymentId": "pi_test_456",
        "createdAt": "2024-12-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

**Use Case**: Purchase history, billing records, payment tracking

---

### POST `/billing/purchase`

**Purpose**: Create Stripe checkout session

**Description**: Creates a Stripe checkout session for purchasing credits.

**Request Body**:
```json
{
  "packageId": "package_100_credits",
  "credits": 100,
  "price": 10.00,
  "currency": "EUR"
}
```

**Request Fields**:
- `packageId` (string, required): Package ID
- `credits` (number, required): Number of credits
- `price` (number, required): Price in currency units
- `currency` (string, required): Currency code (e.g., `EUR`)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_123",
    "sessionId": "cs_test_123",
    "transactionId": "btxn_123"
  }
}
```

**Use Case**: Credit purchase flow, Stripe integration, payment processing

---

## 📈 Reports & Analytics Endpoints

### GET `/reports/overview`

**Purpose**: Get reports overview

**Description**: Returns comprehensive overview of all reporting metrics.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "campaigns": {
      "total": 50,
      "sent": 30,
      "scheduled": 5
    },
    "contacts": {
      "total": 2500,
      "optedIn": 2100
    },
    "sms": {
      "totalSent": 50000,
      "totalDelivered": 47500,
      "deliveryRate": 95.0
    },
    "credits": {
      "balance": 500,
      "totalUsed": 49500,
      "totalPurchased": 50000
    }
  }
}
```

**Use Case**: Reports dashboard, executive summary, analytics overview

---

### GET `/reports/kpis`

**Purpose**: Get KPI metrics

**Description**: Returns key performance indicators.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "deliveryRate": 95.0,
    "optInRate": 84.0,
    "clickRate": 3.8,
    "avgResponseTime": 2.5,
    "totalRevenue": 12500.00,
    "roi": 125.0
  }
}
```

**Use Case**: KPI dashboard, performance metrics, business intelligence

---

### GET `/reports/campaigns`

**Purpose**: Get campaign reports

**Description**: Returns aggregated campaign performance data.

**Query Parameters**:
- `from` (string, optional): Start date (ISO format)
- `to` (string, optional): End date (ISO format)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalCampaigns": 50,
    "totalSent": 50000,
    "totalDelivered": 47500,
    "totalFailed": 2500,
    "avgDeliveryRate": 95.0,
    "topCampaigns": [
      {
        "id": "campaign_123",
        "name": "Summer Sale",
        "sent": 5000,
        "delivered": 4800,
        "deliveryRate": 96.0
      }
    ]
  }
}
```

**Use Case**: Campaign performance analysis, campaign reports, marketing insights

---

### GET `/reports/campaigns/:id`

**Purpose**: Get detailed campaign report

**Description**: Returns detailed report for a specific campaign.

**Path Parameters**:
- `id` (string, required): Campaign ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "name": "Summer Sale",
    "metrics": {
      "totalSent": 5000,
      "totalDelivered": 4800,
      "totalFailed": 200,
      "deliveryRate": 96.0,
      "totalClicked": 190,
      "clickRate": 3.96
    },
    "timeline": [
      {
        "date": "2024-12-20",
        "sent": 5000,
        "delivered": 4800,
        "failed": 200
      }
    ],
    "recipients": {
      "total": 5000,
      "byStatus": {
        "delivered": 4800,
        "failed": 200
      }
    }
  }
}
```

**Use Case**: Campaign detail report, performance analysis, campaign review

---

### GET `/reports/automations`

**Purpose**: Get automation reports

**Description**: Returns statistics about automation performance.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalAutomations": 8,
    "activeAutomations": 6,
    "totalTriggered": 1500,
    "totalSent": 1450,
    "totalFailed": 50,
    "byType": {
      "birthday": {
        "triggered": 500,
        "sent": 490,
        "failed": 10
      },
      "abandoned_cart": {
        "triggered": 1000,
        "sent": 960,
        "failed": 40
      }
    }
  }
}
```

**Use Case**: Automation performance, automation analytics, workflow insights

---

### GET `/reports/messaging`

**Purpose**: Get messaging reports

**Description**: Returns messaging statistics and performance data.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalMessages": 50000,
    "byDirection": {
      "outbound": 49500,
      "inbound": 500
    },
    "byStatus": {
      "sent": 47500,
      "delivered": 45000,
      "failed": 2000
    },
    "avgDeliveryTime": 2.5,
    "byProvider": {
      "mitto": {
        "sent": 49500,
        "delivered": 45000,
        "failed": 2000
      }
    }
  }
}
```

**Use Case**: Message analytics, delivery reports, messaging insights

---

### GET `/reports/credits`

**Purpose**: Get credit reports

**Description**: Returns credit usage and purchase statistics.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "currentBalance": 500,
    "totalUsed": 49500,
    "totalPurchased": 50000,
    "byType": {
      "purchase": 50000,
      "debit": 49500,
      "refund": 0
    },
    "monthlyUsage": [
      {
        "month": "2024-12",
        "used": 5000,
        "purchased": 5000
      }
    ]
  }
}
```

**Use Case**: Credit usage analysis, billing reports, cost tracking

---

### GET `/reports/contacts`

**Purpose**: Get contact reports

**Description**: Returns contact statistics and growth data.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "total": 2500,
    "optedIn": 2100,
    "optedOut": 400,
    "growth": {
      "thisMonth": 150,
      "lastMonth": 120,
      "growthRate": 25.0
    },
    "byGender": {
      "male": 1200,
      "female": 1100,
      "other": 50
    },
    "byConsent": {
      "opted_in": 2100,
      "opted_out": 400,
      "unknown": 0
    }
  }
}
```

**Use Case**: Contact analytics, customer base growth, segmentation insights

---

### GET `/reports/export`

**Purpose**: Export report data

**Description**: Exports report data in various formats.

**Query Parameters**:
- `type` (string, required): Report type (`campaigns`, `contacts`, `transactions`, `all`)
- `format` (string, optional): Export format (`csv`, `json`, default: `csv`)
- `from` (string, optional): Start date (ISO format)
- `to` (string, optional): End date (ISO format)

**Request Example**:
```http
GET /reports/export?type=campaigns&format=csv&from=2024-12-01&to=2024-12-31
```

**Response** (200):
- CSV format: Returns CSV file
- JSON format: Returns JSON data

**Use Case**: Data export, report generation, external analysis

---

## ⚙️ Settings Endpoints

### GET `/settings`

**Purpose**: Get shop settings

**Description**: Returns shop settings including sender configuration and recent transactions.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "settings": {
      "senderNumber": "+306977123456",
      "senderName": "MyStore",
      "timezone": "Europe/Athens",
      "currency": "EUR"
    },
    "recentTransactions": [
      {
        "id": "btxn_123",
        "amount": 1000,
        "status": "completed",
        "createdAt": "2024-12-20T10:00:00Z"
      }
    ]
  }
}
```

**Use Case**: Settings page, configuration management, account settings

---

### GET `/settings/account`

**Purpose**: Get account information

**Description**: Returns account and shop information.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "shop": {
      "id": "shop_123",
      "shopDomain": "your-store.myshopify.com",
      "shopName": "Your Store",
      "currency": "EUR",
      "credits": 500,
      "status": "active"
    },
    "settings": {
      "senderNumber": "+306977123456",
      "senderName": "MyStore",
      "timezone": "Europe/Athens"
    }
  }
}
```

**Use Case**: Account page, shop information display, account management

---

### PUT `/settings/sender`

**Purpose**: Update sender number and name

**Description**: Updates SMS sender configuration.

**Request Body**:
```json
{
  "senderNumber": "+306977123456",
  "senderName": "MyStore"
}
```

**Request Fields**:
- `senderNumber` (string, optional): Sender phone number (max 11 characters)
- `senderName` (string, optional): Sender name (max 11 characters)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "senderNumber": "+306977123456",
    "senderName": "MyStore",
    "updatedAt": "2024-12-20T10:30:00Z"
  },
  "message": "Sender settings updated successfully"
}
```

**Use Case**: Sender configuration, SMS branding, sender management

---

## 📝 Templates Endpoints

### GET `/templates`

**Purpose**: Get all templates

**Description**: Returns list of available SMS templates.

**Query Parameters**:
- `category` (string, optional): Filter by category
- `isPublic` (boolean, optional): Filter by public status

**Request Example**:
```http
GET /templates?category=promotional&isPublic=true
```

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "template_123",
      "title": "Welcome Message",
      "category": "welcome",
      "content": "Welcome to {{shopName}}! Get 10% off your first order.",
      "previewImage": "https://example.com/preview.png",
      "tags": ["welcome", "discount"],
      "isPublic": true,
      "isSystemDefault": false
    }
  ]
}
```

**Use Case**: Template selection, template browsing, message templates

---

### GET `/templates/categories`

**Purpose**: Get template categories

**Description**: Returns list of available template categories.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "name": "welcome",
      "count": 5,
      "description": "Welcome messages"
    },
    {
      "name": "promotional",
      "count": 10,
      "description": "Promotional campaigns"
    }
  ]
}
```

**Use Case**: Template category navigation, template organization

---

### GET `/templates/:id`

**Purpose**: Get template by ID

**Description**: Returns detailed information about a specific template.

**Path Parameters**:
- `id` (string, required): Template ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "template_123",
    "title": "Welcome Message",
    "category": "welcome",
    "content": "Welcome to {{shopName}}! Get 10% off your first order.",
    "previewImage": "https://example.com/preview.png",
    "tags": ["welcome", "discount"],
    "isPublic": true,
    "isSystemDefault": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Use Case**: Template detail view, template preview, template selection

---

### POST `/templates/:id/track`

**Purpose**: Track template usage

**Description**: Records usage of a template for analytics.

**Path Parameters**:
- `id` (string, required): Template ID

**Response** (200):
```json
{
  "success": true,
  "message": "Template usage tracked"
}
```

**Use Case**: Template analytics, usage tracking, popular templates

---

## 🤖 Automations Endpoints

### GET `/automations`

**Purpose**: Get user automations

**Description**: Returns list of automations configured for the shop.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "auto_123",
      "automationId": "auto_system_456",
      "title": "Birthday Automation",
      "description": "Send birthday messages",
      "triggerEvent": "birthday",
      "defaultMessage": "Happy Birthday! Get 20% off today!",
      "userMessage": "Happy Birthday {{firstName}}! Enjoy 20% off!",
      "isActive": true,
      "isSystemDefault": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z"
    }
  ]
}
```

**Use Case**: Automation management, automation list, workflow configuration

---

### GET `/automations/stats`

**Purpose**: Get automation statistics

**Description**: Returns statistics about automations.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalAutomations": 8,
    "activeAutomations": 6,
    "inactiveAutomations": 2
  }
}
```

**Use Case**: Automation dashboard, automation analytics

---

### PUT `/automations/:id`

**Purpose**: Update user automation

**Description**: Updates automation configuration (message content or active status).

**Path Parameters**:
- `id` (string, required): User automation ID

**Request Body**:
```json
{
  "userMessage": "Custom birthday message",
  "isActive": true
}
```

**Request Fields**:
- `userMessage` (string, optional): Custom message content
- `isActive` (boolean, optional): Enable/disable automation

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "auto_123",
    "userMessage": "Custom birthday message",
    "isActive": true,
    "updatedAt": "2024-12-20T10:30:00Z"
  },
  "message": "Automation updated successfully"
}
```

**Use Case**: Automation editing, message customization, automation activation

---

### GET `/automations/defaults`

**Purpose**: Get system default automations

**Description**: Returns list of system default automations available for configuration.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "auto_system_123",
      "title": "Birthday Automation",
      "description": "Send birthday messages to customers",
      "triggerEvent": "birthday",
      "defaultMessage": "Happy Birthday! Get 20% off today!",
      "isSystemDefault": true
    }
  ]
}
```

**Use Case**: Automation setup, default automation selection, automation library

---

### POST `/automations/sync`

**Purpose**: Sync system defaults to all users

**Description**: Syncs new system default automations to all shops (admin only).

**Response** (200):
```json
{
  "success": true,
  "data": {
    "syncedCount": 5,
    "totalShops": 10,
    "totalAutomations": 8
  },
  "message": "Successfully synced 5 new automations to all users"
}
```

**Use Case**: Admin automation management, system updates, automation deployment

---

## 👥 Audiences Endpoints

### GET `/audiences`

**Purpose**: Get available audiences

**Description**: Returns list of predefined audiences for campaign targeting.

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "all",
      "name": "All Contacts",
      "description": "All contacts in your database",
      "estimatedCount": 2500
    },
    {
      "id": "consented",
      "name": "Consented Contacts",
      "description": "Contacts who have opted in",
      "estimatedCount": 2100
    },
    {
      "id": "segment:segment_123",
      "name": "VIP Customers",
      "description": "VIP segment",
      "estimatedCount": 150
    }
  ]
}
```

**Use Case**: Audience selection, campaign targeting, audience management

---

### GET `/audiences/:audienceId/details`

**Purpose**: Get audience details with contact list

**Description**: Returns detailed information about an audience including paginated contact list.

**Path Parameters**:
- `audienceId` (string, required): Audience ID

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Request Example**:
```http
GET /audiences/consented/details?page=1&limit=20
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "audienceId": "consented",
    "name": "Consented Contacts",
    "totalCount": 2100,
    "contacts": [
      {
        "id": "contact_123",
        "firstName": "John",
        "lastName": "Doe",
        "phoneE164": "+306977123456",
        "smsConsent": "opted_in"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2100,
      "totalPages": 105
    }
  }
}
```

**Use Case**: Audience preview, contact list, audience validation

---

### POST `/audiences/validate`

**Purpose**: Validate audience selection

**Description**: Validates an audience selection and returns recipient count.

**Request Body**:
```json
{
  "audienceId": "consented"
}
```

**Request Fields**:
- `audienceId` (string, required): Audience ID to validate

**Response** (200):
```json
{
  "success": true,
  "data": {
    "audienceId": "consented",
    "valid": true,
    "recipientCount": 2100,
    "estimatedCost": 210
  }
}
```

**Use Case**: Campaign audience validation, recipient count estimation, cost calculation

---

## 🎟️ Discounts Endpoints

### GET `/discounts`

**Purpose**: Get Shopify discounts

**Description**: Returns list of available discount codes from Shopify.

**Query Parameters**:
- `status` (string, optional): Filter by status (`active`, `expired`)

**Request Example**:
```http
GET /discounts?status=active
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "id": "discount_123",
        "code": "SUMMER20",
        "title": "Summer Sale",
        "type": "percentage",
        "value": 20,
        "status": "active",
        "startsAt": "2024-06-01T00:00:00Z",
        "endsAt": "2024-08-31T23:59:59Z"
      }
    ]
  }
}
```

**Use Case**: Discount code selection, campaign discount integration, promotional codes

---

### GET `/discounts/:id`

**Purpose**: Get specific Shopify discount

**Description**: Returns detailed information about a specific discount code.

**Path Parameters**:
- `id` (string, required): Discount ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "discount_123",
    "code": "SUMMER20",
    "title": "Summer Sale",
    "type": "percentage",
    "value": 20,
    "status": "active",
    "startsAt": "2024-06-01T00:00:00Z",
    "endsAt": "2024-08-31T23:59:59Z",
    "usageLimit": 1000,
    "usedCount": 250
  }
}
```

**Use Case**: Discount detail view, discount verification, campaign discount selection

---

### GET `/discounts/validate/:code`

**Purpose**: Validate discount code

**Description**: Validates a discount code and returns its validity status.

**Path Parameters**:
- `code` (string, required): Discount code to validate

**Request Example**:
```http
GET /discounts/validate/SUMMER20
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "code": "SUMMER20",
    "isValid": true,
    "discount": {
      "id": "discount_123",
      "type": "percentage",
      "value": 20,
      "status": "active"
    }
  }
}
```

**Response** (404) - Invalid code:
```json
{
  "success": true,
  "data": {
    "code": "INVALID",
    "isValid": false
  }
}
```

**Use Case**: Discount code validation, code verification, campaign discount checking

---

## 📡 Tracking Endpoints

### GET `/tracking/mitto/:messageId`

**Purpose**: Get Mitto message delivery status

**Description**: Returns delivery status for a specific Mitto message.

**Path Parameters**:
- `messageId` (string, required): Mitto message ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "messageId": "mitto_msg_123",
    "status": "delivered",
    "deliveryStatus": "Delivered",
    "phoneE164": "+306977123456",
    "sentAt": "2024-12-20T10:00:00Z",
    "deliveredAt": "2024-12-20T10:00:02Z"
  }
}
```

**Use Case**: Message status tracking, delivery verification, message monitoring

---

### GET `/tracking/campaign/:campaignId`

**Purpose**: Get campaign delivery status

**Description**: Returns delivery status for all messages in a campaign.

**Path Parameters**:
- `campaignId` (string, required): Campaign ID

**Response** (200):
```json
{
  "success": true,
  "data": {
    "campaignId": "campaign_123",
    "totalSent": 1250,
    "byStatus": {
      "delivered": 1180,
      "failed": 70,
      "queued": 0
    },
    "recipients": [
      {
        "phoneE164": "+306977123456",
        "status": "delivered",
        "deliveredAt": "2024-12-20T10:00:02Z"
      },
      {
        "phoneE164": "+306977222222",
        "status": "failed",
        "error": "Invalid number"
      }
    ]
  }
}
```

**Use Case**: Campaign delivery tracking, recipient status monitoring, delivery reports

---

### POST `/tracking/bulk-update`

**Purpose**: Bulk update delivery status

**Description**: Updates delivery status for multiple messages.

**Request Body**:
```json
{
  "updates": [
    {
      "messageId": "mitto_msg_123",
      "status": "delivered",
      "deliveryStatus": "Delivered",
      "deliveredAt": "2024-12-20T10:00:02Z"
    },
    {
      "messageId": "mitto_msg_456",
      "status": "failed",
      "deliveryStatus": "Failed",
      "error": "Invalid number"
    }
  ]
}
```

**Request Fields**:
- `updates` (array, required): Array of status update objects
  - `messageId` (string, required): Message ID
  - `status` (string, required): Status (`sent`, `delivered`, `failed`)
  - `deliveryStatus` (string, optional): Delivery status from provider
  - `deliveredAt` (string, optional): ISO datetime
  - `error` (string, optional): Error message if failed

**Response** (200):
```json
{
  "success": true,
  "data": {
    "updated": 2,
    "failed": 0
  }
}
```

**Use Case**: Webhook processing, bulk status updates, delivery synchronization

---

## 🔔 Webhooks

### POST `/webhooks/mitto/dlr`

**Purpose**: Mitto delivery report webhook

**Description**: Receives delivery reports from Mitto SMS provider.

**Request**: Mitto webhook payload

**Response** (200):
```
OK
```

**Use Case**: Real-time delivery tracking, status updates, webhook processing

---

### POST `/webhooks/mitto/inbound`

**Purpose**: Mitto inbound message webhook

**Description**: Receives inbound SMS messages from Mitto.

**Request**: Mitto webhook payload

**Response** (200):
```
OK
```

**Use Case**: Inbound message handling, two-way messaging, customer replies

---

### POST `/webhooks/stripe`

**Purpose**: Stripe webhook handler

**Description**: Handles Stripe webhook events for payment processing.

**Request**: Stripe webhook payload

**Response** (200):
```
OK
```

**Use Case**: Payment processing, transaction updates, credit purchase completion

---

### POST `/automation-webhooks/shopify/orders/create`

**Purpose**: Shopify order created webhook

**Description**: Handles order creation events from Shopify to trigger automations.

**Request**: Shopify webhook payload

**Response** (200):
```
OK
```

**Use Case**: Order confirmation automation, post-purchase messaging, order tracking

---

### POST `/automation-webhooks/shopify/cart/abandoned`

**Purpose**: Shopify abandoned cart webhook

**Description**: Handles abandoned cart events from Shopify to trigger recovery automations.

**Request**: Shopify webhook payload

**Response** (200):
```
OK
```

**Use Case**: Abandoned cart recovery, cart abandonment automation, conversion optimization

---

### POST `/automation-webhooks/trigger`

**Purpose**: Manual automation trigger

**Description**: Manually triggers an automation for testing purposes.

**Request Body**:
```json
{
  "automationType": "birthday",
  "contactId": "contact_123",
  "additionalData": {
    "orderId": "order_456"
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "triggered": true,
    "automationId": "auto_123",
    "messageId": "msg_789"
  }
}
```

**Use Case**: Automation testing, manual triggers, debugging

---

## 🛒 Shopify Endpoints

### GET `/shopify/*`

**Purpose**: Shopify API proxy endpoints

**Description**: Various Shopify API integration endpoints for retrieving store data, products, orders, etc.

**Use Case**: Shopify data integration, store information, product management

---

## ❌ Error Handling

### Standard Error Response

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `STORE_NOT_FOUND` (401): Store context not found
- `VALIDATION_ERROR` (400): Request validation failed
- `NOT_FOUND` (404): Resource not found
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## 📝 Rate Limiting

### Rate Limits

- **General API**: 100 requests per minute per store
- **Campaign Send**: 5 campaigns per hour per store
- **Contact Import**: 10 imports per hour per store
- **Reports**: 50 requests per minute per store

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-12-20T10:31:00Z
```

---

## 🔒 Security

### Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### CORS

CORS is configured to allow:
- Shopify admin domains
- Configured frontend origins
- Development Cloudflare tunnels

---

**Documentation Version**: 2.0  
**Last Updated**: December 2024  
**Total Endpoints**: 61

