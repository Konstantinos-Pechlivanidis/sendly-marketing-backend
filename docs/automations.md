# Automations API Documentation

## Overview

The Automations API provides configuration and management for automated SMS messages that are triggered by specific customer actions. The system includes predefined automation types with professional default messages that can be customized by users.

## Architecture

### Database Schema

```sql
model Automation {
  id             String   @id @default(cuid())
  type           String   @unique // e.g., 'abandoned_checkout', 'welcome', 'winback', 'post_purchase', 'fulfillment_update'
  active         Boolean  @default(false)
  message        String   // user-editable text body
  defaultMessage String   // seeded default text (immutable baseline)
  // optional knobs allowed to edit (if any)
  delayMinutes   Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([type])
  @@index([active])
}
```

### Seeded Data Structure

The system comes pre-loaded with **5 automation types** with professional default messages:

- **abandoned_checkout**: "You left items in your cart! Complete your purchase with {{checkout_url}}"
- **welcome**: "Welcome to {{shop_name}}! Use code WELCOME10 for 10% off your first order."
- **winback**: "We miss you! Come back and save 15% with code COMEBACK15"
- **post_purchase**: "Thank you for your order! Track your package: {{tracking_url}}"
- **fulfillment_update**: "Your order #{{order_number}} is on its way! Track: {{tracking_url}}"

### User Customization System

Each automation type supports:

- **Active/Inactive Toggle**: Per-shop activation (not global)
- **Message Customization**: Users can edit the message content
- **Delay Configuration**: Set timing for abandoned checkout (30 minutes default)
- **Variable Support**: Dynamic content with context-aware variables
- **Reset to Default**: Restore original professional messages

### Variable System by Automation Type

- **Abandoned Checkout**: `{{checkout_url}}`, `{{customer_name}}`, `{{cart_total}}`, `{{currency}}`, `{{shop_name}}`
- **Welcome**: `{{customer_name}}`, `{{shop_name}}`, `{{discount_code}}`, `{{discount_value}}`
- **Winback**: `{{customer_name}}`, `{{shop_name}}`, `{{discount_code}}`, `{{discount_value}}`
- **Post Purchase**: `{{customer_name}}`, `{{order_number}}`, `{{order_total}}`, `{{currency}}`, `{{shop_name}}`
- **Fulfillment Update**: `{{customer_name}}`, `{{order_number}}`, `{{tracking_number}}`, `{{tracking_url}}`, `{{carrier}}`, `{{shop_name}}`

## Key Features

- **Predefined Automation Types**: 5 core automation types (abandoned checkout, welcome, winback, post-purchase, fulfillment update)
- **Professional Default Messages**: Expert-crafted default messages for each automation type
- **Customizable Content**: Users can edit messages while maintaining professional quality
- **Variable Support**: Dynamic content using template variables
- **Performance Tracking**: Monitor automation effectiveness and delivery rates
- **Active/Inactive Toggle**: Enable or disable automations as needed
- **Delay Configuration**: Set timing for abandoned checkout automations
- **Reset to Default**: Restore original professional messages
- **Per-Shop Configuration**: Each shop can customize automations independently
- **Professional Standards**: Maintain message quality with expert defaults

## Base URL

```
/automations
```

## Authentication

All endpoints require Shopify session token authentication via the `ensureShopContext` middleware.

## Automation Types

### 1. Abandoned Checkout

- **Trigger**: Customer abandons checkout process
- **Default Message**: "You left items in your cart! Complete your purchase with {{checkout_url}}"
- **Delay**: 30 minutes (configurable)
- **Variables**: `{{checkout_url}}`, `{{customer_name}}`, `{{cart_total}}`, `{{currency}}`, `{{shop_name}}`

### 2. Welcome

- **Trigger**: New customer registration
- **Default Message**: "Welcome to {{shop_name}}! Use code WELCOME10 for 10% off your first order."
- **Delay**: None (immediate)
- **Variables**: `{{customer_name}}`, `{{shop_name}}`, `{{discount_code}}`, `{{discount_value}}`

