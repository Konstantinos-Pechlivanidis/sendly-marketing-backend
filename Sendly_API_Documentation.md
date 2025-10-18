# Sendly Marketing Backend API Documentation

## Overview

The Sendly Marketing Backend provides a comprehensive SMS marketing platform for Shopify stores with multi-tenant support, automated campaigns, template management, and detailed analytics. This documentation covers all API endpoints organized by functional areas.

## Base URLs

- **Production**: `https://sendly-marketing-backend.onrender.com`
- **Development**: `http://localhost:3000`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Multi-Store Support

All endpoints are automatically scoped to the current store context. The `storeId` is resolved from the authentication token and cannot be overridden by client requests.

---

## 📊 Dashboard Page

### Purpose
The Dashboard provides store owners with a comprehensive overview of their SMS marketing performance, key metrics, and recent activity.

### Frontend Behavior
The dashboard displays:
- **Key Metrics Cards**: Total contacts, campaigns, automations, credits remaining
- **Performance Charts**: Message delivery rates, engagement trends
- **Recent Activity Feed**: Latest campaign sends, automation triggers, credit purchases
- **Quick Actions**: Create campaign, view reports, manage settings

### Backend Endpoints

#### GET /api/dashboard/overview
Returns comprehensive dashboard data including metrics and recent activity.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalContacts": 1250,
    "totalCampaigns": 45,
    "totalAutomations": 4,
    "creditsRemaining": 8500,
    "messagesSent": 3200,
    "deliveryRate": 96.5,
    "recentActivity": [
      {
        "type": "campaign",
        "message": "Back to School campaign sent to 500 contacts",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### GET /api/dashboard/quick-stats
Returns quick statistics for dashboard widgets.

**Response:**
```json
{
  "success": true,
  "data": {
    "todayMessages": 45,
    "weekMessages": 320,
    "monthMessages": 1200,
    "activeAutomations": 3,
    "creditUsage": {
      "today": 45,
      "week": 320,
      "month": 1200
    }
  }
}
```

---

## 👥 Contacts Page

### Purpose
The Contacts page allows store owners to manage their customer database with advanced filtering, search capabilities, and bulk operations.

### Frontend Behavior
The contacts page displays:
- **Contacts Table**: Paginated list with columns for name, phone, email, gender, birthdate, consent status
- **Search Bar**: Real-time search across name, email, and phone
- **Filter Controls**: Gender filter (All/Male/Female), consent filter (All/Consented/Non-consented)
- **Bulk Actions**: Import CSV, export contacts, bulk update consent
- **Contact Modal**: Create/edit contact details with validation

### Backend Endpoints

#### GET /api/contacts
List contacts with filtering, search, and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 20, max: 100)
- `filter` (string): Filter type - `all`, `male`, `female`, `consented`, `nonconsented`
- `q` (string): Search term for name, email, or phone
- `sortBy` (string): Sort field - `createdAt`, `firstName`, `lastName`, `phone`
- `sortOrder` (string): Sort direction - `asc`, `desc`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cnt_01HRTD...",
      "firstName": "Maria",
      "lastName": "Papadopoulos",
      "phone": "+306977123456",
      "email": "maria@example.com",
      "gender": "female",
      "birthDate": "1990-06-15T00:00:00Z",
      "smsConsent": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
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

#### GET /api/contacts/:id
Get a single contact by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cnt_01HRTD...",
    "firstName": "Maria",
    "lastName": "Papadopoulos",
    "phone": "+306977123456",
    "email": "maria@example.com",
    "gender": "female",
    "birthDate": "1990-06-15T00:00:00Z",
    "smsConsent": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/contacts
Create a new contact.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+306977123456",
  "email": "john@example.com",
  "gender": "male",
  "birthDate": "1985-03-15T00:00:00Z",
  "smsConsent": true
}
```

**Validation Rules:**
- `phone`: Required, E.164 format (e.g., +306977123456)
- `firstName`, `lastName`: Optional strings
- `email`: Optional, valid email format
- `gender`: Optional, must be `male`, `female`, or `other`
- `birthDate`: Optional, valid ISO date, cannot be future
- `smsConsent`: Boolean, defaults to `false`

#### PUT /api/contacts/:id
Update contact information.

**Request Body:**
```json
{
  "firstName": "John Updated",
  "lastName": "Doe",
  "email": "john.updated@example.com",
  "gender": "male",
  "birthDate": "1985-03-15T00:00:00Z",
  "smsConsent": true
}
```

#### DELETE /api/contacts/:id
Delete a contact (soft delete).

#### GET /api/contacts/stats
Get contact statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalContacts": 1250,
    "consentedContacts": 980,
    "maleContacts": 520,
    "femaleContacts": 680,
    "contactsWithBirthday": 450,
    "newThisMonth": 120
  }
}
```

