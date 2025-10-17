# Sendly Marketing Backend API Documentation

## Base URL
```
https://sendly-marketing-backend.onrender.com
```

## Authentication
All endpoints (except health checks and webhooks) require authentication via Shopify session tokens.

**Headers:**
```
Authorization: Bearer <session_token>
Content-Type: application/json
```

---

## Core System Endpoints

### Health Check
**GET** `/health`
- **Description:** Basic health check
- **Authentication:** None
- **Response:**
```json
{
  "ok": true,
  "t": 1703123456789
}
```

### Configuration Health Check
**GET** `/health/config`
- **Description:** Configuration and service status
- **Authentication:** None
- **Response:**
```json
{
  "ok": true,
  "shopify": {
    "configured": true,
    "apiVersion": "2023-10"
  },
  "redis": true,
  "mitto": {
    "base": "https://api.mitto.com",
    "hasKey": true
  }
}
```

### Full Health Check
**GET** `/health/full`
- **Description:** Comprehensive system health check
- **Authentication:** None
- **Response:**
```json
{
  "ok": true,
  "checks": {
    "db": { "status": "healthy", "responseTime": "5ms" },
    "redis": { "status": "healthy", "responseTime": "2ms" },
    "cache": { "status": "healthy" },
    "queue": { "status": "healthy", "responseTime": "10ms" },
    "mitto": { "status": "healthy", "responseTime": "150ms" },
    "shopify": { "configured": true }
  },
  "metrics": {
    "memory": { "rss": 45678912, "heapTotal": 12345678 },
    "cpu": { "user": 123456, "system": 78901 },
    "uptime": 3600,
    "nodeVersion": "v18.17.0",
    "platform": "linux"
  },
  "timestamp": "2023-12-21T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "responseTime": "200ms"
}
```

### User Information
**GET** `/whoami`
- **Description:** Get current shop information
- **Authentication:** Required
- **Response:**
```json
{
  "shop": "example-shop.myshopify.com"
}
```

### Metrics
**GET** `/metrics`
- **Description:** Application metrics
- **Authentication:** None
- **Query Parameters:**
  - `format` (optional): `json` or `prometheus`
- **Response:**
```json
{
  "requests": { "total": 1000, "successful": 950, "failed": 50 },
  "database": { "queries": 500, "avgResponseTime": "10ms" },
  "cache": { "hits": 800, "misses": 200, "hitRate": 0.8 }
}
```

---

## Dashboard Endpoints

### Dashboard Overview
**GET** `/dashboard/overview`
- **Description:** Main dashboard overview with comprehensive stats
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "sms": {
      "sent": 1500,
      "delivered": 1425,
      "failed": 75,
      "deliveryRate": 0.95
    },
    "contacts": {
      "total": 2500,
      "optedIn": 2000,
      "optedOut": 500
    },
    "wallet": {
      "balance": 5000,
      "currency": "EUR"
    },
    "recentMessages": [
      {
        "id": "msg_123",
        "phone": "+1234567890",
        "status": "delivered",
        "timestamp": "2023-12-21T10:30:00.000Z"
      }
    ],
    "recentTransactions": [
      {
        "id": "txn_456",
        "type": "purchase",
        "amount": 29.00,
        "credits": 1000,
        "timestamp": "2023-12-21T09:00:00.000Z"
      }
    ]
  }
}
```

### Quick Stats
**GET** `/dashboard/quick-stats`
- **Description:** Quick statistics for dashboard widgets
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "smsSent": 1500,
    "walletBalance": 5000
  }
}
```

---

## Contacts Management

### List Contacts
**GET** `/contacts`
- **Description:** List all contacts with pagination
- **Authentication:** Required
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `search` (optional): Search term
  - `status` (optional): Filter by status (`opted_in`, `opted_out`)
- **Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact_123",
        "phoneE164": "+1234567890",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "smsConsent": "opted_in",
        "createdAt": "2023-12-21T10:30:00.000Z",
        "updatedAt": "2023-12-21T10:30:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Get Contact
**GET** `/contacts/:id`
- **Description:** Get specific contact details
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "phoneE164": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "smsConsent": "opted_in",
    "gender": "male",
    "createdAt": "2023-12-21T10:30:00.000Z",
    "updatedAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Create Contact
