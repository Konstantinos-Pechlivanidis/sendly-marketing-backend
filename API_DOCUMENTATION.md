# Sendly Marketing Backend - API Documentation

Complete API documentation for the Sendly Marketing Backend with frontend usage examples.

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Contacts](#contacts)
4. [Campaigns](#campaigns)
5. [Billing](#billing)
6. [Settings](#settings)
7. [Discounts & Shopify](#discounts--shopify)
8. [Templates](#templates)
9. [Reports](#reports)
10. [Automations](#automations)
11. [Audiences](#audiences)

---

## Authentication

### Base URL
```
Production: https://sendly-marketing-backend.onrender.com
Local: http://localhost:8080
```

### Endpoints

#### 1. Exchange Shopify Token (Shopify Extension)
**POST** `/auth/shopify-token`

Exchange Shopify App Bridge session token for app JWT token.

**Request Body:**
```json
{
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "store": {
      "id": "cmhrigaa300080arcrw5r4fia",
      "shopDomain": "your-store.myshopify.com",
      "credits": 100,
      "currency": "EUR"
    },
    "expiresIn": "30d"
  }
}
```

**Frontend Usage:**
```javascript
// In Shopify Extension (App Bridge)
const response = await fetch(`${CONFIG.API_URL}/auth/shopify-token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionToken: shopifySessionToken })
});
const { token, store } = response.data;
saveToken(token);
```

---

#### 2. Initiate OAuth Flow (Web App)
**GET** `/auth/shopify?shop=your-store.myshopify.com`

Redirects user to Shopify OAuth authorization page.

**Frontend Usage:**
```javascript
// Redirect to OAuth
window.location.href = `${CONFIG.API_URL}/auth/shopify?shop=${shopDomain}`;
```

---

#### 3. OAuth Callback
**GET** `/auth/callback?code=...&shop=...&hmac=...`

Handled automatically by backend. Redirects to frontend with JWT token.

**Frontend:** The callback is handled in `callback.html` and `callback.js`.

---

#### 4. Verify Token
**GET** `/auth/verify`

Verify current JWT token and get store information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "store": {
      "id": "cmhrigaa300080arcrw5r4fia",
      "shopDomain": "your-store.myshopify.com",
      "credits": 100,
      "currency": "EUR"
    },
    "valid": true
  }
}
```

**Frontend Usage:**
```javascript
const response = await api.get('/auth/verify');
if (response.success) {
  localStorage.setItem(CONFIG.STORE_KEY, JSON.stringify(response.data.store));
}
```

---

#### 5. Refresh Token
**POST** `/auth/refresh`

Refresh JWT token (if implemented).

**Frontend Usage:**
```javascript
const response = await api.post('/auth/refresh');
if (response.success) {
  saveToken(response.data.token);
}
```

---

## Dashboard

### Get Dashboard Overview
**GET** `/dashboard/overview`

Get comprehensive dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCampaigns": 25,
    "activeCampaigns": 5,
    "totalContacts": 1500,
    "totalSmsSent": 10000,
    "credits": 500,
    "recentCampaigns": [...],
    "recentContacts": [...]
  }
}
```

**Frontend Usage:**
```javascript
const response = await api.get('/dashboard/overview');
console.log(response.data.totalCampaigns);
console.log(response.data.credits);
```

---

### Get Quick Stats
**GET** `/dashboard/quick-stats`

Get quick statistics summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": 25,
    "contacts": 1500,
    "credits": 500,
    "smsSent": 10000
  }
}
```

**Frontend Usage:**
```javascript
const stats = await api.get('/dashboard/quick-stats');
document.getElementById('campaigns-count').textContent = stats.data.campaigns;
document.getElementById('contacts-count').textContent = stats.data.contacts;
document.getElementById('credits-amount').textContent = stats.data.credits;
```

---

## Contacts

### List Contacts
**GET** `/contacts?page=1&pageSize=20&search=john&tags=VIP`

Get paginated list of contacts with filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `pageSize` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by name, phone, or email
- `tags` (string): Filter by tags (comma-separated)
- `status` (string): Filter by status (active, unsubscribed, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "cm123",
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "john@example.com",
        "tags": ["VIP", "Customer"],
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1500,
      "totalPages": 75
    }
  }
}
```

**Frontend Usage:**
```javascript
// Get first page
const response = await api.get('/contacts?page=1&pageSize=20');

// Search contacts
const searchResults = await api.get('/contacts?search=john&page=1');

// Filter by tags
const vipContacts = await api.get('/contacts?tags=VIP&page=1');

// Display contacts
response.data.contacts.forEach(contact => {
  console.log(`${contact.name} - ${contact.phone}`);
});
```

---

### Get Single Contact
**GET** `/contacts/:id`

Get detailed information about a specific contact.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm123",
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "tags": ["VIP"],
    "status": "active",
    "campaigns": [...],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Frontend Usage:**
```javascript
const contact = await api.get('/contacts/cm123');
console.log(contact.data.name);
```

---

### Create Contact
**POST** `/contacts`

Create a new contact.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "tags": ["VIP", "Customer"],
  "metadata": {
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm123",
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "tags": ["VIP", "Customer"],
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Frontend Usage:**
```javascript
const newContact = await api.post('/contacts', {
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  tags: ['VIP']
});

if (newContact.success) {
  console.log('Contact created:', newContact.data.id);
}
```

---

### Update Contact
**PUT** `/contacts/:id`

Update an existing contact.

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "tags": ["VIP", "Premium"]
}
```

**Frontend Usage:**
```javascript
const updated = await api.put('/contacts/cm123', {
  name: 'John Updated',
  tags: ['VIP', 'Premium']
});
```

---

### Delete Contact
**DELETE** `/contacts/:id`

Delete a contact.

**Frontend Usage:**
```javascript
await api.delete('/contacts/cm123');
```

---

### Get Contact Statistics
**GET** `/contacts/stats`

Get contact statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1500,
    "active": 1400,
    "unsubscribed": 100,
    "byTag": {
      "VIP": 200,
      "Customer": 800
    }
  }
}
```

**Frontend Usage:**
```javascript
const stats = await api.get('/contacts/stats');
console.log(`Total contacts: ${stats.data.total}`);
```

---

### Import Contacts (CSV)
**POST** `/contacts/import`

Import contacts from CSV file.

**Request:** FormData with CSV file

**Frontend Usage:**
```javascript
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch(`${CONFIG.API_URL}/contacts/import`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${getToken()}`
  },
  body: formData
});

const result = await response.json();
console.log(`Imported ${result.data.imported} contacts`);
```

---

### Get Birthday Contacts
**GET** `/contacts/birthdays?month=12&day=25`

Get contacts with birthdays in a specific month/day.

**Frontend Usage:**
```javascript
// Get contacts with birthdays in December
const decemberBirthdays = await api.get('/contacts/birthdays?month=12');

// Get contacts with birthdays on December 25
const christmasBirthdays = await api.get('/contacts/birthdays?month=12&day=25');
```

---

## Campaigns

### List Campaigns
**GET** `/campaigns?page=1&pageSize=20&status=active`

Get paginated list of campaigns.

**Query Parameters:**
- `page` (number): Page number
- `pageSize` (number): Items per page
- `status` (string): Filter by status (draft, scheduled, active, completed, cancelled)
- `search` (string): Search campaigns

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "camp123",
        "name": "Summer Sale",
        "status": "active",
        "message": "Get 20% off!",
        "recipientCount": 500,
        "sentCount": 450,
        "deliveredCount": 420,
        "clickCount": 50,
        "scheduledAt": "2024-01-01T10:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
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

**Frontend Usage:**
```javascript
// Get all campaigns
const campaigns = await api.get('/campaigns?page=1&pageSize=20');

// Get active campaigns only
const activeCampaigns = await api.get('/campaigns?status=active&page=1');

// Display campaigns
campaigns.data.campaigns.forEach(campaign => {
  console.log(`${campaign.name} - ${campaign.status}`);
});
```

---

### Get Campaign Statistics
**GET** `/campaigns/stats/summary`

Get overall campaign statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 5,
    "completed": 15,
    "draft": 3,
    "cancelled": 2,
    "totalSent": 10000,
    "totalDelivered": 9500,
    "totalClicks": 500
  }
}
```

**Frontend Usage:**
```javascript
const stats = await api.get('/campaigns/stats/summary');
document.getElementById('total-campaigns').textContent = stats.data.total;
document.getElementById('active-campaigns').textContent = stats.data.active;
```

---

### Get Single Campaign
**GET** `/campaigns/:id`

Get detailed information about a campaign.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "camp123",
    "name": "Summer Sale",
    "status": "active",
    "message": "Get 20% off!",
    "recipientCount": 500,
    "sentCount": 450,
    "deliveredCount": 420,
    "clickCount": 50,
    "metrics": {
      "deliveryRate": 93.3,
      "clickRate": 11.9
    },
    "scheduledAt": "2024-01-01T10:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Frontend Usage:**
```javascript
const campaign = await api.get('/campaigns/camp123');
console.log(`Delivery rate: ${campaign.data.metrics.deliveryRate}%`);
```

---

### Create Campaign
**POST** `/campaigns`

Create a new SMS campaign.

**Request Body:**
```json
{
  "name": "Summer Sale",
  "message": "Get 20% off on all products! Use code SUMMER20",
  "recipientIds": ["cm123", "cm456"],
  "recipientTags": ["VIP"],
  "scheduledAt": "2024-01-01T10:00:00Z",
  "templateId": "tmpl123",
  "discountId": "discount123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "camp123",
    "name": "Summer Sale",
    "status": "draft",
    "message": "Get 20% off on all products! Use code SUMMER20",
    "recipientCount": 500,
    "scheduledAt": "2024-01-01T10:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Frontend Usage:**
```javascript
const newCampaign = await api.post('/campaigns', {
  name: 'Summer Sale',
  message: 'Get 20% off!',
  recipientTags: ['VIP'],
  scheduledAt: '2024-01-01T10:00:00Z'
});

if (newCampaign.success) {
  console.log('Campaign created:', newCampaign.data.id);
}
```

---

### Update Campaign
**PUT** `/campaigns/:id`

Update an existing campaign (only if status is 'draft').

**Request Body:**
```json
{
  "name": "Summer Sale Updated",
  "message": "Get 25% off!",
  "scheduledAt": "2024-01-02T10:00:00Z"
}
```

**Frontend Usage:**
```javascript
const updated = await api.put('/campaigns/camp123', {
  name: 'Summer Sale Updated',
  message: 'Get 25% off!'
});
```

---

### Delete Campaign
**DELETE** `/campaigns/:id`

Delete a campaign (only if status is 'draft' or 'cancelled').

**Frontend Usage:**
```javascript
await api.delete('/campaigns/camp123');
```

---

### Send Campaign Immediately
**POST** `/campaigns/:id/send`

Send a campaign immediately (must be in 'draft' or 'scheduled' status).

**Frontend Usage:**
```javascript
const result = await api.post('/campaigns/camp123/send');
if (result.success) {
  console.log('Campaign sent!');
}
```

---

### Schedule Campaign
**POST** `/campaigns/:id/schedule`

Schedule a campaign for later.

**Request Body:**
```json
{
  "scheduledAt": "2024-01-01T10:00:00Z"
}
```

**Frontend Usage:**
```javascript
const scheduled = await api.post('/campaigns/camp123/schedule', {
  scheduledAt: '2024-01-01T10:00:00Z'
});
```

---

### Cancel Campaign
**POST** `/campaigns/:id/cancel`

Cancel a scheduled or active campaign.

**Frontend Usage:**
```javascript
await api.post('/campaigns/camp123/cancel');
```

---

## Billing

### Get Credit Balance
**GET** `/billing/balance`

Get current credit balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "credits": 500,
    "currency": "EUR"
  }
}
```

**Frontend Usage:**
```javascript
const balance = await api.get('/billing/balance');
document.getElementById('credits-amount').textContent = balance.data.credits;
```

---

### Get Credit Packages
**GET** `/billing/packages`

Get available credit packages for purchase.

**Response:**
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "pkg1",
        "name": "Starter",
        "credits": 100,
        "price": 10.00,
        "currency": "EUR",
        "description": "100 SMS credits"
      },
      {
        "id": "pkg2",
        "name": "Professional",
        "credits": 500,
        "price": 40.00,
        "currency": "EUR",
        "description": "500 SMS credits"
      }
    ]
  }
}
```

