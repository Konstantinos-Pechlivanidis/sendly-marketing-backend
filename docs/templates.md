# Templates API Documentation

## Overview

The Templates API provides access to a global library of pre-built SMS templates that are shared across all users. These templates are created by our team and are available for all Shopify stores using our SMS marketing app.

## Architecture

### Database Schema

```sql
model Template {
  id          String    @id @default(cuid())
  name        String
  body        String
  trigger     String    // e.g., abandoned_checkout, order_paid, etc.
  category    String    // e.g., 'fashion' | 'gym' | 'store' | 'default'
  description String?
  isActive    Boolean   @default(true)
  createdBy   String    // admin identifier or system
  version     Int       @default(1)
  // Metrics
  sentCount   Int       @default(0)
  usedCount   Int       @default(0)
  lastUsedAt  DateTime?
  shopScoped  Boolean   @default(false) // if some templates are global vs shop-specific
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([category])
  @@index([trigger])
  @@index([isActive])
}
```

### Seeded Data Structure

The system comes pre-loaded with **20 global templates** organized as:

- **5 Triggers** × **4 Categories** = **20 Templates**
- **Triggers**: `abandoned_checkout`, `welcome`, `order_paid`, `fulfillment_update`, `back_in_stock`
- **Categories**: `fashion`, `gym`, `store`, `default`

### Template Variables System

Each template supports dynamic variables based on trigger type:

- **Welcome**: `{{customer_name}}`, `{{shop_name}}`, `{{discount_code}}`, `{{discount_value}}`
- **Abandoned Checkout**: `{{customer_name}}`, `{{cart_total}}`, `{{currency}}`, `{{recovery_url}}`
- **Order Paid**: `{{customer_name}}`, `{{order_number}}`, `{{order_total}}`, `{{tracking_number}}`
- **Fulfillment Update**: `{{customer_name}}`, `{{order_number}}`, `{{tracking_number}}`, `{{carrier}}`
- **Back in Stock**: `{{customer_name}}`, `{{product_name}}`, `{{product_url}}`, `{{inventory_count}}`

## Key Features

- **Global Templates**: Shared templates available to all users
- **Category Filtering**: Templates organized by store categories (fashion, gym, store, default)
- **Trigger-based**: Templates for different SMS triggers (welcome, abandoned cart, order updates, etc.)
- **Performance Metrics**: Track template usage, conversions, and effectiveness
- **Template Preview**: Preview templates with sample data
- **Usage Tracking**: Record when templates are used in campaigns
- **Variable System**: Dynamic content with context-aware variables
- **Conversion Tracking**: Monitor template effectiveness across all users

## Base URL

```
/templates
```

## Authentication

All endpoints require Shopify session token authentication via the `ensureShopContext` middleware.

## Endpoints

### 1. List Global Templates

**GET** `/templates`

Retrieve a paginated list of global templates with metrics.

#### Query Parameters

| Parameter   | Type    | Default   | Description                                                           |
| ----------- | ------- | --------- | --------------------------------------------------------------------- |
| `category`  | string  | -         | Filter by category (fashion, gym, store, default)                     |
| `trigger`   | string  | -         | Filter by trigger type                                                |
| `search`    | string  | -         | Search in name, description, or content                               |
| `page`      | integer | 1         | Page number (1-based)                                                 |
| `limit`     | integer | 20        | Number of templates per page (max 100)                                |
| `sortBy`    | string  | sentCount | Sort field (sentCount, usedCount, name, category, trigger, createdAt) |
| `sortOrder` | string  | desc      | Sort order (asc, desc)                                                |