### 3. Winback

- **Trigger**: Inactive customer re-engagement
- **Default Message**: "We miss you! Come back and save 15% with code COMEBACK15"
- **Delay**: None (immediate)
- **Variables**: `{{customer_name}}`, `{{shop_name}}`, `{{discount_code}}`, `{{discount_value}}`

### 4. Post Purchase

- **Trigger**: Successful order completion
- **Default Message**: "Thank you for your order! Track your package: {{tracking_url}}"
- **Delay**: None (immediate)
- **Variables**: `{{customer_name}}`, `{{order_number}}`, `{{order_total}}`, `{{currency}}`, `{{shop_name}}`

### 5. Fulfillment Update

- **Trigger**: Order shipped
- **Default Message**: "Your order #{{order_number}} is on its way! Track: {{tracking_url}}"
- **Delay**: None (immediate)
- **Variables**: `{{customer_name}}`, `{{order_number}}`, `{{tracking_number}}`, `{{tracking_url}}`, `{{carrier}}`, `{{shop_name}}`

## Endpoints

### 1. List All Automations

**GET** `/automations`

Retrieve all automation configurations with statistics.

#### Response

```json
{
  "success": true,
  "data": {
    "automations": [
      {
        "id": "automation_123",
        "type": "abandoned_checkout",
        "active": true,
        "message": "You left items in your cart! Complete your purchase with {{checkout_url}}",
        "defaultMessage": "You left items in your cart! Complete your purchase with {{checkout_url}}",
        "delayMinutes": 30,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "description": "Sends SMS when customer abandons checkout",
        "variables": [
          "{{checkout_url}}",
          "{{customer_name}}",
          "{{cart_total}}",
          "{{currency}}",
          "{{shop_name}}"
        ],
        "isDefault": true,
        "stats": {
          "totalSent": 1500,
          "totalDelivered": 1425,
          "totalFailed": 75,
          "totalClicked": 285,
          "deliveryRate": 95,
          "clickRate": 19
        }
      }
    ],
    "types": [
      {
        "type": "abandoned_checkout",
        "description": "Sends SMS when customer abandons checkout",
        "defaultMessage": "You left items in your cart! Complete your purchase with {{checkout_url}}",
        "hasDelay": true
      }
    ],
    "stats": {
      "totalSent": 5000,
      "totalDelivered": 4750,
      "totalFailed": 250,
      "totalClicked": 950,
      "activeAutomations": 3,
      "deliveryRate": 95,
      "clickRate": 19
    }
  }
}
```

### 2. Get Single Automation

**GET** `/automations/:type`

Retrieve detailed information about a specific automation.

#### Response

```json
{
  "success": true,
  "data": {
    "automation": {
      "id": "automation_123",
      "type": "abandoned_checkout",
      "active": true,
      "message": "You left items in your cart! Complete your purchase with {{checkout_url}}",
      "defaultMessage": "You left items in your cart! Complete your purchase with {{checkout_url}}",
      "delayMinutes": 30,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "description": "Sends SMS when customer abandons checkout",
      "variables": [
        "{{checkout_url}}",
        "{{customer_name}}",
        "{{cart_total}}",
        "{{currency}}",
        "{{shop_name}}"
      ],
      "isDefault": true,
      "stats": {
        "totalSent": 1500,
        "totalDelivered": 1425,
        "totalFailed": 75,
        "totalClicked": 285,
        "deliveryRate": 95,
        "clickRate": 19
      }
    }
  }
}
```

### 3. Update Automation

**PATCH** `/automations/:type`

Update automation settings (active status, message, delay).

#### Request Body