**Frontend Usage:**
```javascript
const packages = await api.get('/billing/packages');

packages.data.packages.forEach(pkg => {
  const card = document.createElement('div');
  card.innerHTML = `
    <h3>${pkg.name}</h3>
    <p>${pkg.credits} credits - €${pkg.price}</p>
    <button onclick="purchasePackage('${pkg.id}')">Purchase</button>
  `;
  document.getElementById('packages-grid').appendChild(card);
});
```

---

### Purchase Credits
**POST** `/billing/purchase`

Create a Stripe checkout session for purchasing credits.

**Request Body:**
```json
{
  "packageId": "pkg1",
  "successUrl": "https://your-frontend.com/billing?success=true",
  "cancelUrl": "https://your-frontend.com/billing?canceled=true"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionUrl": "https://checkout.stripe.com/pay/cs_..."
  }
}
```

**Frontend Usage:**
```javascript
async function purchasePackage(packageId) {
  const response = await api.post('/billing/purchase', {
    packageId: packageId,
    successUrl: getAbsoluteUrl('billing.html?success=true'),
    cancelUrl: getAbsoluteUrl('billing.html?canceled=true')
  });
  
  if (response.success && response.data.sessionUrl) {
    // Open Stripe checkout
    window.open(response.data.sessionUrl, '_blank');
  }
}
```