#### Response

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_123",
        "name": "Welcome New Customer",
        "body": "Welcome {{customer_name}}! Get {{discount_value}}% off your first order with code {{discount_code}}",
        "trigger": "welcome",
        "category": "fashion",
        "description": "Welcome new customers with a discount offer",
        "version": 1,
        "sentCount": 1500,
        "usedCount": 450,
        "lastUsedAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "metrics": {
          "sentCount": 1500,
          "usedCount": 450,
          "conversionRate": 30,
          "lastUsedAt": "2024-01-15T10:30:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "category": "fashion",
      "trigger": "welcome",
      "search": "welcome",
      "sortBy": "sentCount",
      "sortOrder": "desc"
    }
  }
}
```

### 2. Get Single Template

**GET** `/templates/:id`

Retrieve detailed information about a specific template.

#### Response

```json
{
  "success": true,
  "data": {
    "template": {
      "id": "template_123",
      "name": "Welcome New Customer",
      "body": "Welcome {{customer_name}}! Get {{discount_value}}% off your first order with code {{discount_code}}",
      "trigger": "welcome",
      "category": "fashion",
      "description": "Welcome new customers with a discount offer",
      "version": 1,
      "sentCount": 1500,
      "usedCount": 450,
      "lastUsedAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "metrics": {
        "sentCount": 1500,
        "usedCount": 450,
        "conversionRate": 30,
        "lastUsedAt": "2024-01-15T10:30:00Z"
      }
    }
  }
}
```

### 3. Get Template Categories

**GET** `/templates/categories`

Get available template categories with counts.

#### Response

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "fashion",
        "count": 15
      },
      {
        "category": "gym",
        "count": 8
      },
      {
        "category": "store",
        "count": 12
      },
      {
        "category": "default",
        "count": 5
      }
    ]
  }
}
```

### 4. Get Template Triggers

**GET** `/templates/triggers`

Get available template triggers with counts.

#### Response

```json
{
  "success": true,
  "data": {
    "triggers": [
      {
        "trigger": "welcome",
        "count": 10
      },
      {
        "trigger": "abandoned_checkout",
        "count": 8
      },
      {
        "trigger": "order_created",
        "count": 6
      },
      {
        "trigger": "order_paid",
        "count": 5
      },
      {
        "trigger": "fulfillment_update",
        "count": 4
      },
      {
        "trigger": "back_in_stock",
        "count": 3
      }
    ]
  }
}
```

### 5. Get Popular Templates

**GET** `/templates/popular`

Get most popular templates based on usage.

#### Query Parameters

| Parameter | Type    | Default | Description                           |
| --------- | ------- | ------- | ------------------------------------- |
| `limit`   | integer | 10      | Maximum number of templates to return |

#### Response

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_123",
        "name": "Welcome New Customer",
        "body": "Welcome {{customer_name}}! Get {{discount_value}}% off your first order with code {{discount_code}}",
        "trigger": "welcome",
        "category": "fashion",
        "description": "Welcome new customers with a discount offer",
        "sentCount": 1500,
        "usedCount": 450,
        "lastUsedAt": "2024-01-15T10:30:00Z",
        "metrics": {
          "sentCount": 1500,
          "usedCount": 450,
          "conversionRate": 30,
          "lastUsedAt": "2024-01-15T10:30:00Z"
        }
      }
    ],
    "count": 10
  }
}
```

### 6. Get Template Statistics

**GET** `/templates/stats`

Get aggregated statistics about templates.

#### Response

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTemplates": 40,
      "activeTemplates": 40,
      "totalSent": 50000,
      "totalUsed": 15000,
      "overallConversionRate": 30
    },
    "categoryStats": [
      {
        "category": "fashion",
        "count": 15,
        "sentCount": 25000,
        "usedCount": 7500,
        "conversionRate": 30
      },
      {
        "category": "gym",
        "count": 8,
        "sentCount": 12000,
        "usedCount": 3600,
        "conversionRate": 30
      }
    ],
    "triggerStats": [
      {
        "trigger": "welcome",
        "count": 10,
        "sentCount": 20000,
        "usedCount": 6000,
        "conversionRate": 30
      },
      {
        "trigger": "abandoned_checkout",
        "count": 8,
        "sentCount": 15000,
        "usedCount": 4500,
        "conversionRate": 30
      }
    ]
  }
}
```

### 7. Record Template Usage

**POST** `/templates/:id/use`

Record that a template was used in a campaign.

#### Response

