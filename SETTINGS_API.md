# Settings & Billing API Documentation

## Overview

The Settings module provides comprehensive user configuration management, credit balance tracking, and Stripe payment integration for SMS credit packages. Users can manage their sender identity, view usage statistics, and purchase credits through a secure Stripe checkout flow.

## Features

- **Sender Number Management**: Set and update SMS sender number/name
- **Credit System**: 1 credit = 1 SMS message with automatic deduction
- **Stripe Integration**: Secure payment processing for credit packages
- **Usage Analytics**: Track spending, message counts, and account statistics
- **Webhook Support**: Real-time payment confirmation via Stripe webhooks

## Database Schema

### Shop Model (Updated)
```prisma
model Shop {
  id           String              @id @default(cuid())
  shopDomain   String              @unique
  credits      Int                 @default(0)  // SMS credits balance
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
  // ... other relations
  billingTransactions BillingTransaction[]
  settings     ShopSettings?
}
```

### BillingTransaction Model
```prisma
model BillingTransaction {
  id              String   @id @default(cuid())
  shopId          String
  creditsAdded    Int
  amount          Int      // Amount in cents
  currency        String   @default("EUR")
  packageType     String
  stripeSessionId String
  stripePaymentId String?
  status          String   @default("pending") // pending, completed, failed
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  shop            Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)

  @@index([shopId, createdAt])
}
```

## Credit Packages

The system offers three predefined credit packages:

| Package | Credits | Price | Stripe Price ID |
|---------|---------|-------|-----------------|
| 1,000 SMS | 1,000 | €29.99 | `STRIPE_PRICE_ID_1000` |
| 5,000 SMS | 5,000 | €129.99 | `STRIPE_PRICE_ID_5000` |
| 10,000 SMS | 10,000 | €229.99 | `STRIPE_PRICE_ID_10000` |

## API Endpoints

### Settings Endpoints (Authentication Required)

#### GET /api/settings

Get current user settings and account information.

**Response:**
```json
{
  "success": true,
  "data": {
    "shop": {
      "id": "shop_id",
      "shopDomain": "example.myshopify.com",
      "credits": 1500,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "settings": {
      "senderNumber": "+1234567890",
      "senderName": "My Store",
      "timezone": "UTC",
      "currency": "EUR"
    },
    "recentTransactions": [
      {
        "id": "transaction_id",
        "creditsAdded": 1000,
        "amount": 2999,
        "currency": "EUR",
        "packageType": "package_1000",
        "status": "completed",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "usageGuide": {
      "title": "How Sendly Works",
      "sections": [
        {
          "title": "SMS Credits",
          "content": "Each SMS message costs 1 credit. Credits are deducted automatically when messages are sent successfully."
        }
      ]
    }
  }
}
```

#### PUT /api/settings/sender

Update sender number for SMS messages.

**Request Body:**
```json
{
  "senderNumber": "+1234567890"
}
```

**Validation Rules:**
- E.164 format for phone numbers: `+[country code][number]` (e.g., `+1234567890`)
- 3-11 alphanumeric characters for sender names (e.g., `MyStore`)

**Response:**
```json
{
  "success": true,
  "data": {
    "senderNumber": "+1234567890",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Sender number updated successfully"
}
```

#### GET /api/settings/account

Get detailed account information and usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "account": {
      "shopDomain": "example.myshopify.com",
      "credits": 1500,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "senderNumber": "+1234567890",
      "senderName": "My Store"
    },
    "usage": {
      "totalContacts": 150,
      "totalCampaigns": 25,
      "totalAutomations": 4,
      "totalMessages": 1200,
      "totalSpent": 5998
    }
  }
}
```

### Billing Endpoints (Authentication Required)

#### GET /api/billing/balance

Get current SMS credit balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "credits": 1500,
    "balance": 1500
  }
}
```

#### GET /api/billing/packages