---

### Get Transaction History
**GET** `/billing/history?page=1&pageSize=20`

Get credit purchase and usage history.

**Query Parameters:**
- `page` (number): Page number
- `pageSize` (number): Items per page
- `type` (string): Filter by type (purchase, usage)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn123",
        "type": "purchase",
        "amount": 100,
        "credits": 1000,
        "status": "completed",
        "createdAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "txn124",
        "type": "usage",
        "amount": -50,
        "credits": -50,
        "status": "completed",
        "createdAt": "2024-01-02T00:00:00Z"
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

**Frontend Usage:**
```javascript
const history = await api.get('/billing/history?page=1&pageSize=20');

history.data.transactions.forEach(transaction => {
  console.log(`${transaction.type}: ${transaction.credits} credits`);
});
```

---

### Get Billing History (Stripe)
**GET** `/billing/billing-history?page=1&pageSize=20`

Get Stripe payment history.

**Frontend Usage:**
```javascript
const billingHistory = await api.get('/billing/billing-history?page=1');
```

---

## Settings

### Get Settings
**GET** `/settings`

Get store settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "currency": "EUR",
    "timezone": "Europe/Athens",
    "senderNumber": "+1234567890",
    "senderName": "Sendly"
  }
}
```

**Frontend Usage:**
```javascript
const settings = await api.get('/settings');
console.log(`Currency: ${settings.data.currency}`);
console.log(`Timezone: ${settings.data.timezone}`);
```

---

### Get Account Info
**GET** `/settings/account`

Get account information.

**Response:**
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

**Frontend Usage:**
```javascript
const account = await api.get('/settings/account');
document.getElementById('shop-name').textContent = account.data.shopName;
```

---

### Update Sender Number
**PUT** `/settings/sender`

Update sender number/name.

**Request Body:**
```json
{
  "senderNumber": "+1234567890",
  "senderName": "My Store"
}
```

**Frontend Usage:**
```javascript
const updated = await api.put('/settings/sender', {
  senderNumber: '+1234567890',
  senderName: 'My Store'
});
```

---

## Discounts & Shopify

### Get Shopify Discounts
**GET** `/shopify/discounts`

Get all discount codes from Shopify store.

**Response:**
```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "id": "gid://shopify/DiscountCodeNode/123",
        "title": "Summer Sale",
        "code": "SUMMER20",
        "status": "ACTIVE",
        "startsAt": "2024-01-01T00:00:00Z",
        "endsAt": "2024-12-31T23:59:59Z",
        "usageLimit": 100,
        "type": "DiscountCodeBasic",
        "isActive": true,
        "isExpired": false
      }
    ],
    "total": 10,
    "active": 8
  }
}
```

**Frontend Usage:**
```javascript
const discounts = await api.get('/shopify/discounts');