```json
{
  "success": true,
  "message": "Template usage recorded",
  "data": {
    "templateId": "template_123",
    "usedCount": 451
  }
}
```

### 8. Preview Template

**POST** `/templates/preview`

Preview a template with sample data.

#### Request Body

```json
{
  "templateId": "template_123",
  "sampleData": {
    "customer_name": "John Doe",
    "discount_code": "WELCOME10",
    "discount_value": 10
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "template": {
      "id": "template_123",
      "name": "Welcome New Customer",
      "trigger": "welcome",
      "category": "fashion"
    },
    "renderedBody": "Welcome John Doe! Get 10% off your first order with code WELCOME10",
    "sampleData": {
      "customer_name": "John Doe",
      "discount_code": "WELCOME10",
      "discount_value": 10
    }
  }
}
```

## Data Models

### Template

| Field         | Type    | Description                     |
| ------------- | ------- | ------------------------------- |
| `id`          | string  | Unique template identifier      |
| `name`        | string  | Template name                   |
| `body`        | string  | Template content with variables |
| `trigger`     | string  | SMS trigger type                |
| `category`    | string  | Template category               |
| `description` | string  | Template description            |
| `version`     | integer | Template version number         |
| `sentCount`   | integer | Total times sent                |
| `usedCount`   | integer | Total times used                |
| `lastUsedAt`  | string  | Last usage timestamp            |
| `createdAt`   | string  | Creation timestamp              |
| `updatedAt`   | string  | Last update timestamp           |

### Template Metrics

| Field            | Type    | Description                |
| ---------------- | ------- | -------------------------- |
| `sentCount`      | integer | Total times sent           |
| `usedCount`      | integer | Total times used           |
| `conversionRate` | integer | Conversion rate percentage |
| `lastUsedAt`     | string  | Last usage timestamp       |

## Template Variables

### Available Variables by Trigger

#### Welcome Trigger

- `{{customer_name}}` - Customer's name
- `{{shop_name}}` - Store name
- `{{discount_code}}` - Discount code
- `{{discount_value}}` - Discount percentage

#### Abandoned Checkout Trigger

- `{{customer_name}}` - Customer's name
- `{{cart_total}}` - Cart total amount
- `{{currency}}` - Currency code
- `{{recovery_url}}` - Checkout recovery URL
- `{{shop_name}}` - Store name

#### Order Created Trigger

- `{{customer_name}}` - Customer's name
- `{{order_number}}` - Order number
- `{{order_total}}` - Order total
- `{{currency}}` - Currency code
- `{{order_url}}` - Order URL
- `{{shop_name}}` - Store name

#### Order Paid Trigger

- `{{customer_name}}` - Customer's name
- `{{order_number}}` - Order number
- `{{order_total}}` - Order total
- `{{currency}}` - Currency code
- `{{tracking_number}}` - Tracking number
- `{{order_url}}` - Order URL
- `{{shop_name}}` - Store name

#### Fulfillment Update Trigger

- `{{customer_name}}` - Customer's name
- `{{order_number}}` - Order number
- `{{tracking_number}}` - Tracking number
- `{{carrier}}` - Shipping carrier
- `{{tracking_url}}` - Tracking URL
- `{{shop_name}}` - Store name

#### Back in Stock Trigger

- `{{customer_name}}` - Customer's name
- `{{product_name}}` - Product name
- `{{product_url}}` - Product URL
- `{{inventory_count}}` - Available quantity
- `{{shop_name}}` - Store name

## Error Responses

### 400 Bad Request

```json
{
  "error": "missing_template_id",
  "message": "Template ID is required"
}
```

### 404 Not Found

```json
{
  "error": "template_not_found",
  "message": "Template not found or not available"
}
```

### 500 Internal Server Error

```json
{
  "error": "templates_fetch_failed",
  "message": "Failed to fetch global templates"
}
```

## Rate Limits

- **List/Search**: 100 requests per minute
- **Get Single**: 200 requests per minute
- **Stats**: 50 requests per minute
- **Use/Preview**: 20 requests per minute

## Examples

### List Fashion Templates

