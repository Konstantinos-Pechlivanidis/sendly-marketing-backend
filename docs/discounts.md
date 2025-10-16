# Discounts API Documentation

## Overview

The Discounts API provides **read-only integration** with Shopify's discount system. We do NOT provide discount creation, update, or deletion endpoints because Shopify Admin already provides comprehensive discount management.

## Why Read-Only Integration?

### 🎯 **Strategic Decision**

We use Shopify's native discount system instead of building our own because:

- ✅ **Shopify Admin** already provides comprehensive discount management
- ✅ **Advanced Features** like usage limits, customer eligibility, product restrictions
- ✅ **Native Integration** with Shopify's checkout and order system
- ✅ **Better UX** - users already know how to use Shopify Admin
- ✅ **Reduced Complexity** - less code to maintain and debug

### 📋 **What We Provide**

- **Discount Fetching** - Get existing discounts from Shopify
- **Discount Validation** - Check if discount codes exist and are active
- **Campaign Linking** - Link campaigns to existing Shopify discounts
- **Apply URL Generation** - Build discount apply URLs for campaigns

### ❌ **What We DON'T Provide**

- **Discount Creation** - Use Shopify Admin instead
- **Discount Updates** - Use Shopify Admin instead
- **Discount Deletion** - Use Shopify Admin instead
- **Discount Management UI** - Use Shopify Admin instead

## Base URL

```
/discounts
```

## Authentication

All endpoints require Shopify session token authentication via the `ensureShopContext` middleware.

## Endpoints

### 1. Fetch Discounts from Shopify

**GET** `/discounts`

Retrieve discounts from Shopify with optional search and filtering.

#### Query Parameters

| Parameter | Type    | Default | Description                           |
| --------- | ------- | ------- | ------------------------------------- |
| `query`   | string  | -       | Search query for discounts            |
| `limit`   | integer | 50      | Maximum number of discounts to return |

#### Response

```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "shopifyId": "gid://shopify/DiscountCodeNode/123",
        "code": "SUMMER20",
        "title": "Summer Sale 20% Off",
        "status": "ACTIVE",
        "startsAt": "2024-06-01T00:00:00Z",
        "endsAt": "2024-08-31T23:59:59Z",
        "usageLimit": 1000,
        "appliesOncePerCustomer": true,
        "minimumRequirement": {
          "greaterThanOrEqualToQuantity": 1
        },
        "customerSelection": {
          "allCustomers": true
        },
        "combinesWith": {
          "orderDiscounts": true,
          "productDiscounts": false,
          "shippingDiscounts": false
        }
      }
    ],
    "count": 1,
    "total": 1
  }
}
```

### 2. Validate Discount Code

**GET** `/discounts/validate/:code`

Check if a discount code exists in Shopify and is currently active.

#### Response

```json
{
  "success": true,
  "data": {
    "exists": true,
    "isActive": true,
    "discount": {
      "shopifyId": "gid://shopify/DiscountCodeNode/123",
      "code": "SUMMER20",
      "title": "Summer Sale 20% Off",
      "status": "ACTIVE",
      "startsAt": "2024-06-01T00:00:00Z",
      "endsAt": "2024-08-31T23:59:59Z",
      "usageLimit": 1000,
      "appliesOncePerCustomer": true
    }
  }
}
```

### 3. Get Discount for Campaign

**GET** `/discounts/campaign/:code`

Get discount details specifically for campaign linking. Validates that the discount is active and suitable for campaigns.

#### Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "discount": {
      "shopifyId": "gid://shopify/DiscountCodeNode/123",
      "code": "SUMMER20",
      "title": "Summer Sale 20% Off",
      "status": "ACTIVE",
      "startsAt": "2024-06-01T00:00:00Z",
      "endsAt": "2024-08-31T23:59:59Z",
      "usageLimit": 1000,
      "appliesOncePerCustomer": true
    }
  }
}
```

### 4. Build Discount Apply URL

**GET** `/discounts/apply-url`

Generate a discount apply URL for use in campaigns.

#### Query Parameters

| Parameter  | Type   | Required | Description                      |
| ---------- | ------ | -------- | -------------------------------- |
| `code`     | string | Yes      | Discount code                    |
| `redirect` | string | No       | Redirect path (default: `/cart`) |

#### Response

```json
{
  "success": true,
  "data": {
    "applyUrl": "https://shop.myshopify.com/cart?discount=SUMMER20",
    "discountCode": "SUMMER20",
    "redirect": "/cart"
  }
}
```

### 5. Search Discounts

**GET** `/discounts/search`

Search discounts with advanced filtering.

#### Query Parameters

| Parameter | Type    | Default | Description                              |
| --------- | ------- | ------- | ---------------------------------------- |
| `q`       | string  | -       | Search query                             |
| `status`  | string  | -       | Filter by status (ACTIVE, EXPIRED, etc.) |
| `limit`   | integer | 20      | Maximum results                          |

#### Response

```json
{
  "success": true,
  "data": {
    "discounts": [
      {
        "shopifyId": "gid://shopify/DiscountCodeNode/123",
        "code": "SUMMER20",
        "title": "Summer Sale 20% Off",
        "status": "ACTIVE"
      }
    ],
    "count": 1,
    "total": 1,
    "query": "summer",
    "status": "ACTIVE"
  }
}
```

### 6. Check Discount Conflicts

**GET** `/discounts/conflicts`

Check for potential conflicts with automatic discounts (advisory only).

#### Response

```json
{
  "success": true,
  "data": {
    "conflicts": [],
    "message": "No conflicts detected. Discounts are managed through Shopify Admin."
  }
}
```

## Data Models

### Discount

| Field                    | Type    | Description                             |
| ------------------------ | ------- | --------------------------------------- |
| `shopifyId`              | string  | Shopify discount ID                     |
| `code`                   | string  | Discount code                           |
| `title`                  | string  | Discount title                          |
| `status`                 | string  | Discount status (ACTIVE, EXPIRED, etc.) |
| `startsAt`               | string  | Start date (ISO 8601)                   |
| `endsAt`                 | string  | End date (ISO 8601)                     |
| `usageLimit`             | integer | Maximum usage limit                     |
| `appliesOncePerCustomer` | boolean | Once per customer flag                  |
| `minimumRequirement`     | object  | Minimum requirements                    |
| `customerSelection`      | object  | Customer eligibility                    |
| `combinesWith`           | object  | Combination rules                       |

## Error Responses

### 400 Bad Request

```json
{
  "error": "missing_discount_code",
  "message": "Discount code is required"
}
```

### 500 Internal Server Error

```json
{
  "error": "discounts_fetch_failed",
  "message": "Failed to fetch discounts from Shopify"
}
```

## Integration with Campaigns

### Campaign Discount Linking

Campaigns can link to existing Shopify discounts:

```json
{
  "campaign": {
    "name": "Summer Sale Campaign",
    "message": "Get 20% off with code SUMMER20!",
    "discountCode": "SUMMER20",
    "applyUrl": "https://shop.myshopify.com/cart?discount=SUMMER20"
  }
}
```

### Workflow

1. **Create Discount** in Shopify Admin
2. **Validate Discount** using our API
3. **Link to Campaign** in our app
4. **Send Campaign** with discount apply URL
5. **Customer Uses** discount at checkout

## Best Practices

### ✅ **Do**

- Use Shopify Admin for discount management
- Validate discounts before linking to campaigns
- Check discount status before sending campaigns
- Use descriptive discount codes
- Set appropriate usage limits

### ❌ **Don't**

- Try to create discounts through our API
- Link inactive discounts to campaigns
- Ignore discount expiration dates
- Use generic discount codes
- Set unlimited usage without monitoring

## Examples

### Fetch All Active Discounts

```bash
curl -X GET "/discounts?status=ACTIVE&limit=10" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Validate Discount Code

```bash
curl -X GET "/discounts/validate/SUMMER20" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Build Apply URL

```bash
curl -X GET "/discounts/apply-url?code=SUMMER20&redirect=/checkout" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Search Discounts

```bash
curl -X GET "/discounts/search?q=summer&status=ACTIVE" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

## Rate Limits

- **Fetch/Validate**: 100 requests per minute
- **Search**: 50 requests per minute
- **Apply URL**: 200 requests per minute

## Migration Guide

If you were using our old discount management endpoints:

1. **Create discounts** in Shopify Admin instead
2. **Use new read-only endpoints** for validation and linking
3. **Update your frontend** to use Shopify Admin for discount management
4. **Link existing discounts** to campaigns using our new API

## Support

For discount management questions:

- **Shopify Admin** - Use Shopify's built-in discount management
- **Our API** - Use for validation and campaign linking
- **Documentation** - See Shopify's discount documentation