// Display active discounts
discounts.data.discounts.forEach(discount => {
  if (discount.isActive && !discount.isExpired) {
    console.log(`${discount.code} - ${discount.title}`);
  }
});

// Use in campaign creation
const discountSelect = document.getElementById('discount-select');
discounts.data.discounts.forEach(discount => {
  const option = document.createElement('option');
  option.value = discount.id;
  option.textContent = `${discount.code} - ${discount.title}`;
  discountSelect.appendChild(option);
});
```

---

### Get Specific Discount
**GET** `/shopify/discounts/:id`

Get detailed information about a specific discount.

**Frontend Usage:**
```javascript
const discount = await api.get('/shopify/discounts/gid://shopify/DiscountCodeNode/123');
console.log(discount.data.code);
```

---

### Validate Discount
**POST** `/shopify/discounts/validate`

Validate if a discount can be used in a campaign.

**Request Body:**
```json
{
  "discountId": "gid://shopify/DiscountCodeNode/123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "discount": {...},
    "isValid": true,
    "canUse": true,
    "reason": null
  }
}
```

**Frontend Usage:**
```javascript
const validation = await api.post('/shopify/discounts/validate', {
  discountId: 'gid://shopify/DiscountCodeNode/123'
});

if (validation.data.canUse) {
  console.log('Discount can be used!');
} else {
  console.log('Cannot use discount:', validation.data.reason);
}
```

---

## Templates

### List Templates
**GET** `/templates?page=1&pageSize=20`

Get paginated list of SMS templates.

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "tmpl123",
        "name": "Welcome Message",
        "content": "Welcome to {{storeName}}!",
        "variables": ["storeName"],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

**Frontend Usage:**
```javascript
const templates = await api.get('/templates?page=1&pageSize=20');