```json
{
  "active": true,
  "message": "Don't forget your items! Complete your purchase: {{checkout_url}}",
  "delayMinutes": 45
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "automation": {
      "id": "automation_123",
      "type": "abandoned_checkout",
      "active": true,
      "message": "Don't forget your items! Complete your purchase: {{checkout_url}}",
      "defaultMessage": "You left items in your cart! Complete your purchase with {{checkout_url}}",
      "delayMinutes": 45,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "description": "Sends SMS when customer abandons checkout",
      "variables": [
        "{{checkout_url}}",
        "{{customer_name}}",
        "{{cart_total}}",
        "{{currency}}",
        "{{shop_name}}"
      ],
      "isDefault": false
    }
  }
}
```

### 4. Reset Automation to Default

**POST** `/automations/:type/reset`

Reset automation to its original default message and settings.

#### Response

```json
{
  "success": true,
  "message": "Automation reset to default successfully",
  "data": {
    "automation": {
      "id": "automation_123",
      "type": "abandoned_checkout",
      "active": false,
      "message": "You left items in your cart! Complete your purchase with {{checkout_url}}",
      "defaultMessage": "You left items in your cart! Complete your purchase with {{checkout_url}}",
      "delayMinutes": 30,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "description": "Sends SMS when customer abandons checkout",
      "variables": [
        "{{checkout_url}}",
        "{{customer_name}}",
        "{{cart_total}}",
        "{{currency}}",
        "{{shop_name}}"
      ],
      "isDefault": true
    }
  }
}
```

### 5. Get Automation Statistics

**GET** `/automations/stats`

Get aggregated statistics for all automations.

