# Automations API Documentation

## Overview

The Automations module provides predefined, event-based SMS automations that are globally available to all users but customizable per account. Users can activate/deactivate automations and customize message content while maintaining consistent trigger logic across the platform.

## Features

- **System-defined automations**: Pre-created by administrators
- **User customization**: Users can edit message content and toggle active status
- **Event-based triggers**: Automations trigger based on specific customer events
- **Template variables**: Support for dynamic content replacement
- **SMS integration**: Uses Mitto SMS service with user's configured sender
- **Webhook support**: Shopify webhook integration for real-time triggers

## Database Schema

### Automation Model (System Defaults)

```prisma
model Automation {
  id              String            @id @default(cuid())
  title           String
  description     String?
  triggerEvent    AutomationTrigger
  defaultMessage  String
  isSystemDefault Boolean           @default(false)
  createdAt       DateTime         @default(now())
  updatedAt        DateTime            @updatedAt
  userAutomations UserAutomation[]
}
```

### UserAutomation Model (User Customizations)

```prisma
model UserAutomation {
  id           String     @id @default(cuid())
  shopId       String
  automationId String
  userMessage  String?    // Custom message by user
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  shop         Shop       @relation(fields: [shopId], references: [id], onDelete: Cascade)
  automation   Automation @relation(fields: [automationId], references: [id], onDelete: Cascade)

  @@unique([shopId, automationId])
}
```

## Default Automations

The system includes four predefined automations:

### 1. Abandoned Cart Reminder
- **Trigger**: `cart_abandoned`
- **Default Message**: "Το καλάθι σου σε περιμένει! Ολοκλήρωσε την αγορά σου πριν εξαντληθεί."
- **Description**: Reminds customers about items left in their cart

### 2. Order Confirmation
- **Trigger**: `order_placed`
- **Default Message**: "Ευχαριστούμε για την παραγγελία σου! Θα ενημερωθείς σύντομα για την αποστολή."
- **Description**: Confirms successful order placement

### 3. Customer Re-engagement
- **Trigger**: `customer_inactive`
- **Default Message**: "Μας έχεις λείψει! Έλα πάλι στο κατάστημα και πάρε έκπτωση 10% για λίγες μέρες."
- **Description**: Re-engages inactive customers

### 4. Birthday Offer
- **Trigger**: `birthday`
- **Default Message**: "Χρόνια πολλά! Απόλαυσε ένα δωράκι από εμάς με τον κωδικό BDAY10 🎁."
- **Description**: Sends birthday offers to customers

## API Endpoints

### User Automation Endpoints (Authentication Required)

#### GET /api/automations

Get all automations for the current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_automation_id",
      "automationId": "system_automation_id",
      "title": "Abandoned Cart Reminder",
      "description": "Reminds customers about items left in their cart",
      "triggerEvent": "cart_abandoned",
      "defaultMessage": "Το καλάθι σου σε περιμένει! Ολοκλήρωσε την αγορά σου πριν εξαντληθεί.",
      "userMessage": null,
      "isActive": true,
      "isSystemDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### PUT /api/automations/:id

Update user automation (message content or active status).

**Request Body:**
```json
{
  "userMessage": "Custom message for this automation",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_automation_id",
    "automationId": "system_automation_id",
    "title": "Abandoned Cart Reminder",
    "description": "Reminds customers about items left in their cart",
    "triggerEvent": "cart_abandoned",
    "defaultMessage": "Το καλάθι σου σε περιμένει! Ολοκλήρωσε την αγορά σου πριν εξαντληθεί.",
    "userMessage": "Custom message for this automation",
    "isActive": true,
    "isSystemDefault": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Automation updated successfully"
}
```

#### GET /api/automations/stats

Get automation statistics for the current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAutomations": 4,
    "activeAutomations": 3,
    "inactiveAutomations": 1
  }
}
```

### Admin Endpoints (System Management)

#### GET /api/automations/defaults

Get all system default automations (admin only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "system_automation_id",
      "title": "Abandoned Cart Reminder",
      "description": "Reminds customers about items left in their cart",
      "triggerEvent": "cart_abandoned",
      "defaultMessage": "Το καλάθι σου σε περιμένει! Ολοκλήρωσε την αγορά σου πριν εξαντληθεί.",
      "isSystemDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/automations/sync

Sync new system defaults to all users (admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "syncedCount": 0,
    "totalShops": 1,
    "totalAutomations": 4
  },
  "message": "Successfully synced 0 new automations to all users"
}
```