**POST** `/contacts`
- **Description:** Create new contact
- **Authentication:** Required
- **Request Body:**
```json
{
  "phoneE164": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "smsConsent": "opted_in",
  "gender": "male"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "phoneE164": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "smsConsent": "opted_in",
    "createdAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Update Contact
**PUT** `/contacts/:id`
- **Description:** Update contact information
- **Authentication:** Required
- **Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "smsConsent": "opted_out"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "contact_123",
    "phoneE164": "+1234567890",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "smsConsent": "opted_out",
    "updatedAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Delete Contact
**DELETE** `/contacts/:id`
- **Description:** Delete contact
- **Authentication:** Required
- **Response:**
```json
{
  "success": true
}
```

### Import Contacts
**POST** `/contacts/import`
- **Description:** Import contacts from CSV
- **Authentication:** Required
- **Request:** Multipart form data with CSV file
- **Response:**
```json
{
  "success": true,
  "data": {
    "imported": 150,
    "failed": 5,
    "errors": [
      {
        "row": 10,
        "error": "Invalid phone number format"
      }
    ]
  }
}
```

### Contact Statistics
**GET** `/contacts/stats/summary`
- **Description:** Get contact statistics summary
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "total": 2500,
    "optedIn": 2000,
    "optedOut": 500,
    "growth": {
      "thisMonth": 150,
      "lastMonth": 120,
      "percentage": 25.0
    }
  }
}
```

---

## Campaigns Management

### List Campaigns
**GET** `/campaigns`
- **Description:** List all campaigns
- **Authentication:** Required
- **Query Parameters:**
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `status` (optional): Filter by status (`draft`, `scheduled`, `sending`, `sent`, `failed`)
- **Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign_123",
        "name": "Black Friday Sale",
        "message": "Get 50% off everything! Use code BLACK50",
        "audience": "all",
        "status": "sent",
        "scheduleType": "immediate",
        "scheduleAt": null,
        "createdAt": "2023-12-21T10:30:00.000Z",
        "updatedAt": "2023-12-21T10:30:00.000Z"
      }
    ],
    "total": 25
  }
}
```

### Get Campaign
**GET** `/campaigns/:id`
- **Description:** Get specific campaign with recipients and metrics
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Black Friday Sale",
    "message": "Get 50% off everything! Use code BLACK50",
    "audience": "all",
    "status": "sent",
    "scheduleType": "immediate",
    "scheduleAt": null,
    "recipients": [
      {
        "id": "recipient_456",
        "contactId": "contact_123",
        "phoneE164": "+1234567890",
        "status": "delivered"
      }
    ],
    "metrics": {
      "sent": 1000,
      "delivered": 950,
      "failed": 50,
      "deliveryRate": 0.95
    },
    "createdAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Create Campaign
**POST** `/campaigns`
- **Description:** Create new campaign
- **Authentication:** Required
- **Request Body:**
```json
{
  "name": "Black Friday Sale",
  "message": "Get 50% off everything! Use code BLACK50",
  "audience": "all",
  "discountId": "discount_123",
  "scheduleType": "immediate",
  "scheduleAt": null,
  "recurringDays": null
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Black Friday Sale",
    "message": "Get 50% off everything! Use code BLACK50",
    "audience": "all",
    "status": "draft",
    "scheduleType": "immediate",
    "createdAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Update Campaign
**PUT** `/campaigns/:id`
- **Description:** Update campaign
- **Authentication:** Required
- **Request Body:**
```json
{
  "name": "Updated Campaign Name",
  "message": "Updated message content",
  "audience": "men",
  "scheduleType": "scheduled",
  "scheduleAt": "2023-12-25T10:00:00.000Z"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "name": "Updated Campaign Name",
    "message": "Updated message content",
    "audience": "men",
    "scheduleType": "scheduled",
    "scheduleAt": "2023-12-25T10:00:00.000Z",
    "updatedAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Delete Campaign
**DELETE** `/campaigns/:id`
- **Description:** Delete campaign
- **Authentication:** Required
- **Response:**
```json
{
  "success": true
}
```

### Prepare Campaign
**POST** `/campaigns/:id/prepare`
- **Description:** Prepare campaign for sending (validate recipients, check costs)
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "prepared": true,
    "recipientCount": 1000,
    "estimatedCost": 10.00,
    "walletBalance": 5000
  }
}
```

### Send Campaign
**POST** `/campaigns/:id/send`
- **Description:** Send campaign immediately
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "queued": true,
    "recipients": 1000
  }
}
```

### Schedule Campaign
**PUT** `/campaigns/:id/schedule`
- **Description:** Schedule campaign for later sending
- **Authentication:** Required
- **Request Body:**
```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2023-12-25T10:00:00.000Z"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "scheduled": true,
    "campaign": {
      "id": "campaign_123",
      "status": "scheduled",
      "scheduleAt": "2023-12-25T10:00:00.000Z"
    }
  }
}
```

### Campaign Metrics
**GET** `/campaigns/:id/metrics`
- **Description:** Get campaign performance metrics
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "sent": 1000,
    "delivered": 950,
    "failed": 50,
    "deliveryRate": 0.95,
    "clickRate": 0.05,
    "conversionRate": 0.02,
    "revenue": 500.00
  }
}
```