```bash
curl -X GET "/templates?category=fashion&limit=10" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Search Welcome Templates

```bash
curl -X GET "/templates?trigger=welcome&search=discount" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Get Popular Templates

```bash
curl -X GET "/templates/popular?limit=5" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Record Template Usage

```bash
curl -X POST "/templates/template_123/use" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Preview Template

```bash
curl -X POST "/templates/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com" \
  -d '{
    "templateId": "template_123",
    "sampleData": {
      "customer_name": "John Doe",
      "discount_code": "WELCOME10",
      "discount_value": 10
    }
  }'
```

## Frontend Integration

The Templates page is designed to work seamlessly with Shopify App frontend using Polaris components. See `frontend-examples/Templates.tsx` for a complete implementation example.

### Key Features

- **Template Browser**: Browse and search global templates
- **Category Filtering**: Filter by store categories
- **Trigger Filtering**: Filter by SMS triggers
- **Performance Metrics**: View template usage and conversion rates
- **Template Preview**: Preview templates with sample data
- **Usage Tracking**: Record when templates are used
- **Responsive Design**: Mobile-friendly interface
- **Search Functionality**: Search by name, description, or content
- **Sorting Options**: Sort by popularity, usage, name, etc.
- **Pagination**: Handle large template libraries

### Template Workflow

1. **Browse Templates**: View available templates by category or trigger
2. **Search & Filter**: Find specific templates using search and filters
3. **Preview Template**: See how template looks with sample data
4. **Use Template**: Select template for your campaign
5. **Track Usage**: Monitor template performance and conversions
6. **Optimize Campaigns**: Use high-performing templates

## Best Practices

### ✅ **Do**

- Use templates that match your store category
- Preview templates before using them
- Track template performance
- Customize templates for your brand
- Use high-converting templates

### ❌ **Don't**

- Use templates without previewing
- Ignore template performance metrics
- Use outdated templates
- Overuse the same template
- Ignore category relevance

## Seeding Process

### Initial Data Setup

The system automatically seeds **20 global templates** during deployment:

```bash
# Run the seeder
npx prisma db seed
```

### Seeded Templates Structure

```
5 Triggers × 4 Categories = 20 Templates

Triggers:
- abandoned_checkout
- welcome
- order_paid
- fulfillment_update
- back_in_stock

Categories:
- fashion
- gym
- store
- default
```

### Template Content Examples

Each template includes professional content with variables:

**Fashion Welcome Template:**

```
"Welcome to {{shop_name}}! Get 15% off your first order with code WELCOME15. Shop now: {{shop_url}}"
```

**Gym Abandoned Checkout Template:**

```
"Don't let your fitness goals slip away! Complete your purchase: {{checkout_url}}"
```

**Store Order Confirmation Template:**

```
"Thank you for your order! Order #{{order_number}} is being processed."
```

### Template Variables by Trigger

- **Welcome**: `{{customer_name}}`, `{{shop_name}}`, `{{discount_code}}`, `{{discount_value}}`, `{{shop_url}}`
- **Abandoned Checkout**: `{{customer_name}}`, `{{cart_total}}`, `{{currency}}`, `{{checkout_url}}`, `{{shop_name}}`
- **Order Paid**: `{{customer_name}}`, `{{order_number}}`, `{{order_total}}`, `{{currency}}`, `{{shop_name}}`
- **Fulfillment Update**: `{{customer_name}}`, `{{order_number}}`, `{{tracking_number}}`, `{{tracking_url}}`, `{{carrier}}`, `{{shop_name}}`
- **Back in Stock**: `{{customer_name}}`, `{{product_name}}`, `{{product_url}}`, `{{inventory_count}}`, `{{shop_name}}`

## Support

For template-related questions:

- **Template Library**: Browse available templates
- **Performance Metrics**: Track template effectiveness
- **Custom Templates**: Contact support for custom template requests
- **Best Practices**: Follow template usage guidelines
- **Seeding**: Template data is automatically seeded during deployment
- **Variables**: Use appropriate variables for each trigger type