#### GET /api/contacts/birthdays
Get contacts with birthdays today (for automation triggers).

#### POST /api/contacts/import
Import contacts from CSV file.

**Request:** Multipart form data with CSV file.

---

## 📢 Campaigns Page

### Purpose
The Campaigns page enables store owners to create, manage, and track SMS marketing campaigns with scheduling, audience targeting, and performance analytics.

### Frontend Behavior
The campaigns page displays:
- **Campaigns List**: Table showing campaign name, status, recipients, delivery rate, created date
- **Create Campaign Modal**: Form with message composer, audience selector, discount picker, scheduling options
- **Campaign Details**: Individual campaign view with metrics, recipient list, delivery status
- **Bulk Actions**: Schedule multiple campaigns, duplicate campaigns
- **Performance Charts**: Delivery rates, engagement metrics, ROI analysis

### Backend Endpoints

#### GET /api/campaigns
List campaigns with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number
- `pageSize` (number): Items per page
- `status` (string): Filter by status - `all`, `draft`, `scheduled`, `sending`, `sent`, `failed`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmp_01HRTD...",
      "name": "Back to School Campaign",
      "status": "sent",
      "message": "Get 20% off on all school supplies!",
      "recipientCount": 500,
      "deliveryRate": 96.5,
      "createdAt": "2024-01-15T10:00:00Z",
      "sentAt": "2024-01-15T10:30:00Z"
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

#### GET /api/campaigns/:id
Get campaign details with metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmp_01HRTD...",
    "name": "Back to School Campaign",
    "message": "Get 20% off on all school supplies! Use code SCHOOL20.",
    "status": "sent",
    "recipientCount": 500,
    "deliveryRate": 96.5,
    "clickRate": 12.3,
    "createdAt": "2024-01-15T10:00:00Z",
    "sentAt": "2024-01-15T10:30:00Z",
    "metrics": {
      "delivered": 483,
      "failed": 17,
      "pending": 0,
      "clicked": 59
    }
  }
}
```

#### POST /api/campaigns
Create a new campaign.

**Request Body:**
```json
{
  "name": "Back to School Campaign",
  "message": "Get 20% off on all school supplies! Use code SCHOOL20. Valid until end of month.",
  "audienceId": "aud_all_consented",
  "discountId": "disc_123",
  "scheduleType": "immediate"
}
```

**Validation Rules:**
- `name`: Required, string, min 1 character
- `message`: Required, string, min 1 character, max 160 characters
- `audienceId`: Required, valid audience ID
- `discountId`: Optional, valid Shopify discount ID
- `scheduleType`: Required, must be `immediate`, `scheduled`, or `recurring`

#### PUT /api/campaigns/:id
Update campaign details.

#### DELETE /api/campaigns/:id
Delete a campaign.

#### POST /api/campaigns/:id/prepare
Prepare campaign for sending (validate recipients, check credits).

#### POST /api/campaigns/:id/send
Send campaign immediately.

**Credit Validation:** Automatically checks and deducts credits before sending.

#### PUT /api/campaigns/:id/schedule
Schedule campaign for future sending.

**Request Body:**
```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2024-02-01T10:00:00Z"
}
```

#### GET /api/campaigns/:id/metrics
Get detailed campaign metrics.

#### GET /api/campaigns/stats/summary
Get campaign statistics summary.

---

## 🤖 Automations Page

### Purpose
The Automations page allows store owners to configure and manage automated SMS triggers based on customer behavior and events.

### Frontend Behavior
The automations page displays:
- **Automation Cards**: Each automation shows title, description, status (active/inactive), trigger event
- **Toggle Switches**: Enable/disable automations
- **Message Editor**: Customize SMS content for each automation
- **Trigger Settings**: Configure timing and conditions
- **Performance Metrics**: Shows how many times each automation has been triggered

### Backend Endpoints

#### GET /api/automations
Get all automations for the current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_auto_01HRTD...",
      "automationId": "system_auto_01HRTD...",
      "title": "Abandoned Cart Reminder",
      "description": "Reminds customers about items left in their cart",
      "triggerEvent": "cart_abandoned",
      "defaultMessage": "Το καλάθι σου σε περιμένει! Ολοκλήρωσε την αγορά σου πριν εξαντληθεί.",
      "userMessage": null,
      "isActive": true,
      "isSystemDefault": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### PUT /api/automations/:id
Update user automation (message content or active status).

**Request Body:**
```json
{
  "userMessage": "Your cart is waiting! Complete your purchase before items run out. Use code CART10 for 10% off!",
  "isActive": true
}
```

#### GET /api/automations/stats
Get automation performance statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTriggers": 1250,
    "activeAutomations": 3,
    "automationBreakdown": [
      {
        "automationId": "abandoned_cart",
        "title": "Abandoned Cart Reminder",
        "triggers": 450,
        "deliveryRate": 94.2
      }
    ]
  }
}
```