### Campaign Statistics
**GET** `/campaigns/stats/summary`
- **Description:** Get overall campaign statistics
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "count": 25,
    "totalSent": 50000,
    "totalDelivered": 47500,
    "avgDeliveryRate": 0.95
  }
}
```

---

## Reports & Analytics

### Reports Overview
**GET** `/reports/overview`
- **Description:** Comprehensive reports overview
- **Authentication:** Required
- **Query Parameters:**
  - `from` (optional): Start date (ISO 8601)
  - `to` (optional): End date (ISO 8601)
  - `window` (optional): Time window (`7d`, `30d`, `90d`)
- **Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCampaigns": 25,
      "totalContacts": 2500,
      "totalSmsSent": 50000,
      "deliveryRate": 0.95
    },
    "campaignAttribution": {
      "direct": 0.6,
      "referral": 0.3,
      "organic": 0.1
    },
    "automationAttribution": {
      "welcome": 0.4,
      "abandoned": 0.35,
      "birthday": 0.25
    },
    "messagingTimeseries": [
      {
        "date": "2023-12-21",
        "sent": 1000,
        "delivered": 950,
        "failed": 50
      }
    ],
    "walletStats": {
      "balance": 5000,
      "totalUsed": 10000,
      "totalBought": 15000
    },
    "recentCampaigns": [
      {
        "id": "campaign_123",
        "name": "Black Friday Sale",
        "sent": 1000,
        "delivered": 950,
        "revenue": 500.00
      }
    ],
    "topPerformingCampaigns": [
      {
        "id": "campaign_456",
        "name": "Holiday Special",
        "deliveryRate": 0.98,
        "conversionRate": 0.05,
        "revenue": 1000.00
      }
    ],
    "dateRange": {
      "from": "2023-11-21T00:00:00.000Z",
      "to": "2023-12-21T23:59:59.999Z",
      "window": "30d"
    }
  }
}
```

### Campaign Reports
**GET** `/reports/campaigns`
- **Description:** Detailed campaign reports
- **Authentication:** Required
- **Query Parameters:**
  - `from`, `to`, `page`, `limit`
- **Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign_123",
        "name": "Black Friday Sale",
        "sent": 1000,
        "delivered": 950,
        "failed": 50,
        "deliveryRate": 0.95,
        "revenue": 500.00
      }
    ],
    "totalCount": 25,
    "campaignStats": {
      "totalSent": 50000,
      "totalDelivered": 47500,
      "totalFailed": 2500,
      "avgDeliveryRate": 0.95
    },
    "revenueByCampaign": [
      {
        "campaignId": "campaign_123",
        "revenue": 500.00,
        "attribution": 0.6
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 25,
      "hasMore": false
    },
    "dateRange": {
      "from": "2023-11-21T00:00:00.000Z",
      "to": "2023-12-21T23:59:59.999Z"
    }
  }
}
```

### Specific Campaign Report
**GET** `/reports/campaigns/:id`
- **Description:** Detailed report for specific campaign
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "campaign_123",
      "name": "Black Friday Sale",
      "message": "Get 50% off everything!",
      "status": "sent",
      "createdAt": "2023-12-21T10:30:00.000Z"
    },
    "analytics": {
      "sent": 1000,
      "delivered": 950,
      "failed": 50,
      "deliveryRate": 0.95
    },
    "recipientAnalytics": {
      "total": 1000,
      "optedIn": 950,
      "optedOut": 50
    },
    "timeseries": [
      {
        "date": "2023-12-21",
        "sent": 1000,
        "delivered": 950,
        "failed": 50
      }
    ],
    "revenue": {
      "total": 500.00,
      "attributed": 300.00
    }
  }
}
```