templates.data.templates.forEach(template => {
  console.log(`${template.name}: ${template.content}`);
});
```

---

### Get Single Template
**GET** `/templates/:id`

Get detailed template information.

**Frontend Usage:**
```javascript
const template = await api.get('/templates/tmpl123');
```

---

### Create Template
**POST** `/templates`

Create a new SMS template.

**Request Body:**
```json
{
  "name": "Welcome Message",
  "content": "Welcome to {{storeName}}! Use code {{discountCode}} for 20% off.",
  "variables": ["storeName", "discountCode"]
}
```

**Frontend Usage:**
```javascript
const newTemplate = await api.post('/templates', {
  name: 'Welcome Message',
  content: 'Welcome to {{storeName}}!',
  variables: ['storeName']
});
```

---

### Update Template
**PUT** `/templates/:id`

Update an existing template.

**Frontend Usage:**
```javascript
const updated = await api.put('/templates/tmpl123', {
  content: 'Welcome to {{storeName}}! Use code {{discountCode}}.'
});
```

---

### Delete Template
**DELETE** `/templates/:id`

Delete a template.

**Frontend Usage:**
```javascript
await api.delete('/templates/tmpl123');
```

---

## Reports

### Get Campaign Reports
**GET** `/reports/campaigns?startDate=2024-01-01&endDate=2024-12-31`

Get campaign performance reports.

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `campaignId` (string): Filter by campaign ID

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSent": 10000,
    "totalDelivered": 9500,
    "totalClicks": 500,
    "deliveryRate": 95.0,
    "clickRate": 5.0,
    "campaigns": [...]
  }
}
```

**Frontend Usage:**
```javascript
const reports = await api.get('/reports/campaigns?startDate=2024-01-01&endDate=2024-12-31');
console.log(`Delivery rate: ${reports.data.deliveryRate}%`);
```

---

## Automations

### List Automations
**GET** `/automations?page=1&pageSize=20`

Get list of automation rules.

**Frontend Usage:**
```javascript
const automations = await api.get('/automations?page=1&pageSize=20');
```

---

### Create Automation
**POST** `/automations`

Create a new automation rule.

