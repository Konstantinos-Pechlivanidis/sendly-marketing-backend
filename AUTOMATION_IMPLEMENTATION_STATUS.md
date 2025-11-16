# Automation Implementation Status

## Overview

This document provides a comprehensive overview of each automation, its implementation status, how it works, when it's triggered, and how to test it.

## Automation Architecture

```
Shopify Event → Webhook → Backend Endpoint → Queue Job → Automation Worker → SMS via Mitto
```

### Data Flow

1. **Shopify Event Occurs** (e.g., order placed, order fulfilled)
2. **Shopify Sends Webhook** to our backend (`/automation-webhooks/shopify/...`)
3. **Webhook Handler** verifies signature, finds shop & contact, queues job
4. **Queue Worker** processes job asynchronously
5. **Automation Service** finds active automation, checks consent, sends SMS
6. **Mitto API** delivers SMS to customer

---

## Implemented Automations

### 1. Order Placed ✅ **FULLY IMPLEMENTED**

**What it does:**
- Sends SMS confirmation when a customer places an order
- Includes order number and personalized message

**When it's triggered:**
- Shopify webhook: `orders/create`
- Triggered immediately when order is created in Shopify

**Implementation Status:**
- ✅ Webhook endpoint: `POST /automation-webhooks/shopify/orders/create`
- ✅ Webhook signature verification
- ✅ Queue-based processing
- ✅ Automation service integration
- ✅ SMS sending via Mitto
- ⚠️ **Requires webhook registration in Shopify** (see setup guide)

**How to test:**
1. Create an automation with trigger `order_placed` in the UI
2. Ensure the contact exists in the database with `smsConsent: 'opted_in'`
3. Place a test order in Shopify
4. Verify webhook is received (check logs)
5. Check that SMS is sent (check MessageLog table or Mitto dashboard)

**Backend Files:**
- `controllers/automation-webhooks.js` - `handleOrderCreated()`
- `queue/jobs/automationTriggers.js` - `handleOrderConfirmationTrigger()`
- `services/automations.js` - `triggerOrderConfirmation()`

---

### 2. Order Fulfilled ✅ **FULLY IMPLEMENTED**

**What it does:**
- Sends SMS notification when an order is fulfilled
- Includes tracking number and tracking URLs if available

**When it's triggered:**
- Shopify webhook: `orders/fulfilled`
- Triggered when order fulfillment is created in Shopify

**Implementation Status:**
- ✅ Webhook endpoint: `POST /automation-webhooks/shopify/orders/fulfilled`
- ✅ Webhook signature verification
- ✅ Queue-based processing
- ✅ Automation service integration
- ✅ SMS sending via Mitto
- ✅ Tracking number and URL support in message templates
- ⚠️ **Requires webhook registration in Shopify** (see setup guide)

**How to test:**
1. Create an automation with trigger `order_fulfilled` in the UI
2. Ensure the contact exists with `smsConsent: 'opted_in'`
3. Fulfill a test order in Shopify
4. Verify webhook is received
5. Check that SMS is sent with tracking information

**Backend Files:**
- `controllers/automation-webhooks.js` - `handleOrderFulfilled()`
- `queue/jobs/automationTriggers.js` - `handleOrderFulfilledTrigger()`
- `services/automations.js` - `triggerOrderFulfilled()`

**Message Template Variables:**
- `{{orderNumber}}` - Order number
- `{{trackingNumber}}` - Tracking number
- `{{trackingLink}}` - First tracking URL

---

### 3. Birthday ✅ **FULLY IMPLEMENTED**

**What it does:**
- Sends personalized birthday SMS with discount codes
- Runs automatically via daily cron job

**When it's triggered:**
- Daily cron job (runs at midnight UTC)
- Checks all contacts with `birthDate` matching today's date
- Only sends to contacts with `smsConsent: 'opted_in'`

**Implementation Status:**
- ✅ Daily cron job scheduler
- ✅ Birthday detection logic
- ✅ Automation service integration
- ✅ SMS sending via Mitto
- ✅ Fully automated (no webhook needed)

**How to test:**
1. Create an automation with trigger `birthday` in the UI
2. Create a contact with `birthDate` set to today's date
3. Ensure contact has `smsConsent: 'opted_in'`
4. Wait for cron job to run (or trigger manually via API)
5. Check that SMS is sent

**Backend Files:**
- `services/scheduler.js` - Daily birthday cron job
- `services/automations.js` - `processDailyBirthdayAutomations()`, `triggerBirthdayOffer()`
- `queue/jobs/automationTriggers.js` - `handleBirthdayTrigger()`

**Manual Testing:**
- Use manual trigger endpoint: `POST /automation-webhooks/trigger`
- Body: `{ shopId, contactId, triggerEvent: 'birthday', additionalData: {} }`

---

## Partially Implemented Automations

### 4. Abandoned Cart ⚠️ **PARTIALLY IMPLEMENTED**

**What it does:**
- Sends SMS when customer abandons cart
- Includes cart items and discount code

**When it's triggered:**
- ⚠️ **Shopify doesn't natively send abandoned cart webhooks**
- Requires custom implementation (see below)

**Implementation Status:**
- ✅ Webhook endpoint: `POST /automation-webhooks/shopify/cart/abandoned`
- ✅ Queue-based processing
- ✅ Automation service integration
- ❌ **Shopify doesn't send this webhook automatically**
- ❌ **Requires custom Shopify integration** (Script Tags, Flow, or polling)

**Options for Implementation:**

**Option A: Shopify Flow (Recommended)**
- Create Shopify Flow that triggers on checkout abandonment
- Flow sends webhook to our endpoint