### Automation Reports
**GET** `/reports/automations`
- **Description:** Automation performance reports
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "automations": [
      {
        "type": "welcome",
        "triggered": 500,
        "completed": 450,
        "completionRate": 0.9
      }
    ],
    "totalCount": 3,
    "performance": {
      "totalTriggered": 1500,
      "totalCompleted": 1350,
      "completionRate": 0.9
    },
    "timeseries": [
      {
        "date": "2023-12-21",
        "triggered": 100,
        "completed": 90
      }
    ]
  }
}
```

### Messaging Reports
**GET** `/reports/messaging`
- **Description:** Messaging activity reports
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalMessages": 50000,
    "byDirection": {
      "inbound": 5000,
      "outbound": 45000
    },
    "byStatus": {
      "sent": 45000,
      "delivered": 42750,
      "failed": 2250
    },
    "timeseries": [
      {
        "date": "2023-12-21",
        "sent": 1000,
        "delivered": 950,
        "failed": 50
      }
    ]
  }
}
```

### Revenue Reports
**GET** `/reports/revenue`
- **Description:** Revenue and attribution reports
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 10000.00,
    "bySource": {
      "campaigns": 8000.00,
      "automations": 2000.00
    },
    "timeseries": [
      {
        "date": "2023-12-21",
        "revenue": 500.00,
        "campaigns": 400.00,
        "automations": 100.00
      }
    ],
    "attribution": {
      "direct": 0.6,
      "referral": 0.4
    }
  }
}
```

### Export Data
**GET** `/reports/export`
- **Description:** Export reports data
- **Authentication:** Required
- **Query Parameters:**
  - `format` (optional): Export format (`csv`, `json`, `xlsx`)
  - `type` (optional): Report type (`overview`, `campaigns`, `revenue`)
- **Response:**
```json
{
  "success": true,
  "data": {
    "exportUrl": "https://exports.example.com/report_123.csv",
    "expiresAt": "2023-12-22T10:30:00.000Z",
    "format": "csv",
    "reportType": "overview"
  }
}
```

---

## Templates Management

### List Templates
**GET** `/templates`
- **Description:** List all available templates
- **Authentication:** Required
- **Query Parameters:**
  - `page`, `limit`, `category`, `trigger`, `search`
- **Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_123",
        "name": "Welcome Message",
        "category": "onboarding",
        "trigger": "signup",
        "content": "Welcome to our store! Get 10% off your first order with code WELCOME10",
        "usageCount": 150,
        "performance": 0.85
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "categories": ["onboarding", "promotional", "abandoned_cart"],
      "triggers": ["signup", "purchase", "abandoned_cart"]
    }
  }
}
```

### Get Template
**GET** `/templates/:id`
- **Description:** Get specific template details
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "template_123",
    "name": "Welcome Message",
    "category": "onboarding",
    "trigger": "signup",
    "content": "Welcome to our store! Get 10% off your first order with code WELCOME10",
    "metrics": {
      "usageCount": 150,
      "lastUsed": "2023-12-21T10:30:00.000Z",
      "performance": 0.85
    }
  }
}
```

### Template Categories
**GET** `/templates/categories`
- **Description:** Get available template categories
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "onboarding",
        "name": "Onboarding",
        "count": 25
      },
      {
        "id": "promotional",
        "name": "Promotional",
        "count": 40
      }
    ]
  }
}
```

### Template Triggers
**GET** `/templates/triggers`
- **Description:** Get available template triggers
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "triggers": [
      {
        "id": "signup",
        "name": "User Signup",
        "count": 15
      },
      {
        "id": "purchase",
        "name": "Purchase Complete",
        "count": 20
      }
    ]
  }
}
```

### Popular Templates
**GET** `/templates/popular`
- **Description:** Get most popular templates
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_123",
        "name": "Welcome Message",
        "usageCount": 150,
        "performance": 0.85
      }
    ]
  }
}
```