### Default Automations

1. **Abandoned Cart Reminder**
   - Trigger: `cart_abandoned`
   - Default Message: "Το καλάθι σου σε περιμένει! Ολοκλήρωσε την αγορά σου πριν εξαντληθεί."

2. **Order Confirmation**
   - Trigger: `order_placed`
   - Default Message: "Ευχαριστούμε για την παραγγελία σου! Θα ενημερωθείς σύντομα για την αποστολή."

3. **Customer Re-engagement**
   - Trigger: `customer_inactive`
   - Default Message: "Μας έχεις λείψει! Έλα πάλι στο κατάστημα και πάρε έκπτωση 10% για λίγες μέρες."

4. **Birthday Offer**
   - Trigger: `birthday`
   - Default Message: "Χρόνια πολλά! Απόλαυσε ένα δωράκι από εμάς με τον κωδικό BDAY10 🎁."

---

## 📝 Templates Page

### Purpose
The Templates page provides store owners with ready-made SMS templates organized by category for inspiration and quick campaign creation.

### Frontend Behavior
The templates page displays:
- **Template Grid**: Cards showing template title, category, preview, and usage stats
- **Category Filters**: Filter by promotional, abandoned cart, holiday offers, customer service
- **Search Bar**: Search templates by title or content
- **Template Preview**: Modal showing full template content and usage examples
- **Usage Tracking**: Shows how many times each template has been used

### Backend Endpoints

#### GET /api/templates
Get all public templates with filtering.

**Query Parameters:**
- `category` (string): Filter by category - `all`, `promotional`, `abandoned_cart`, `holiday_offers`, `customer_service`
- `page` (number): Page number
- `pageSize` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tpl_01HRTD...",
      "title": "Back to School Sale",
      "category": "promotional",
      "content": "Get 20% off on all school supplies! Use code SCHOOL20. Valid until end of month.",
      "previewImage": "https://example.com/preview.jpg",
      "tags": ["education", "sale", "back-to-school"],
      "isPublic": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### GET /api/templates/:id
Get a single template for preview.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tpl_01HRTD...",
    "title": "Back to School Sale",
    "category": "promotional",
    "content": "Get 20% off on all school supplies! Use code SCHOOL20. Valid until end of month.",
    "previewImage": "https://example.com/preview.jpg",
    "tags": ["education", "sale", "back-to-school"],
    "isPublic": true,
    "usageCount": 25,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/templates/categories
Get all available template categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "promotional",
      "name": "Promotional",
      "description": "Sales and promotional messages",
      "templateCount": 15
    },
    {
      "id": "abandoned_cart",
      "name": "Abandoned Cart",
      "description": "Cart recovery messages",
      "templateCount": 8
    }
  ]
}
```

#### POST /api/templates/:id/track
Track template usage (called when template is used in a campaign).

---

## 📈 Reports Page

### Purpose
The Reports page provides comprehensive analytics and insights into SMS marketing performance, credit usage, and customer engagement.

### Frontend Behavior
The reports page displays:
- **KPI Dashboard**: Key metrics cards with trend indicators
- **Performance Charts**: Campaign performance, automation insights, credit usage trends
- **Export Options**: CSV/PDF export for detailed reports
- **Date Range Filters**: Custom date range selection
- **Drill-down Capabilities**: Click through to detailed campaign/automation reports

### Backend Endpoints

#### GET /api/reports/overview
Get comprehensive reports overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMessages": 5600,
      "delivered": 5230,
      "failed": 370,
      "conversionRate": 9.2,
      "creditsUsed": 5600
    },
    "trends": {
      "dailyMessages": [
        {"date": "2024-01-01", "messages": 320},
        {"date": "2024-01-02", "messages": 410}
      ]
    },
    "topPerformers": [
      {
        "campaign": "Back to School",
        "sent": 500,
        "delivered": 480,
        "rate": 96.0
      }
    ]
  }
}
```

