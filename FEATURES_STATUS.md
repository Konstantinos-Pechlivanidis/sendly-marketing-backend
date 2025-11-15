# Sendly Features Status

## ✅ Fully Implemented & Production-Ready

### Core Features
- **Campaigns** - Create, send, schedule, view, and manage SMS campaigns
  - Real-time iPhone preview
  - Discount code integration
  - Audience segmentation (all contacts, men, women, custom segments)
  - Scheduling (immediate, scheduled, recurring)
  - Campaign status tracking (draft, scheduled, sending, sent, failed)
  - Delivery status updates from Mitto API
  - Unsubscribe link integration

- **Contacts** - Complete contact management
  - Create, edit, view contacts
  - Phone number with country code selector
  - Email, name, gender, birth date, tags
  - SMS consent management (opted_in, opted_out, unknown)
  - Bulk CSV import
  - Filtering and search
  - Contact detail pages

- **Templates** - Message templates
  - View pre-built templates
  - Use templates in campaigns
  - Template usage tracking
  - Template preview

- **Reports** - Analytics and reporting
  - Campaign metrics (sent, delivered, failed)
  - Campaign performance reports
  - Delivery status tracking
  - Real-time statistics

- **Billing** - Credit management
  - Purchase SMS credits
  - View credit balance
  - Transaction history
  - Stripe integration for payments

- **Settings** - Store configuration
  - Sender ID (number or name)
  - Timezone settings
  - Currency settings
  - Shopify integration status

### Automation Features (Partially Implemented)

**✅ Working Automations:**
- **Order Placed** - Sends SMS when order is created (requires Shopify webhook registration)
- **Order Fulfilled** - Sends SMS when order is fulfilled (requires Shopify webhook registration)
- **Birthday** - Sends birthday messages via daily cron job (fully automated)

**⚠️ Partially Working:**
- **Abandoned Cart** - Backend implemented, but requires custom Shopify integration (Shopify doesn't natively send abandoned cart webhooks)
- **Customer Re-engagement** - Backend implemented, but needs order history tracking (currently uses demo logic)

**❌ Not Implemented:**
- Customer Registered trigger (removed from UI)

### Technical Infrastructure
- ✅ Shopify OAuth integration
- ✅ Multi-tenant architecture with store isolation
- ✅ BullMQ queue system for background jobs
- ✅ Redis caching
- ✅ PostgreSQL database with Prisma ORM
- ✅ Mitto SMS API integration
- ✅ Stripe payment processing
- ✅ Webhook signature verification (Shopify)
- ✅ Delivery status tracking from Mitto
- ✅ Unsubscribe functionality with secure tokens
- ✅ GDPR compliance features (consent management, unsubscribe)

## 🚧 Coming Soon (Shown in UI with "Coming Soon" Badge)

- **A/B Testing** - Test different message variations
- **Link Shortening** - Track clicks with shortened URLs
- **General Webhook Integration** - Connect with tools beyond Shopify (currently only Shopify webhooks work)

## 📝 Notes

### Automation Webhooks
- Order Placed and Order Fulfilled automations require Shopify webhook registration during app installation
- Currently, webhooks must be manually registered in Shopify admin
- Future: Automatic webhook registration during OAuth flow

### Abandoned Cart
- Shopify doesn't natively send abandoned cart webhooks
- Options for future implementation:
  1. Use Shopify Script Tags to detect cart abandonment
  2. Use Shopify Flow to trigger webhooks
  3. Poll Shopify API for abandoned checkouts

### Customer Re-engagement
- Currently uses demo logic (10% random chance)
- Needs order history tracking to properly identify inactive customers
- Future: Store order data and track last order date per contact

## 🎯 What Users See vs What Works

### Landing Pages
- All features mentioned are either implemented or clearly labeled as "Coming Soon"
- Automation examples show working triggers with notes where setup is required

### Logged-In Area
- All navigation items lead to fully functional pages
- Automation form only shows triggers that exist in backend
- Notes added for triggers that require additional setup

### Features Page
- Core features: All implemented ✅
- Advanced features: A/B Testing and Link Shortening labeled "Coming Soon"
- Webhook Integration: Labeled "Shopify Only" with note about general support coming soon

### Pricing Page
- Free features list updated to reflect actual availability
- Coming soon features clearly marked
- FAQ updated to be honest about feature availability

