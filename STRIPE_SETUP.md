# Stripe Integration Setup Guide

This guide explains how to set up Stripe for the Sendly Marketing billing system, including currency support (EUR and USD).

## Overview

The billing system uses Stripe Checkout Sessions to process credit purchases. Each credit package has separate Stripe Price IDs for EUR and USD currencies.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to Stripe Dashboard
3. API keys from Stripe (both test and production)

## Step 1: Create Stripe Products and Prices

For each credit package, you need to create:
- One Product in Stripe
- Two Prices (one for EUR, one for USD)

### Credit Packages

The system supports 4 credit packages:

1. **1,000 SMS Credits**
   - EUR Price: €29.99
   - USD Price: $32.99

2. **5,000 SMS Credits**
   - EUR Price: €129.99
   - USD Price: $142.99

3. **10,000 SMS Credits**
   - EUR Price: €229.99
   - USD Price: $252.99

4. **25,000 SMS Credits**
   - EUR Price: €499.99
   - USD Price: $549.99

### Creating Products and Prices in Stripe

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com

2. **Navigate to Products**: Go to Products → Add Product

3. **For each package, create a product**:
   - **Name**: e.g., "1,000 SMS Credits"
   - **Description**: e.g., "Perfect for small businesses getting started"
   - **Pricing Model**: Standard pricing
   - **Price**: Enter the EUR price (e.g., 29.99)
   - **Currency**: Select EUR
   - **Billing Period**: One time
   - Click **Save product**

4. **Add USD Price to the same product**:
   - After creating the product, click **Add another price**
   - Enter the USD price (e.g., 32.99)
   - **Currency**: Select USD
   - **Billing Period**: One time
   - Click **Save price**

5. **Copy the Price IDs**:
   - For each price, copy the Price ID (starts with `price_`)
   - You'll need these for environment variables

### Example Price IDs Structure

After creating all products and prices, you should have:

```
STRIPE_PRICE_ID_1000_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_1000_USD=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_5000_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_5000_USD=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_10000_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_10000_USD=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_25000_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_25000_USD=price_xxxxxxxxxxxxx
```

## Step 2: Configure Environment Variables

Add the following environment variables to your backend:

### Required Variables

```bash
# Stripe Secret Key (use test key for development, live key for production)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Test mode
# or
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Production mode

# Stripe Webhook Secret (see Step 3)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Price IDs for each package and currency
STRIPE_PRICE_ID_1000_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_1000_USD=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_5000_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_5000_USD=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_10000_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_10000_USD=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_25000_EUR=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_25000_USD=price_xxxxxxxxxxxxx
```

### Getting Your Stripe Keys

1. **Secret Key**:
   - Go to Developers → API keys
   - Copy the "Secret key" (starts with `sk_test_` for test mode or `sk_live_` for production)
   - ⚠️ **Never commit this key to version control**

2. **Webhook Secret**:
   - See Step 3 below

## Step 3: Configure Stripe Webhooks

Webhooks are required to process successful payments and update credit balances.

### Setting Up Webhooks

1. **Navigate to Webhooks**: Go to Developers → Webhooks in Stripe Dashboard

2. **Add Endpoint**:
   - Click **Add endpoint**
   - **Endpoint URL**: `https://your-backend-domain.com/webhooks/stripe`
   - **Description**: "Sendly Marketing - Payment Processing"
   - **Events to send**: Select the following events:
     - `checkout.session.completed` - When a payment is completed
     - `charge.refunded` - When a payment is refunded
     - `payment_intent.refunded` - When a payment intent is refunded

3. **Get Webhook Secret**:
   - After creating the endpoint, click on it
   - Under "Signing secret", click **Reveal**
   - Copy the secret (starts with `whsec_`)
   - Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally

For local development, use Stripe CLI:

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli

2. **Login**: `stripe login`

3. **Forward webhooks**: 
   ```bash
   stripe listen --forward-to http://localhost:3000/webhooks/stripe
   ```

4. **Copy the webhook signing secret** from the CLI output and use it for `STRIPE_WEBHOOK_SECRET` in development

## Step 4: Test Mode vs Production Mode

### Test Mode