#### Response

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalSent": 5000,
      "totalDelivered": 4750,
      "totalFailed": 250,
      "totalClicked": 950,
      "activeAutomations": 3,
      "deliveryRate": 95,
      "clickRate": 19
    }
  }
}
```

### 6. Preview Automation Message

**POST** `/automations/preview`

Preview how an automation message will look with sample data.

#### Request Body

```json
{
  "type": "abandoned_checkout",
  "message": "Don't forget your items! Complete your purchase: {{checkout_url}}",
  "sampleData": {
    "checkout_url": "https://shop.myshopify.com/checkout/recovery/abc123",
    "customer_name": "John Doe",
    "cart_total": 99.99,
    "currency": "USD",
    "shop_name": "My Store"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "originalMessage": "Don't forget your items! Complete your purchase: {{checkout_url}}",
    "renderedMessage": "Don't forget your items! Complete your purchase: https://shop.myshopify.com/checkout/recovery/abc123",
    "sampleData": {
      "checkout_url": "https://shop.myshopify.com/checkout/recovery/abc123",
      "customer_name": "John Doe",
      "cart_total": 99.99,
      "currency": "USD",
      "shop_name": "My Store"
    },
    "variables": [
      "{{checkout_url}}",
      "{{customer_name}}",
      "{{cart_total}}",
      "{{currency}}",
      "{{shop_name}}"
    ],
    "type": "abandoned_checkout"
  }
}
```

### 7. Get Automation Types

**GET** `/automations/types`

Get all available automation types with descriptions.

#### Response

```json
{
  "success": true,
  "data": {
    "types": [
      {
        "type": "abandoned_checkout",
        "description": "Sends SMS when customer abandons checkout",
        "defaultMessage": "You left items in your cart! Complete your purchase with {{checkout_url}}",
        "hasDelay": true,
        "variables": [
          "{{checkout_url}}",
          "{{customer_name}}",
          "{{cart_total}}",
          "{{currency}}",
          "{{shop_name}}"
        ],
        "exampleMessage": "You left items in your cart! Complete your purchase with {{checkout_url}}"
      }
    ]
  }
}
```

## Data Models

### Automation

| Field            | Type    | Description                               |
| ---------------- | ------- | ----------------------------------------- |
| `id`             | string  | Unique automation identifier              |
| `type`           | string  | Automation type (predefined)              |
| `active`         | boolean | Whether automation is enabled             |
| `message`        | string  | Current message content                   |
| `defaultMessage` | string  | Original default message                  |
| `delayMinutes`   | integer | Delay in minutes (for abandoned checkout) |
| `createdAt`      | string  | Creation timestamp                        |
| `updatedAt`      | string  | Last update timestamp                     |
| `description`    | string  | Human-readable description                |
| `variables`      | array   | Available template variables              |
| `isDefault`      | boolean | Whether message is unchanged from default |

### Automation Statistics

| Field               | Type    | Description                  |
| ------------------- | ------- | ---------------------------- |
| `totalSent`         | integer | Total messages sent          |
| `totalDelivered`    | integer | Total messages delivered     |
| `totalFailed`       | integer | Total failed messages        |
| `totalClicked`      | integer | Total messages with clicks   |
| `activeAutomations` | integer | Number of active automations |
| `deliveryRate`      | integer | Delivery rate percentage     |
| `clickRate`         | integer | Click rate percentage        |

## Template Variables

### Abandoned Checkout Variables

- `{{checkout_url}}` - Recovery URL for abandoned checkout
- `{{customer_name}}` - Customer's name
- `{{cart_total}}` - Total cart value
- `{{currency}}` - Currency code
- `{{shop_name}}` - Store name

### Welcome Variables

- `{{customer_name}}` - Customer's name
- `{{shop_name}}` - Store name
- `{{discount_code}}` - Welcome discount code
- `{{discount_value}}` - Discount percentage

### Winback Variables

- `{{customer_name}}` - Customer's name
- `{{shop_name}}` - Store name
- `{{discount_code}}` - Winback discount code
- `{{discount_value}}` - Discount percentage

### Post Purchase Variables

- `{{customer_name}}` - Customer's name
- `{{order_number}}` - Order number
- `{{order_total}}` - Order total
- `{{currency}}` - Currency code
- `{{shop_name}}` - Store name

### Fulfillment Update Variables

- `{{customer_name}}` - Customer's name
- `{{order_number}}` - Order number
- `{{tracking_number}}` - Tracking number
- `{{tracking_url}}` - Tracking URL
- `{{carrier}}` - Shipping carrier
- `{{shop_name}}` - Store name

## Error Responses

### 400 Bad Request

```json
{
  "error": "invalid_automation_type",
  "message": "Invalid automation type. Must be one of: abandoned_checkout, welcome, winback, post_purchase, fulfillment_update"
}
```

### 400 Validation Failed

```json
{
  "error": "validation_failed",
  "message": "Validation failed",
  "details": ["Message cannot be empty", "Delay minutes must be non-negative"]
}
```

### 404 Not Found

```json
{
  "error": "automation_not_found",
  "message": "Automation not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "automations_fetch_failed",
  "message": "Failed to fetch automations"
}
```

## Rate Limits

- **List/Get**: 100 requests per minute
- **Update**: 20 requests per minute
- **Reset**: 10 requests per minute
- **Preview**: 50 requests per minute
- **Stats**: 30 requests per minute

## Examples

### List All Automations

```bash
curl -X GET "/automations" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Update Abandoned Checkout Automation

```bash
curl -X PATCH "/automations/abandoned_checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com" \
  -d '{
    "active": true,
    "message": "Don'\''t forget your items! Complete your purchase: {{checkout_url}}",
    "delayMinutes": 45
  }'
```

### Preview Welcome Message

```bash
curl -X POST "/automations/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com" \
  -d '{
    "type": "welcome",
    "message": "Welcome {{customer_name}}! Get {{discount_value}}% off with code {{discount_code}}",
    "sampleData": {
      "customer_name": "John Doe",
      "discount_code": "WELCOME10",
      "discount_value": 10
    }
  }'
```

### Reset Automation to Default