**Option B: Script Tags**
- Inject JavaScript into storefront
- Detect cart abandonment client-side
- Send webhook to our endpoint

**Option C: Polling**
- Periodically query Shopify API for abandoned checkouts
- Process and send SMS

**Current Status:**
- Backend is ready, but needs Shopify-side integration
- Webhook endpoint exists and works if webhook is sent

**How to test (once Shopify integration is added):**
1. Create automation with trigger `cart_abandoned`
2. Add items to cart in Shopify storefront
3. Abandon cart (don't complete checkout)
4. Wait for abandonment detection (depends on implementation)
5. Verify SMS is sent

**Backend Files:**
- `controllers/automation-webhooks.js` - `handleCartAbandoned()`
- `queue/jobs/automationTriggers.js` - `handleAbandonedCartTrigger()`
- `services/automations.js` - `triggerAbandonedCart()`

---

### 5. Customer Re-engagement ⚠️ **PARTIALLY IMPLEMENTED**

**What it does:**
- Sends SMS to inactive customers to encourage re-engagement
- Based on last order date

**When it's triggered:**
- Daily cron job (planned)
- Checks customers with no orders in X days (e.g., 90 days)

**Implementation Status:**
- ✅ Automation service function exists
- ✅ Queue worker handler exists
- ❌ **Order history tracking not implemented**
- ❌ **Daily cron job not set up**
- ⚠️ Currently uses demo logic (10% random chance)

**What's Missing:**
1. Store order data when orders are received
2. Track last order date per contact
3. Implement daily cron job to check inactive customers
4. Add configuration for inactivity threshold (e.g., 90 days)

**How to test (once fully implemented):**
1. Create automation with trigger `customer_inactive`
2. Create contact with last order date > 90 days ago
3. Wait for daily cron job
4. Verify SMS is sent

**Backend Files:**
- `services/automations.js` - `triggerCustomerReengagement()`
- `queue/jobs/automationTriggers.js` - `handleCustomerReengagementTrigger()`

---

## Not Implemented

### 6. Welcome ❌ **NOT IMPLEMENTED**

**Status:** Trigger exists in enum but no implementation

**What's needed:**
- Trigger on customer registration
- Requires customer creation webhook from Shopify
- Webhook endpoint: `POST /automation-webhooks/shopify/customers/create`

---

## Customer Data Sync

### How Customer Data is Obtained

**Current Implementation:**
- Customer data is **NOT automatically synced** from Shopify
- Contacts must be created manually or imported via CSV
- When webhooks are received, we look up contacts by email

**Webhook Flow:**
1. Shopify sends webhook with customer email
2. Backend looks up contact: `Contact.findFirst({ shopId, email })`
3. If contact not found, webhook fails (returns 404)
4. If contact found, automation proceeds

**Gap:**
- No automatic customer sync from Shopify
- Contacts must exist before automations can work

**Recommended Solution:**
1. **Sync on webhook:** When order webhook is received, create/update contact if not exists
2. **Periodic sync:** Daily job to sync all customers from Shopify
3. **Manual sync:** API endpoint to trigger customer sync

---

## Webhook Registration

### Current Status: ❌ **NOT AUTOMATED**

**Problem:**
- Webhooks must be manually registered in Shopify Admin
- No automatic registration during OAuth flow

**Required Webhooks:**
- `orders/create` → `POST /automation-webhooks/shopify/orders/create`
- `orders/fulfilled` → `POST /automation-webhooks/shopify/orders/fulfilled`
- `customers/create` → `POST /automation-webhooks/shopify/customers/create` (for welcome automation)

**Manual Registration:**
1. Go to Shopify Admin → Settings → Notifications → Webhooks
2. Create webhook for each event
3. Set URL to: `https://your-backend-url.com/automation-webhooks/shopify/orders/create`
4. Set format to JSON
5. Save

**Recommended Solution:**
- Add webhook registration to OAuth callback
- Use Shopify Admin API to create webhooks programmatically
- Store webhook IDs in database for management

---

## Testing Guide

### Manual Testing via API

**Endpoint:** `POST /automation-webhooks/trigger`

**Request Body:**
```json
{
  "shopId": "shop_id_here",
  "contactId": "contact_id_here",
  "triggerEvent": "order_placed",
  "additionalData": {
    "orderNumber": "1234",
    "customerName": "John Doe"
  }
}
```

**Testing Steps:**
1. Get shop ID from database or API
2. Get contact ID (ensure `smsConsent: 'opted_in'`)
3. Call trigger endpoint
4. Check logs for automation processing
5. Verify SMS sent (check MessageLog or Mitto dashboard)

---

## Next Steps for Full Implementation

### Priority 1: Webhook Registration
- [ ] Add webhook registration to OAuth callback
- [ ] Use Shopify Admin API to create webhooks
- [ ] Store webhook IDs for management

### Priority 2: Customer Sync
- [ ] Create/update contact on order webhook if not exists
- [ ] Add periodic customer sync job
- [ ] Add manual sync endpoint

### Priority 3: Abandoned Cart
- [ ] Choose implementation approach (Flow/Script Tags/Polling)
- [ ] Implement Shopify-side detection
- [ ] Test end-to-end flow

### Priority 4: Customer Re-engagement
- [ ] Store order data on order webhook
- [ ] Track last order date per contact
- [ ] Implement daily cron job
- [ ] Add inactivity threshold configuration

### Priority 5: Welcome Automation
- [ ] Add `customers/create` webhook endpoint
- [ ] Implement welcome automation logic
- [ ] Test customer registration flow