### Template Statistics
**GET** `/templates/stats`
- **Description:** Get template usage statistics
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTemplates": 100,
      "totalUsage": 5000,
      "avgPerformance": 0.75
    },
    "categoryStats": [
      {
        "category": "onboarding",
        "count": 25,
        "usage": 1500,
        "avgPerformance": 0.8
      }
    ],
    "triggerStats": [
      {
        "trigger": "signup",
        "count": 15,
        "usage": 800,
        "avgPerformance": 0.85
      }
    ]
  }
}
```

### Use Template
**POST** `/templates/:id/use`
- **Description:** Use a template for a campaign
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "message": "Template usage recorded"
}
```

### Preview Template
**POST** `/templates/preview`
- **Description:** Preview template with sample data
- **Authentication:** Required
- **Request Body:**
```json
{
  "templateId": "template_123",
  "sampleData": {
    "customerName": "John Doe",
    "discountCode": "WELCOME10"
  }
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "renderedBody": "Welcome John Doe! Get 10% off your first order with code WELCOME10",
    "sampleData": {
      "customerName": "John Doe",
      "discountCode": "WELCOME10"
    }
  }
}
```

---

## Automations Management

### List Automations
**GET** `/automations`
- **Description:** List all automations
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "automations": [
      {
        "type": "welcome",
        "name": "Welcome Series",
        "enabled": true,
        "trigger": "signup",
        "message": "Welcome to our store!"
      }
    ]
  }
}
```

### Get Automation
**GET** `/automations/:type`
- **Description:** Get specific automation configuration
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "type": "welcome",
    "name": "Welcome Series",
    "enabled": true,
    "trigger": "signup",
    "message": "Welcome to our store!",
    "schedule": {
      "delay": 0,
      "timeUnit": "minutes"
    },
    "conditions": {
      "minOrderValue": 0,
      "customerSegment": "all"
    }
  }
}
```

### Update Automation
**PATCH** `/automations/:type`
- **Description:** Update automation configuration
- **Authentication:** Required
- **Request Body:**
```json
{
  "enabled": true,
  "message": "Updated welcome message!",
  "schedule": {
    "delay": 5,
    "timeUnit": "minutes"
  }
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "updated": true
  }
}
```

### Reset Automation
**POST** `/automations/:type/reset`
- **Description:** Reset automation to default settings
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "reset": true
  }
}
```

### Automation Statistics
**GET** `/automations/stats/summary`
- **Description:** Get automation performance statistics
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalAutomations": 5,
    "activeAutomations": 3,
    "totalTriggered": 1500,
    "totalCompleted": 1350,
    "completionRate": 0.9,
    "byType": {
      "welcome": { "triggered": 500, "completed": 450 },
      "abandoned_cart": { "triggered": 300, "completed": 270 }
    }
  }
}
```

### Preview Automation
**POST** `/automations/preview`
- **Description:** Preview automation with sample data
- **Authentication:** Required
- **Request Body:**
```json
{
  "type": "welcome",
  "sampleData": {
    "customerName": "John Doe",
    "orderValue": 100.00
  }
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "renderedBody": "Welcome John Doe! Thanks for your $100.00 order!",
    "sampleData": {
      "customerName": "John Doe",
      "orderValue": 100.00
    }
  }
}
```

---

## Billing & Wallet Management

### List Packages
**GET** `/billing/packages`
- **Description:** List available SMS packages
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "package_123",
        "name": "Starter 1k",
        "credits": 1000,
        "priceCents": 2900,
        "currency": "EUR",
        "active": true
      },
      {
        "id": "package_456",
        "name": "Growth 5k",
        "credits": 5000,
        "priceCents": 12900,
        "currency": "EUR",
        "active": true
      }
    ]
  }
}
```

### Seed Packages (Development Only)
**POST** `/billing/packages/seed`
- **Description:** Seed default packages (development only)
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "message": "seeded"
}
```