```bash
curl -X POST "/automations/abandoned_checkout/reset" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

## Frontend Integration

The Automations page is designed to work seamlessly with Shopify App frontend using Polaris components. See `frontend-examples/Automations.tsx` for a complete implementation example.

### Key Features

- **Automation Browser**: View all automations with status and statistics
- **Edit Interface**: Toggle active status and edit messages
- **Preview Functionality**: Preview messages with sample data
- **Reset to Default**: Restore original professional messages
- **Performance Metrics**: View delivery and click rates
- **Variable Support**: See available template variables
- **Professional Defaults**: Expert-crafted default messages

### Automation Workflow

1. **View Automations**: See all available automation types
2. **Configure Settings**: Enable/disable and customize messages
3. **Preview Messages**: See how messages will look to customers
4. **Monitor Performance**: Track delivery and click rates
5. **Reset if Needed**: Restore original professional messages
6. **Optimize**: Use performance data to improve automations

## Best Practices

### ✅ **Do**

- Use professional default messages as starting points
- Preview messages before activating
- Monitor performance metrics regularly
- Keep messages concise and clear
- Use appropriate variables for personalization
- Test automations with sample data

### ❌ **Don't**

- Use overly long messages
- Ignore performance metrics
- Activate automations without previewing
- Remove important variables
- Use unprofessional language
- Ignore delivery rates

## Professional Default Messages

### Abandoned Checkout

> "You left items in your cart! Complete your purchase with {{checkout_url}}"

### Welcome

> "Welcome to {{shop_name}}! Use code WELCOME10 for 10% off your first order."

### Winback

> "We miss you! Come back and save 15% with code COMEBACK15"

### Post Purchase

> "Thank you for your order! Track your package: {{tracking_url}}"

### Fulfillment Update

> "Your order #{{order_number}} is on its way! Track: {{tracking_url}}"

## Seeding Process

### Initial Data Setup

The system automatically seeds **5 automation types** during deployment:

```bash
# Run the seeder
npx prisma db seed
```

### Seeded Automations Structure

```
5 Automation Types with Professional Default Messages:

1. abandoned_checkout
   - Default: "You left items in your cart! Complete your purchase with {{checkout_url}}"
   - Delay: 30 minutes
   - Variables: {{checkout_url}}, {{customer_name}}, {{cart_total}}, {{currency}}, {{shop_name}}

2. welcome
   - Default: "Welcome to {{shop_name}}! Use code WELCOME10 for 10% off your first order."
   - Delay: None (immediate)
   - Variables: {{customer_name}}, {{shop_name}}, {{discount_code}}, {{discount_value}}

3. winback
   - Default: "We miss you! Come back and save 15% with code COMEBACK15"
   - Delay: None (immediate)
   - Variables: {{customer_name}}, {{shop_name}}, {{discount_code}}, {{discount_value}}

4. post_purchase
   - Default: "Thank you for your order! Track your package: {{tracking_url}}"
   - Delay: None (immediate)
   - Variables: {{customer_name}}, {{order_number}}, {{order_total}}, {{currency}}, {{shop_name}}

5. fulfillment_update
   - Default: "Your order #{{order_number}} is on its way! Track: {{tracking_url}}"
   - Delay: None (immediate)
   - Variables: {{customer_name}}, {{order_number}}, {{tracking_number}}, {{tracking_url}}, {{carrier}}, {{shop_name}}
```

### User Customization Flow

1. **Initial State**: All automations are inactive by default
2. **Shop Activation**: Each shop can activate automations independently
3. **Message Editing**: Users can customize messages while maintaining professional quality
4. **Variable Usage**: Dynamic content with context-aware variables
5. **Reset Capability**: Restore original professional messages anytime

### Professional Default Messages

Each automation type comes with expert-crafted default messages:

- **Abandoned Checkout**: Professional cart recovery message
- **Welcome**: Engaging new customer welcome with discount
- **Winback**: Re-engagement message for inactive customers
- **Post Purchase**: Order confirmation with tracking
- **Fulfillment Update**: Shipping notification with tracking

## Support

For automation-related questions:

- **Configuration**: How to set up automations
- **Message Customization**: Best practices for message editing
- **Performance Optimization**: Improving delivery and click rates
- **Variable Usage**: Using template variables effectively
- **Professional Standards**: Maintaining message quality
- **Seeding**: Automation data is automatically seeded during deployment
- **Reset Functionality**: Restore original professional messages