#### GET /api/reports/kpis
Get key performance indicators.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": {
      "total": 45,
      "active": 3,
      "deliveryRate": 96.5
    },
    "contacts": {
      "total": 1250,
      "consented": 980,
      "growthRate": 12.5
    },
    "automations": {
      "total": 4,
      "active": 3,
      "triggers": 1250
    },
    "credits": {
      "remaining": 8500,
      "used": 1500,
      "averagePerCampaign": 33.3
    }
  }
}
```

#### GET /api/reports/campaigns
Get campaign performance metrics.

**Query Parameters:**
- `from` (string): Start date (YYYY-MM-DD)
- `to` (string): End date (YYYY-MM-DD)
- `type` (string): Campaign type - `all`, `manual`, `automation`

#### GET /api/reports/campaigns/:id
Get detailed campaign report.

#### GET /api/reports/automations
Get automation insights and performance.

#### GET /api/reports/credits
Get credit usage and spending analytics.

#### GET /api/reports/contacts
Get contact insights and engagement metrics.

#### GET /api/reports/export
Export report data in CSV or PDF format.

**Query Parameters:**
- `type` (string): Report type - `campaigns`, `automations`, `credits`, `contacts`
- `format` (string): Export format - `csv`, `pdf`
- `from` (string): Start date
- `to` (string): End date

---

## 💰 Billing & Settings Page

### Purpose
The Billing & Settings page allows store owners to manage their account configuration, SMS credits, and payment information.

### Frontend Behavior
The settings page displays:
- **Account Information**: Store details, plan information, account creation date
- **Sender Number Management**: Input field for custom sender number with validation
- **Credit Balance**: Current balance with usage history
- **Credit Packages**: Available packages with pricing and Stripe checkout
- **Usage Guide**: Help documentation and support links
- **Billing History**: Transaction history with download receipts

### Backend Endpoints

#### GET /api/settings
Get current user settings and account information.

**Response:**
```json
{
  "success": true,
  "data": {
    "senderNumber": "+306977123456",
    "credits": 8500,
    "accountInfo": {
      "storeDomain": "example-shop.myshopify.com",
      "plan": "premium",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "usageGuide": {
      "title": "How to Use Sendly Marketing",
      "content": "Sendly helps you engage customers through SMS marketing...",
      "supportUrl": "https://sendly.com/support"
    }
  }
}
```

#### GET /api/settings/account
Get detailed account information.

#### PUT /api/settings/sender
Update sender number.

**Request Body:**
```json
{
  "senderNumber": "+306977123456"
}
```

**Validation Rules:**
- Phone numbers: E.164 format (e.g., +306977123456)
- Alphanumeric senders: 3-11 characters, letters and numbers only

#### GET /api/billing/balance
Get current SMS credit balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "credits": 8500,
    "canSend": true,
    "storeDomain": "example-shop.myshopify.com"
  }
}
```

#### GET /api/billing/packages
Get available credit packages.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1000_sms",
      "name": "1,000 SMS Credits",
      "credits": 1000,
      "price": 29.99,
      "currency": "EUR",
      "stripePriceId": "price_1234567890"
    },
    {
      "id": "5000_sms",
      "name": "5,000 SMS Credits",
      "credits": 5000,
      "price": 129.99,
      "currency": "EUR",
      "stripePriceId": "price_0987654321"
    }
  ]
}
```

#### GET /api/billing/history
Get billing transaction history.

**Query Parameters:**
- `page` (number): Page number
- `pageSize` (number): Items per page

#### POST /api/billing/purchase
Create Stripe checkout session for credit purchase.

**Request Body:**
```json
{
  "packageType": "1000_sms",
  "successUrl": "https://your-app.com/success",
  "cancelUrl": "https://your-app.com/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_1234567890",
    "sessionId": "cs_1234567890"
  }
}
```

---

## 🔗 Webhooks

### Purpose
Webhooks handle external integrations and automation triggers from Shopify and payment processors.

### Stripe Webhook

#### POST /webhooks/stripe
Handle Stripe payment confirmations and add credits to user accounts.

**Headers:**
- `Stripe-Signature`: Stripe webhook signature for verification

**Request Body:**
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_1234567890",
      "payment_status": "paid",
      "metadata": {
        "storeId": "store_123",
        "packageType": "1000_sms"
      }
    }
  }
}
```

