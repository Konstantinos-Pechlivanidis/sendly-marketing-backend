# Campaigns API Documentation

## Overview

The Campaigns API provides comprehensive SMS campaign management functionality with audience targeting, metrics tracking, and GDPR compliance. It supports campaign creation, audience preparation, sending, and detailed analytics.

## Base URL

```
/campaigns
```

## Authentication

All endpoints require Shopify session token authentication via the `ensureShopContext` middleware.

## Endpoints

### 1. List Campaigns

**GET** `/campaigns`

Retrieve a paginated list of campaigns with metrics.

#### Query Parameters

| Parameter   | Type    | Default   | Description                                          |
| ----------- | ------- | --------- | ---------------------------------------------------- |
| `page`      | integer | 1         | Page number (1-based)                                |
| `limit`     | integer | 20        | Number of campaigns per page (max 100)               |
| `status`    | string  | -         | Filter by status (draft, sending, completed, failed) |
| `sortBy`    | string  | createdAt | Sort field (createdAt, name, status, scheduleAt)     |
| `sortOrder` | string  | desc      | Sort order (asc, desc)                               |

#### Response

```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "camp_123",
        "name": "Summer Sale Campaign",
        "status": "completed",
        "scheduleAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T11:30:00Z",
        "bodyText": "Get 20% off your next purchase! Use code SAVE20",
        "discountId": "disc_123",
        "discountConfig": {
          "mode": "individual",
          "discountId": "disc_123"
        },
        "utmJson": {
          "audience": "all",
          "segments": 1,
          "hasUnsubscribe": true
        },
        "metrics": {
          "total": 1000,
          "sent": 950,
          "delivered": 920,
          "failed": 30,
          "clicked": 150,
          "deliveryRate": 97,
          "clickRate": 16
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
    }
  }
}
```

### 2. Get Single Campaign

**GET** `/campaigns/:id`

Retrieve detailed information about a specific campaign.

#### Response

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "camp_123",
      "name": "Summer Sale Campaign",
      "status": "completed",
      "scheduleAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:30:00Z",
      "bodyText": "Get 20% off your next purchase! Use code SAVE20",
      "discountId": "disc_123",
      "discountConfig": {
        "mode": "individual",
        "discountId": "disc_123"
      },
      "utmJson": {
        "audience": "all",
        "segments": 1,
        "hasUnsubscribe": true
      },
      "recipients": [
        {
          "id": "recip_123",
          "status": "delivered",
          "createdAt": "2024-01-15T10:30:00Z",
          "contact": {
            "id": "contact_123",
            "firstName": "John",
            "lastName": "Doe",
            "phoneE164": "+1234567890",
            "gender": "male",
            "smsConsentState": "opted_in"
          }
        }
      ],
      "metrics": {
        "total": 1000,
        "sent": 950,
        "delivered": 920,
        "failed": 30,
        "clicked": 150,
        "deliveryRate": 97,
        "clickRate": 16,
        "failureRate": 3
      }
    }
  }
}
```

### 3. Create Campaign

**POST** `/campaigns`

Create a new SMS campaign.

#### Request Body

```json
{
  "name": "Summer Sale Campaign",
  "audience": "all",
  "message": "Get 20% off your next purchase! Use code SAVE20",
  "discountId": "disc_123",
  "scheduleType": "immediate",
  "scheduleAt": "2024-01-15T10:30:00Z",
  "recurringDays": 7
}
```

#### Schedule Types

- **`immediate`**: Send campaign immediately after preparation
- **`scheduled`**: Send campaign at a specific date and time
- **`recurring`**: Send campaign repeatedly at specified intervals

#### Audience Options

- `all`: All opted-in contacts
- `men`: Male contacts only
- `women`: Female contacts only

#### Response

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "camp_123",
      "name": "Summer Sale Campaign",
      "status": "draft",
      "audience": "all",
      "segments": 1,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 4. Update Campaign

**PUT** `/campaigns/:id`

Update an existing campaign.

#### Request Body

```json
{
  "name": "Updated Campaign Name",
  "audience": "women",
  "message": "Updated message content",
  "discountId": "disc_456",
  "scheduleAt": "2024-01-16T10:30:00Z"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "camp_123",
      "name": "Updated Campaign Name",
      "status": "draft",
      "updatedAt": "2024-01-15T11:30:00Z"
    }
  }
}
```

### 5. Delete Campaign

**DELETE** `/campaigns/:id`

Delete a campaign (only if not sending or completed).

#### Response

```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

### 6. Prepare Campaign Audience

**POST** `/campaigns/:id/prepare`

Prepare the campaign audience based on gender filtering.

#### Request Body

```json
{
  "audience": "all"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "audienceCount": 1000,
    "audience": "all",
    "campaignId": "camp_123"
  }
}
```

### 7. Send Campaign

**POST** `/campaigns/:id/send`

Send the campaign to prepared recipients.

#### Response

```json
{
  "success": true,
  "message": "Campaign send job enqueued",
  "data": {
    "campaignId": "camp_123",
    "recipientCount": 1000,
    "status": "sending"
  }
}
```

### 8. Update Campaign Schedule

**PUT** `/campaigns/:id/schedule`

Update the schedule of an existing campaign.

#### Request Body

```json
{
  "scheduleType": "scheduled",
  "scheduleAt": "2024-01-16T10:30:00Z",
  "recurringDays": 7
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "camp_123",
      "status": "scheduled",
      "scheduleAt": "2024-01-16T10:30:00Z",
      "scheduleType": "scheduled",
      "recurringDays": null
    }
  }
}
```