Get available credit packages for purchase.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "package_1000",
      "name": "1,000 SMS Credits",
      "credits": 1000,
      "price": 29.99,
      "currency": "EUR",
      "stripePriceId": "price_1000_credits",
      "description": "Perfect for small businesses getting started",
      "popular": false
    },
    {
      "id": "package_5000",
      "name": "5,000 SMS Credits",
      "credits": 5000,
      "price": 129.99,
      "currency": "EUR",
      "stripePriceId": "price_5000_credits",
      "description": "Great value for growing businesses",
      "popular": true
    },
    {
      "id": "package_10000",
      "name": "10,000 SMS Credits",
      "credits": 10000,
      "price": 229.99,
      "currency": "EUR",
      "stripePriceId": "price_10000_credits",
      "description": "Best value for high-volume senders",
      "popular": false
    }
  ]
}
```

#### POST /api/billing/purchase

Create Stripe checkout session for credit purchase.

**Request Body:**
```json
{
  "packageId": "package_5000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_1234567890",
    "sessionUrl": "https://checkout.stripe.com/c/pay/cs_test_1234567890",
    "transactionId": "transaction_id",
    "package": {
      "id": "package_5000",
      "name": "5,000 SMS Credits",
      "credits": 5000,
      "price": 129.99,
      "currency": "EUR"
    }
  },
  "message": "Checkout session created successfully"
}
```

#### GET /api/billing/history

Get billing transaction history.

**Query Parameters:**
- `limit` (number, optional): Number of results (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "transaction_id",
        "creditsAdded": 5000,
        "amount": 12999,
        "currency": "EUR",
        "packageType": "package_5000",
        "status": "completed",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### Stripe Webhook Endpoints (No Authentication Required)

#### POST /webhooks/stripe

Handle Stripe webhook events for payment processing.

**Supported Events:**
- `checkout.session.completed`: Payment successful
- `checkout.session.expired`: Session expired
- `payment_intent.succeeded`: Payment confirmed
- `payment_intent.payment_failed`: Payment failed

**Webhook Security:**
- Stripe signature verification required
- Webhook secret configured via `STRIPE_WEBHOOK_SECRET`

## Credit System

### How Credits Work
- **1 credit = 1 SMS message**
- Credits are deducted automatically when SMS is sent successfully
- Failed SMS sends do not consume credits
- Credits cannot go negative (sending blocked if insufficient)

### Credit Deduction Process
1. Check if shop has sufficient credits (≥ 1)
2. Deduct 1 credit from shop balance
3. Send SMS via Mitto API
4. Log transaction in MessageLog

### Insufficient Credits Handling
When credits are insufficient:
- SMS sending is blocked with clear error message
- User is directed to purchase more credits
- No charges are made for failed attempts

## Stripe Integration

### Checkout Flow
1. User selects credit package
2. System creates Stripe checkout session
3. User completes payment on Stripe
4. Stripe webhook confirms payment
5. Credits are added to user account
6. Transaction is logged in database

### Webhook Processing
- **Signature Verification**: All webhooks verified with Stripe signature
- **Idempotency**: Duplicate webhooks are handled safely
- **Error Handling**: Failed webhooks are logged for manual review
- **Status Updates**: Transaction status updated based on payment result

### Security Features
- Webhook signature verification
- Metadata validation
- Duplicate payment prevention
- Secure session handling

## Usage Examples

### Get Current Settings
```bash
curl -X GET "http://localhost:3000/api/settings" \
  -H "Content-Type: application/json"
```

### Update Sender Number
```bash
curl -X PUT "http://localhost:3000/api/settings/sender" \
  -H "Content-Type: application/json" \
  -d '{"senderNumber": "+1234567890"}'
```

### Check Credit Balance
```bash
curl -X GET "http://localhost:3000/api/billing/balance" \
  -H "Content-Type: application/json"
```

### Purchase Credits
```bash
curl -X POST "http://localhost:3000/api/billing/purchase" \
  -H "Content-Type: application/json" \
  -d '{"packageId": "package_5000"}'
```

### Get Billing History
```bash
curl -X GET "http://localhost:3000/api/billing/history?limit=10" \
  -H "Content-Type: application/json"
```

## Environment Variables

Required environment variables for Stripe integration:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_1000=price_1000_credits
STRIPE_PRICE_ID_5000=price_5000_credits
STRIPE_PRICE_ID_10000=price_10000_credits

# Frontend URL for redirects
FRONTEND_URL=https://your-frontend-domain.com
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

Common error scenarios:
- **400**: Invalid sender number format, missing required fields
- **401**: Authentication required
- **402**: Insufficient credits for SMS sending
- **404**: Shop not found, package not found
- **500**: Internal server error, Stripe API error

## Security Considerations

- **Authentication**: All user endpoints require shop authentication
- **Webhook Security**: Stripe webhooks verified with signature
- **Data Validation**: Sender numbers validated for format compliance
- **Credit Protection**: Credits cannot be manipulated without payment
- **Transaction Logging**: All billing activities are logged for audit

## Monitoring and Analytics

- **Credit Usage**: Track credits consumed per shop
- **Payment Analytics**: Monitor successful/failed payments
- **Usage Patterns**: Analyze SMS sending patterns
- **Revenue Tracking**: Monitor total revenue per shop
- **Error Monitoring**: Track and alert on payment failures

## Integration Notes

### SMS Service Integration
The credit system is integrated with the Mitto SMS service:
- Credits are checked before sending
- Deduction happens before API call
- Failed sends don't consume credits
- Error messages guide users to purchase credits

### Frontend Integration
The settings page should display:
- Current credit balance prominently
- Sender number configuration
- Purchase buttons for each package
- Transaction history
- Usage statistics
- Clear error messages for insufficient credits