### Purchase Package
**POST** `/billing/purchase/:packageId`
- **Description:** Purchase SMS package
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "balance": 5000,
    "credits": 1000,
    "currency": "EUR"
  }
}
```

### Get Balance
**GET** `/billing/balance`
- **Description:** Get current wallet balance
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "balance": 5000,
    "credits": 1000,
    "currency": "EUR",
    "lastUpdated": "2023-12-21T10:30:00.000Z"
  }
}
```

### Get Transactions
**GET** `/billing/transactions`
- **Description:** Get transaction history
- **Authentication:** Required
- **Query Parameters:**
  - `page`, `limit`, `type` (optional): Transaction type
- **Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "type": "purchase",
        "amount": 29.00,
        "credits": 1000,
        "currency": "EUR",
        "status": "completed",
        "createdAt": "2023-12-21T10:30:00.000Z"
      },
      {
        "id": "txn_456",
        "type": "usage",
        "amount": -5.00,
        "credits": -100,
        "currency": "EUR",
        "status": "completed",
        "createdAt": "2023-12-21T09:00:00.000Z"
      }
    ]
  }
}
```

---

## Discounts Management

### List Discounts
**GET** `/discounts`
- **Description:** List all discounts
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "id": "discount_123",
        "code": "WELCOME10",
        "type": "percentage",
        "value": 10,
        "active": true,
        "usageLimit": 100,
        "usedCount": 25
      }
    ]
  }
}
```

### Get Discount
**GET** `/discounts/:id`
- **Description:** Get specific discount
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "discount_123",
    "code": "WELCOME10",
    "type": "percentage",
    "value": 10,
    "active": true,
    "usageLimit": 100,
    "usedCount": 25,
    "createdAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Create Discount
**POST** `/discounts`
- **Description:** Create new discount
- **Authentication:** Required
- **Request Body:**
```json
{
  "code": "BLACK50",
  "type": "percentage",
  "value": 50,
  "usageLimit": 1000,
  "expiresAt": "2023-12-31T23:59:59.000Z"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "discount_123",
    "code": "BLACK50",
    "type": "percentage",
    "value": 50,
    "active": true,
    "usageLimit": 1000,
    "usedCount": 0,
    "createdAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Update Discount
**PUT** `/discounts/:id`
- **Description:** Update discount
- **Authentication:** Required
- **Request Body:**
```json
{
  "active": false,
  "usageLimit": 500
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "discount_123",
    "code": "BLACK50",
    "active": false,
    "usageLimit": 500,
    "updatedAt": "2023-12-21T10:30:00.000Z"
  }
}
```

### Delete Discount
**DELETE** `/discounts/:id`
- **Description:** Delete discount
- **Authentication:** Required
- **Response:**
```json
{
  "success": true
}
```

### Discount Statistics
**GET** `/discounts/stats/summary`
- **Description:** Get discount usage statistics
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "data": {
    "totalDiscounts": 10,
    "activeDiscounts": 7,
    "totalUsage": 500,
    "totalSavings": 2500.00,
    "topDiscounts": [
      {
        "code": "WELCOME10",
        "usage": 100,
        "savings": 500.00
      }
    ]
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Invalid request data",
  "details": {
    "field": "phoneE164",
    "reason": "Invalid phone number format"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "unauthorized",
  "message": "Invalid or missing session token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "not_found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "internal_error",
  "message": "Internal server error"
}
```

---

## Rate Limiting

The API implements rate limiting on various endpoints:

- **Reports Overview:** 10 requests per minute
- **Reports General:** 30 requests per minute  
- **Reports Export:** 5 requests per hour
- **Templates List:** 60 requests per minute
- **Templates Get:** 100 requests per minute
- **Templates Stats:** 20 requests per minute
- **Templates Use:** 30 requests per minute
- **Templates Preview:** 50 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1703124000
```

---

## API Versioning

The API supports versioning through headers:
```
API-Version: v1
```

Backward compatibility is maintained for at least one major version.

---

## Webhooks

### App Uninstall Webhook
**POST** `/webhooks/app_uninstalled`
- **Description:** Shopify webhook for app uninstallation
- **Authentication:** Shopify HMAC validation
- **Request Body:** Shopify webhook payload
- **Response:** `200 OK`

---

## Development Documentation

### Swagger UI (Development Only)
**GET** `/docs`
- **Description:** Interactive API documentation
- **Authentication:** None (development only)
- **Access:** Only available in non-production environments