### Webhook Endpoints (No Authentication Required)

#### POST /automation-webhooks/shopify/orders/create

Handle Shopify order creation webhook.

**Request Body:**
```json
{
  "shop_domain": "example.myshopify.com",
  "id": 12345,
  "customer": {
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "line_items": [
    {
      "title": "Product Name",
      "quantity": 1,
      "price": "29.99"
    }
  ],
  "total_price": "29.99",
  "currency": "EUR"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order webhook processed",
  "automationTriggered": true
}
```

#### POST /automation-webhooks/shopify/cart/abandoned

Handle abandoned cart webhook.

**Request Body:**
```json
{
  "shop_domain": "example.myshopify.com",
  "customer": {
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "cart_token": "cart-token-123",
  "line_items": [
    {
      "title": "Product Name",
      "quantity": 1,
      "price": "29.99"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart webhook processed",
  "automationTriggered": true
}
```

#### POST /automation-webhooks/trigger

Manually trigger an automation (for testing).

**Request Body:**
```json
{
  "shopId": "shop_id",
  "contactId": "contact_id",
  "triggerEvent": "cart_abandoned",
  "additionalData": {
    "cartToken": "cart-token-123",
    "customerEmail": "customer@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "messageId": "mitto_message_id",
    "automationId": "automation_id"
  },
  "message": "Automation triggered successfully"
}
```

## Template Variables

Automations support dynamic template variables that are replaced with actual values:

### Contact Variables
- `{{firstName}}`: Customer's first name
- `{{lastName}}`: Customer's last name
- `{{phone}}`: Customer's phone number

### Shop Variables
- `{{shopName}}`: Store name
- `{{shopDomain}}`: Store domain

### Order Variables
- `{{orderNumber}}`: Order number
- `{{trackingLink}}`: Shipping tracking link
- `{{productName}}`: Product name
- `{{discountCode}}`: Discount code

## Background Jobs

The system includes background jobs for automated triggers:

### Daily Jobs
- **Re-engagement Check**: Runs daily to find inactive customers
- **Birthday Check**: Runs daily to find customers with birthdays

### Event-based Jobs
- **Abandoned Cart**: Triggered when cart is abandoned
- **Order Confirmation**: Triggered when order is placed

## Usage Examples

### Get User Automations
```bash
curl -X GET "http://localhost:3000/api/automations" \
  -H "Content-Type: application/json"
```

### Update Automation Message
```bash
curl -X PUT "http://localhost:3000/api/automations/automation_id" \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Custom abandoned cart message",
    "isActive": true
  }'
```

### Trigger Automation Manually
```bash
curl -X POST "http://localhost:3000/automation-webhooks/trigger" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "shop_id",
    "contactId": "contact_id",
    "triggerEvent": "cart_abandoned",
    "additionalData": {
      "cartToken": "cart-123"
    }
  }'
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Common error codes:
- `400`: Bad Request (missing required fields)
- `404`: Not Found (automation/contact not found)
- `500`: Internal Server Error

## Security Considerations

- User automation endpoints require shop authentication
- Admin endpoints require proper authentication
- Webhook endpoints are public but should be secured with webhook signatures
- SMS content is sanitized to prevent XSS
- User can only modify their own automations
- System defaults cannot be modified by users

## Integration with Shopify

The system integrates with Shopify through webhooks:

1. **Order Creation**: Automatically triggers order confirmation automation
2. **Cart Abandonment**: Triggers abandoned cart automation (requires Shopify Plus)
3. **Customer Data**: Uses customer email to match contacts
4. **Order Data**: Passes order information to automation templates

## Monitoring and Analytics

- All automation triggers are logged in `MessageLog`
- Failed automations are logged with error details
- Success/failure rates can be tracked per automation
- User engagement can be measured through automation effectiveness