### Automation Webhooks

#### POST /api/automation-webhooks/cart-abandoned
Trigger abandoned cart automation.

**Request Body:**
```json
{
  "event": "cart_abandoned",
  "storeId": "store_123",
  "contactId": "contact_123",
  "cartData": {
    "items": [
      {
        "productId": "prod_123",
        "title": "Sample Product",
        "price": 29.99,
        "quantity": 2
      }
    ],
    "total": 59.98,
    "abandonedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### POST /api/automation-webhooks/order-placed
Trigger order confirmation automation.

**Request Body:**
```json
{
  "event": "order_placed",
  "storeId": "store_123",
  "contactId": "contact_123",
  "orderData": {
    "orderId": "order_123",
    "total": 99.99,
    "currency": "EUR",
    "items": [
      {
        "productId": "prod_123",
        "title": "Sample Product",
        "price": 99.99,
        "quantity": 1
      }
    ],
    "placedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 📊 Tracking

### Purpose
The Tracking system monitors SMS delivery status and provides real-time updates on message delivery.

### Backend Endpoints

#### GET /api/tracking/mitto/:messageId
Get delivery status for a specific Mitto message.

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_01HRTD...",
    "status": "Delivered",
    "deliveredAt": "2024-01-15T10:35:00Z",
    "provider": "mitto",
    "providerMessageId": "mitto_1234567890"
  }
}
```

#### GET /api/tracking/campaign/:campaignId
Get delivery status for all messages in a campaign.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "cmp_01HRTD...",
    "totalMessages": 500,
    "delivered": 483,
    "failed": 17,
    "pending": 0,
    "deliveryRate": 96.6,
    "messages": [
      {
        "messageId": "msg_123",
        "phone": "+306977123456",
        "status": "Delivered",
        "deliveredAt": "2024-01-15T10:35:00Z"
      }
    ]
  }
}
```

#### POST /api/tracking/bulk-update
Bulk update delivery status for multiple messages.

**Request Body:**
```json
{
  "updates": [
    {
      "messageId": "msg_123",
      "status": "Delivered",
      "deliveredAt": "2024-01-15T10:35:00Z"
    },
    {
      "messageId": "msg_124",
      "status": "Failed",
      "failedAt": "2024-01-15T10:35:00Z",
      "failureReason": "Invalid phone number"
    }
  ]
}
```

---

## 🛍️ Shopify Integration

### Purpose
The Shopify integration provides access to store data, discount codes, and webhook handling for seamless e-commerce integration.

### Backend Endpoints

#### GET /api/shopify/discounts
Get available discount codes from Shopify.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "disc_123",
      "code": "SCHOOL20",
      "title": "Back to School Discount",
      "type": "percentage",
      "value": 20,
      "status": "active",
      "usageLimit": 100,
      "usedCount": 25
    }
  ]
}
```

#### GET /api/shopify/discounts/:id
Get specific discount code details.

#### POST /api/shopify/discounts/validate
Validate discount code for campaign use.

**Request Body:**
```json
{
  "discountId": "disc_123"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request data or validation errors
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Credit Validation Errors

When insufficient credits are available:

```json
{
  "success": false,
  "error": "Insufficient credits",
  "message": "You need 500 more credits to send this campaign. You currently have 200 credits.",
  "missingCredits": 500,
  "currentCredits": 200
}
```

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General API**: 1000 requests per hour per store
- **Reports**: 100 requests per hour per store
- **Export**: 10 requests per hour per store
- **Webhooks**: 500 requests per hour per store

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

---

## Store Scoping

All endpoints automatically scope data to the current store context:

- Store ID is resolved from the authentication token
- All database queries include `WHERE storeId = <currentStoreId>`
- Cross-store data access is prevented
- Store context is validated on every request

---

## Caching

The API implements Redis-based caching for improved performance:

- **Reports**: Cached for 5 minutes with automatic invalidation
- **Templates**: Cached for 1 hour
- **Settings**: Cached for 30 minutes
- **Health checks**: Cached for 1 minute

Cache headers are included in responses:
- `X-Cache-Status`: `HIT`, `MISS`, or `BYPASS`
- `X-Cache-TTL`: Time to live in seconds

---

This documentation provides a comprehensive guide to the Sendly Marketing Backend API, covering all endpoints, request/response formats, validation rules, and integration patterns. Each endpoint is designed to support the frontend functionality while maintaining security, performance, and multi-tenant isolation.