- Use test API keys (start with `sk_test_`)
- Use test price IDs (create test products in Stripe Dashboard)
- Use test card numbers (e.g., `4242 4242 4242 4242`)
- Webhooks can be tested using Stripe CLI

### Production Mode

- Use live API keys (start with `sk_live_`)
- Use production price IDs
- Real payments will be processed
- Webhooks must be configured in Stripe Dashboard

## Step 5: Verify Configuration

### Backend Verification

1. **Check environment variables are set**:
   ```bash
   # In your backend environment
   echo $STRIPE_SECRET_KEY
   echo $STRIPE_WEBHOOK_SECRET
   ```

2. **Test the purchase endpoint**:
   ```bash
   curl -X POST https://your-backend-domain.com/billing/purchase \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-Shopify-Shop-Domain: your-shop.myshopify.com" \
     -d '{
       "packageId": "package_1000",
       "successUrl": "https://your-frontend.com/app/billing?success=true",
       "cancelUrl": "https://your-frontend.com/app/billing?canceled=true",
       "currency": "EUR"
     }'
   ```

3. **Expected response**:
   ```json
   {
     "success": true,
     "data": {
       "sessionId": "cs_test_...",
       "sessionUrl": "https://checkout.stripe.com/...",
       "transactionId": "...",
       "package": {
         "id": "package_1000",
         "name": "1,000 SMS Credits",
         "credits": 1000,
         "price": 29.99,
         "currency": "EUR"
       }
     }
   }
   ```

### Frontend Verification

1. **Navigate to Billing page**: `/app/billing`

2. **Select currency**: Use the currency dropdown to switch between EUR and USD

3. **Verify prices update**: Package prices should reflect the selected currency

4. **Test purchase flow**:
   - Click "Purchase" on any package
   - You should be redirected to Stripe Checkout
   - Complete the test payment
   - You should be redirected back to the billing page
   - Credits should be added to your balance

## Step 6: Currency Selection

The system supports two currencies:
- **EUR (€)**: Euro
- **USD ($)**: US Dollar

### How Currency Selection Works

1. **User Selection**: Users can select their preferred currency using the dropdown on the Billing page

2. **Package Pricing**: Packages are fetched with the selected currency, showing the correct price

3. **Purchase**: When creating a purchase session, the selected currency is sent to the backend

4. **Stripe Checkout**: Stripe displays the payment in the selected currency

5. **Currency Priority**:
   - If user selects a currency → Use selected currency
   - If no selection → Use shop's default currency
   - If shop has no currency → Default to EUR

## Troubleshooting

### Common Issues

1. **400 Bad Request on Purchase**:
   - Check that all environment variables are set correctly
   - Verify Price IDs match the products in Stripe
   - Ensure URLs in the request are valid (no trailing slashes, proper protocol)

2. **Webhook Not Receiving Events**:
   - Verify webhook endpoint URL is correct
   - Check webhook secret matches
   - Ensure webhook events are enabled in Stripe Dashboard
   - For local development, use Stripe CLI

3. **Credits Not Added After Payment**:
   - Check webhook is configured correctly
   - Verify webhook secret is correct
   - Check backend logs for webhook processing errors
   - Ensure `checkout.session.completed` event is enabled

4. **Wrong Currency Displayed**:
   - Verify currency parameter is being sent correctly
   - Check that Price IDs match the selected currency
   - Ensure shop currency is set correctly in database

### Debugging Tips

1. **Check Stripe Dashboard**:
   - View payments in Payments section
   - Check webhook delivery logs in Webhooks section
   - Review API request logs in Developers → Logs

2. **Backend Logs**:
   - Check for validation errors
   - Verify Stripe API calls are successful
   - Review webhook processing logs

3. **Frontend Console**:
   - Check for API errors
   - Verify request payloads
   - Review response data

## Security Best Practices

1. **Never commit API keys**: Use environment variables or secret management services

2. **Use HTTPS**: Always use HTTPS for webhook endpoints

3. **Verify webhook signatures**: The backend automatically verifies webhook signatures

4. **Use test mode for development**: Always test with Stripe test keys first

5. **Monitor webhook failures**: Set up alerts for failed webhook deliveries

## Support

For Stripe-specific issues:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

For Sendly-specific issues:
- Check backend logs
- Review API documentation
- Contact development team