**Request Body:**
```json
{
  "name": "Birthday Greeting",
  "trigger": "birthday",
  "templateId": "tmpl123",
  "enabled": true
}
```

**Frontend Usage:**
```javascript
const automation = await api.post('/automations', {
  name: 'Birthday Greeting',
  trigger: 'birthday',
  templateId: 'tmpl123',
  enabled: true
});
```

---

## Audiences

### List Audiences
**GET** `/audiences?page=1&pageSize=20`

Get list of contact audiences/segments.

**Frontend Usage:**
```javascript
const audiences = await api.get('/audiences?page=1&pageSize=20');
```

---

### Create Audience
**POST** `/audiences`

Create a new audience segment.

**Request Body:**
```json
{
  "name": "VIP Customers",
  "filters": {
    "tags": ["VIP"],
    "minOrders": 5
  }
}
```

**Frontend Usage:**
```javascript
const audience = await api.post('/audiences', {
  name: 'VIP Customers',
  filters: {
    tags: ['VIP'],
    minOrders: 5
  }
});
```

---

## Error Handling

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "validation_error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "phone",
      "message": "Phone number is required"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/contacts",
  "method": "POST"
}
```

**Frontend Error Handling:**
```javascript
try {
  const response = await api.post('/contacts', contactData);
  if (response.success) {
    // Handle success
  }
} catch (error) {
  console.error('API Error:', error.message);
  
  // Check if it's a validation error
  if (error.details) {
    error.details.forEach(detail => {
      console.error(`${detail.field}: ${detail.message}`);
    });
  }
}
```

---

## Authentication Flow

### Web App Flow

1. **User clicks "Login"** → Redirects to `/auth/shopify?shop=store.myshopify.com`
2. **Backend redirects to Shopify OAuth** → User authorizes app
3. **Shopify redirects back** → `/auth/callback?code=...&shop=...`
4. **Backend exchanges code for access token** → Creates/updates store
5. **Backend generates JWT** → Redirects to frontend with token
6. **Frontend saves token** → `localStorage.setItem('sendly_app_token', token)`
7. **All subsequent requests** → Include `Authorization: Bearer <token>` header

### Shopify Extension Flow

1. **Get Shopify session token** → From App Bridge
2. **Exchange for app token** → `POST /auth/shopify-token` with session token
3. **Save app token** → Use for all API requests

---

## Frontend API Client

The frontend includes a ready-to-use API client in `api.js`:

```javascript
// Import the API client (already configured)
// const api = new APIClient(CONFIG.API_URL);

// All methods automatically include JWT token
const response = await api.get('/dashboard/overview');
const newContact = await api.post('/contacts', { name: 'John', phone: '+1234567890' });
const updated = await api.put('/contacts/cm123', { name: 'John Updated' });
await api.delete('/contacts/cm123');
```

**Features:**
- Automatic JWT token inclusion
- Automatic 401 handling (redirects to login)
- Error handling
- JSON request/response handling

---

## Rate Limiting

Some endpoints have rate limiting:
- **Campaigns**: 100 requests/minute
- **Contacts**: 200 requests/minute
- **Billing**: 50 requests/minute

If rate limited, you'll receive a `429 Too Many Requests` response.

---

## Pagination

Most list endpoints support pagination:

```javascript
// Get first page
const page1 = await api.get('/contacts?page=1&pageSize=20');

// Get next page
const page2 = await api.get('/contacts?page=2&pageSize=20');

// Access pagination info
console.log(`Page ${page1.data.pagination.page} of ${page1.data.pagination.totalPages}`);
console.log(`Total: ${page1.data.pagination.total}`);
```

---

## Best Practices

1. **Always check `response.success`** before using data
2. **Handle errors gracefully** with try/catch
3. **Use pagination** for large lists
4. **Cache data** when appropriate (dashboard stats, settings)
5. **Show loading states** during API calls
6. **Validate data** before sending to API
7. **Use absolute URLs** for redirects in static sites

---

## Support

For issues or questions:
- Check the API response for error details
- Verify JWT token is valid (use `/auth/verify`)
- Ensure store context is available (check `/whoami`)

---

**Last Updated:** 2024-01-01
**API Version:** v1

