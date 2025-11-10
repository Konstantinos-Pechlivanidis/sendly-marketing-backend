# Postman API Documentation Setup

Complete guide for using the Sendly Backend API with Postman.

## 📦 Files Included

1. **Sendly_Backend_API.postman_collection.json** - Complete API collection with all endpoints
2. **Sendly_Dev_Store.postman_environment.json** - Environment variables for dev store

## 🚀 Quick Setup

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select `Sendly_Backend_API.postman_collection.json`
4. Click **Import**

### Step 2: Import Environment
1. Click **Import** again
2. Select `Sendly_Dev_Store.postman_environment.json`
3. Click **Import**

### Step 3: Select Environment
1. Click the environment dropdown (top right)
2. Select **"Sendly Dev Store"**

### Step 4: Update Access Token
1. Click the **eye icon** next to environment dropdown
2. Find `shopify_access_token` variable
3. Update with your **full access token** from Shopify Debug Information
4. Click **Save**

## 🔑 Authentication

### Store-Scoped Endpoints
Most endpoints require the `X-Shopify-Shop-Domain` header:
- **Header Name:** `X-Shopify-Shop-Domain`
- **Header Value:** `{{shopDomain}}` (automatically set from environment)

The collection includes a pre-request script that automatically adds this header to all requests.

### Dev Store Credentials
- **Shop Domain:** `sms-blossom-dev.myshopify.com`
- **Access Token:** Update in environment variables (see Step 4 above)

## 📋 Available Endpoints

### 🔧 Core
- `GET /` - API status
- `GET /health` - Basic health check
- `GET /health/config` - Configuration health
- `GET /health/full` - Full system health check
- `GET /metrics` - Application metrics

### 🏠 Dashboard
- `GET /dashboard/overview` - Dashboard overview
- `GET /dashboard/quick-stats` - Quick statistics

### 👥 Contacts
- `GET /contacts` - List contacts (with filtering)
- `POST /contacts` - Create contact
- `GET /contacts/:id` - Get contact by ID
- `PUT /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact
- `GET /contacts/stats` - Contact statistics
- `GET /contacts/birthdays` - Birthday contacts
- `POST /contacts/import` - Import contacts

### 📢 Campaigns
- `GET /campaigns` - List campaigns
- `POST /campaigns` - Create campaign
- `GET /campaigns/:id` - Get campaign by ID
- `PUT /campaigns/:id` - Update campaign
- `DELETE /campaigns/:id` - Delete campaign
- `POST /campaigns/:id/prepare` - Prepare campaign
- `POST /campaigns/:id/send` - Send campaign
- `PUT /campaigns/:id/schedule` - Schedule campaign
- `GET /campaigns/:id/metrics` - Campaign metrics
- `GET /campaigns/stats/summary` - Campaign statistics
- `POST /campaigns/:id/retry-failed` - Retry failed SMS

### 🤖 Automations
- `GET /automations` - List automations
- `GET /automations/stats` - Automation statistics
- `PUT /automations/:id` - Update automation
- `GET /automations/defaults` - System defaults
- `POST /automations/sync` - Sync defaults

### 📄 Templates
- `GET /templates` - List templates
- `GET /templates/categories` - Get categories
- `GET /templates/:id` - Get template by ID
- `POST /templates/:id/track` - Track usage

### 📊 Reports
- `GET /reports/kpis` - Key performance indicators
- `GET /reports/overview` - Reports overview
- `GET /reports/campaigns` - Campaign reports
- `GET /reports/campaigns/:id` - Campaign report by ID
- `GET /reports/automations` - Automation reports
- `GET /reports/messaging` - Messaging reports
- `GET /reports/credits` - Credits reports
- `GET /reports/contacts` - Contacts reports
- `GET /reports/export` - Export reports

### 💳 Billing & Settings
- `GET /billing/balance` - Get credit balance
- `GET /billing/packages` - Get packages
- `POST /billing/purchase` - Create purchase session
- `GET /billing/history` - Transaction history
- `GET /billing/billing-history` - Billing history
- `GET /settings` - Get settings
- `GET /settings/account` - Get account info
- `PUT /settings/sender` - Update sender number

### 🔍 Tracking
- `GET /tracking/mitto/:messageId` - Get Mitto message status
- `GET /tracking/campaign/:campaignId` - Campaign delivery status
- `POST /tracking/bulk-update` - Bulk update status

### 🎟️ Discounts
- `GET /discounts` - Get discounts
- `GET /discounts/:id` - Get discount by ID
- `GET /discounts/validate/:code` - Validate discount code

### 👥 Audiences
- `GET /audiences` - Get audiences
- `GET /audiences/:id/details` - Get audience details
- `POST /audiences/validate` - Validate audience

### 🛍️ Shopify
- `GET /shopify/discounts` - Get Shopify discounts
- `GET /shopify/discounts/:id` - Get Shopify discount by ID
- `POST /shopify/discounts/validate` - Validate Shopify discount

### 🔧 Admin Templates
- `GET /admin/templates` - List admin templates
- `POST /admin/templates` - Create template
- `GET /admin/templates/:id/stats` - Template stats
- `PUT /admin/templates/:id` - Update template
- `DELETE /admin/templates/:id` - Delete template

## 📝 Example Requests

### Create Contact
```json
POST /contacts
Headers:
  X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com
  Content-Type: application/json

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneE164": "+306984303406",
  "email": "john@example.com",
  "gender": "male",
  "smsConsent": "opted_in",
  "tags": ["vip"]
}
```

### Create Campaign
```json
POST /campaigns
Headers:
  X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com
  Content-Type: application/json