### 9. Get Campaign Metrics

**GET** `/campaigns/:id/metrics`

Get detailed metrics for a specific campaign.

#### Response

```json
{
  "success": true,
  "data": {
    "metrics": {
      "total": 1000,
      "sent": 950,
      "delivered": 920,
      "failed": 30,
      "clicked": 150,
      "skipped": 0,
      "deliveryRate": 97,
      "clickRate": 16,
      "failureRate": 3,
      "genderBreakdown": {
        "male": 500,
        "female": 500
      },
      "hourlyStats": [
        {
          "status": "delivered",
          "_count": 920
        },
        {
          "status": "failed",
          "_count": 30
        }
      ]
    }
  }
}
```

### 10. Get Campaigns Statistics

**GET** `/campaigns/stats`

Get aggregated statistics about campaigns.

#### Response

```json
{
  "success": true,
  "data": {
    "total": 50,
    "draft": 10,
    "sending": 2,
    "completed": 35,
    "failed": 3,
    "recent": 5,
    "completionRate": 70
  }
}
```

## Data Models

### Campaign

| Field            | Type   | Description                                         |
| ---------------- | ------ | --------------------------------------------------- |
| `id`             | string | Unique campaign identifier                          |
| `name`           | string | Campaign name                                       |
| `status`         | string | Campaign status (draft, sending, completed, failed) |
| `scheduleAt`     | string | ISO 8601 timestamp of scheduled send time           |
| `bodyText`       | string | SMS message content with unsubscribe link           |
| `discountId`     | string | Associated discount ID                              |
| `discountConfig` | object | Discount configuration                              |
| `utmJson`        | object | UTM parameters and campaign metadata                |
| `createdAt`      | string | ISO 8601 timestamp of creation                      |
| `updatedAt`      | string | ISO 8601 timestamp of last update                   |

### Campaign Metrics

| Field          | Type    | Description                  |
| -------------- | ------- | ---------------------------- |
| `total`        | integer | Total number of recipients   |
| `sent`         | integer | Number of messages sent      |
| `delivered`    | integer | Number of messages delivered |
| `failed`       | integer | Number of failed messages    |
| `clicked`      | integer | Number of clicked links      |
| `skipped`      | integer | Number of skipped recipients |
| `deliveryRate` | integer | Delivery rate percentage     |
| `clickRate`    | integer | Click rate percentage        |
| `failureRate`  | integer | Failure rate percentage      |

## GDPR Compliance

### Automatic Unsubscribe Links

All campaign messages automatically include an unsubscribe link:

```
Your message content here.

To unsubscribe, reply STOP or visit: https://your-app.com/unsubscribe?shop=shop-domain
```

### Consent Requirements

- Only contacts with `smsConsentState: 'opted_in'` are included in campaigns
- Contacts with `optedOut: true` are automatically excluded
- Gender-based filtering respects consent preferences

## Error Responses

### 400 Bad Request

```json
{
  "error": "missing_required_fields",
  "message": "Name, audience, and message are required"
}
```

### 404 Not Found

```json
{
  "error": "campaign_not_found",
  "message": "Campaign not found"
}
```

### 409 Conflict

```json
{
  "error": "campaign_locked",
  "message": "Cannot update campaign that is already sending or completed"
}
```

### 500 Internal Server Error

```json
{
  "error": "campaign_creation_failed",
  "message": "Failed to create campaign"
}
```

## Rate Limits

- List campaigns: 100 requests per minute
- Create/Update/Delete: 50 requests per minute
- Send campaign: 10 requests per minute
- Metrics: 200 requests per minute

## Examples

### Create Campaign for Women Only

```bash
curl -X POST "/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com" \
  -d '{
    "name": "Women\'s Sale",
    "audience": "women",
    "message": "Exclusive 30% off for women! Use code WOMEN30",
    "discountId": "disc_123"
  }'
```

### Prepare Campaign Audience

```bash
curl -X POST "/campaigns/camp_123/prepare" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com" \
  -d '{
    "audience": "all"
  }'
```

### Send Campaign

```bash
curl -X POST "/campaigns/camp_123/send" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

### Get Campaign Metrics

```bash
curl -X GET "/campaigns/camp_123/metrics" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "X-Shopify-Shop-Domain: your-shop.myshopify.com"
```

## Frontend Integration

The Campaigns page is designed to work seamlessly with Shopify App frontend using Polaris components. See `frontend-examples/Campaigns.tsx` for a complete implementation example.

### Key Features

- **Campaign Management**: Create, edit, delete campaigns
- **Audience Selection**: Gender-based targeting (all, men, women)
- **Message Composition**: SMS message editor with character count
- **Discount Integration**: Link campaigns to Shopify discount codes
- **Scheduling**: Schedule campaigns for future sending
- **Metrics Dashboard**: Real-time campaign performance metrics
- **GDPR Compliance**: Automatic unsubscribe link insertion
- **Batch Processing**: Efficient handling of large audiences
- **Status Tracking**: Real-time campaign status updates
- **Analytics**: Detailed performance analytics and reporting

### Campaign Workflow

1. **Create Campaign**: Set name, audience, message, and optional discount
2. **Prepare Audience**: System filters contacts based on gender and consent
3. **Review & Send**: Review audience size and send campaign
4. **Monitor Progress**: Track delivery and engagement metrics
5. **Analyze Results**: View detailed performance analytics