Body:
{
  "name": "Black Friday Sale",
  "message": "Get 50% off everything! Use code BLACKFRIDAY",
  "audience": "all",
  "scheduleType": "immediate"
}
```

### Get Credit Balance
```json
GET /billing/balance
Headers:
  X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com
```

## 🔐 Environment Variables

All variables are pre-configured in `Sendly_Dev_Store.postman_environment.json`:

- `base_url` - Backend API URL
- `shopDomain` - Shopify store domain
- `shopify_access_token` - **UPDATE THIS** with full token
- `shopify_api_key` - Shopify API key
- `shopify_api_secret` - Shopify API secret
- `stripe_secret_key` - Stripe test key
- `mitto_api_key` - Mitto API key
- `test_phone_1` - Test contact phone 1
- `test_phone_2` - Test contact phone 2
- And more...

## ⚠️ Important Notes

1. **Access Token:** You must update `shopify_access_token` with the full token from your Shopify Debug Information
2. **Headers:** The `X-Shopify-Shop-Domain` header is automatically added via pre-request script
3. **Test Data:** Use the test phone numbers from environment variables for testing
4. **Base URL:** Currently set to production URL. Change if testing locally

## 🧪 Testing Workflow

1. **Health Check:** Start with `GET /health` to verify API is accessible
2. **Get Balance:** Check credits with `GET /billing/balance`
3. **Create Contact:** Add a test contact with `POST /contacts`
4. **Create Campaign:** Create a draft campaign with `POST /campaigns`
5. **Prepare Campaign:** Validate with `POST /campaigns/:id/prepare`
6. **Send Campaign:** Send with `POST /campaigns/:id/send` (requires credits)

## 📚 Additional Resources

- **API Base URL:** https://sendly-marketing-backend.onrender.com
- **Dev Store:** sms-blossom-dev.myshopify.com
- **Shopify API Version:** 2024-04

## 🐛 Troubleshooting

### "Store not found" error
- Verify `X-Shopify-Shop-Domain` header is set correctly
- Check that environment variable `shopDomain` is correct

### "Invalid access token" error
- Update `shopify_access_token` in environment variables
- Ensure you're using the full token (not truncated)

### "Insufficient credits" error
- Check balance with `GET /billing/balance`
- Purchase credits via `POST /billing/purchase`

---

**Ready to test!** Import both files and start making API requests. 🚀

