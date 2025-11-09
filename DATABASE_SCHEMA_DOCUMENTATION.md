# 📊 Database Schema Documentation

**Sendly Marketing Backend - Database Schema Reference**

**Database:** PostgreSQL  
**ORM:** Prisma  
**Last Updated:** 2025-01-XX

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Models](#models)
   - [Shop](#shop)
   - [Contact](#contact)
   - [Segment](#segment)
   - [SegmentMembership](#segmentmembership)
   - [Campaign](#campaign)
   - [CampaignRecipient](#campaignrecipient)
   - [CampaignMetrics](#campaignmetrics)
   - [MessageLog](#messagelog)
   - [Wallet](#wallet)
   - [WalletTransaction](#wallettransaction)
   - [SmsPackage](#smspackage)
   - [BillingTransaction](#billingtransaction)
   - [ShopSettings](#shopsettings)
   - [Template](#template)
   - [TemplateUsage](#templateusage)
   - [Automation](#automation)
   - [UserAutomation](#userautomation)
   - [AutomationLog](#automationlog)
   - [DiscountLink](#discountlink)
   - [QueueJob](#queuejob)
   - [ShopifySession](#shopifysession)
   - [RateLimitRecord](#ratelimitrecord)
4. [Enums](#enums)
5. [Indexes Summary](#indexes-summary)
6. [Relationships Summary](#relationships-summary)

---

## Overview

The Sendly Marketing Backend database schema is designed to support a multi-tenant SMS marketing platform for Shopify stores. The schema follows these key principles:

- **Multi-tenancy:** All store-scoped data is linked to a `Shop` entity
- **Cascade Deletes:** Related data is automatically cleaned up when a shop is deleted
- **Audit Trails:** Timestamps (`createdAt`, `updatedAt`) on all entities
- **Performance:** Strategic indexes for common query patterns
- **Data Integrity:** Unique constraints and foreign keys ensure data consistency

### Database Statistics

- **Total Models:** 22
- **Total Enums:** 7
- **Primary Relationships:** Shop-centric (one-to-many and one-to-one)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              SHOP (Root Entity)                          │
│  - id, shopDomain (unique), shopName, accessToken, status, country       │
│  - currency, credits, createdAt, updatedAt                               │
└─────────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   CONTACT    │    │  CAMPAIGN    │    │   WALLET     │
│  (1-to-many) │    │ (1-to-many)  │    │ (1-to-one)   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SEGMENT    │    │ CAMPAIGN     │    │ WALLET       │
│ MEMBERSHIP   │    │ RECIPIENT    │    │ TRANSACTION  │
│  (many-to-   │    │ (1-to-many)  │    │ (1-to-many)  │
│   many)      │    └──────────────┘    └──────────────┘
└──────────────┘             │
                             ▼
                    ┌──────────────┐
                    │ CAMPAIGN     │
                    │ METRICS      │
                    │ (1-to-one)   │
                    └──────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │ MESSAGE LOG  │
                    │ (1-to-many)  │
                    └──────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  AUTOMATION  │    │   TEMPLATE  │    │ SHOP         │
│  (System)    │    │  (Public)   │    │ SETTINGS     │
└──────────────┘    └──────────────┘    │ (1-to-one)  │
        │                     │           └──────────────┘
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────┐
│ USER         │    │ TEMPLATE     │
│ AUTOMATION   │    │ USAGE        │
│ (many-to-    │    │ (many-to-    │
│  many)       │    │  many)       │
└──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│ AUTOMATION   │
│ LOG          │
│ (1-to-many)  │
└──────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ SMS PACKAGE  │    │ BILLING      │    │ DISCOUNT    │
│ (Standalone) │    │ TRANSACTION  │    │ LINK        │
└──────────────┘    │ (1-to-many)  │    │ (1-to-many) │
                    └──────────────┘    └──────────────┘

┌──────────────┐    ┌──────────────┐
│ QUEUE JOB    │    │ SHOPIFY      │
│ (Standalone) │    │ SESSION      │
└──────────────┘    │ (Standalone) │
                    └──────────────┘

┌──────────────┐
│ RATE LIMIT   │
│ RECORD       │
│ (Standalone) │
└──────────────┘
```

---

## Models

### Shop

**Description:** Root entity representing a Shopify store. All store-scoped data is linked to a Shop.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopDomain` | String | Shopify store domain (e.g., `store.myshopify.com`) | Unique, Required |
| `shopName` | String? | Display name of the shop | Optional |
| `accessToken` | String? | Shopify OAuth access token | Optional |
| `status` | String | Shop status (e.g., `active`, `suspended`) | Default: `"active"` |
| `country` | String? | Shop country code | Optional |
| `currency` | String | Shop currency code | Default: `"EUR"` |
| `credits` | Int | Available SMS credits | Default: `0` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `automations` → `UserAutomation[]` (One-to-Many)
- `automationLogs` → `AutomationLog[]` (One-to-Many)
- `campaigns` → `Campaign[]` (One-to-Many)
- `contacts` → `Contact[]` (One-to-Many)
- `discounts` → `DiscountLink[]` (One-to-Many)
- `messages` → `MessageLog[]` (One-to-Many)
- `segments` → `Segment[]` (One-to-Many)
- `templates` → `TemplateUsage[]` (One-to-Many)
- `wallet` → `Wallet?` (One-to-One, Optional)
- `transactions` → `WalletTransaction[]` (One-to-Many)
- `billingTransactions` → `BillingTransaction[]` (One-to-Many)
- `settings` → `ShopSettings?` (One-to-One, Optional)

**Indexes:**

- `@@index([status, createdAt])` - For filtering active shops by creation date
- `@@index([country])` - For country-based queries

**Cascade Behavior:** When a Shop is deleted, all related data is automatically deleted (CASCADE).

---

### Contact

**Description:** Customer contact information for SMS marketing. Each contact belongs to a shop and can be part of campaigns and segments.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `firstName` | String? | Contact's first name | Optional |
| `lastName` | String? | Contact's last name | Optional |
| `phoneE164` | String | Phone number in E.164 format (e.g., `+306977123456`) | Required |
| `email` | String? | Contact's email address | Optional |
| `gender` | String? | Gender (`male`, `female`, `other`) | Optional |
| `birthDate` | DateTime? | Date of birth (for birthday automations) | Optional |
| `tags` | String[] | Array of tags for categorization | Default: `[]` |
| `smsConsent` | SmsConsent | SMS consent status | Default: `unknown` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)
- `recipients` → `CampaignRecipient[]` (One-to-Many)
- `memberships` → `SegmentMembership[]` (One-to-Many)

**Constraints:**

- `@@unique([shopId, phoneE164])` - Unique phone per shop
- `@@unique([shopId, email])` - Unique email per shop (if provided)

**Indexes:**

- `@@index([shopId, phoneE164])` - Fast phone lookups
- `@@index([shopId, email])` - Fast email lookups
- `@@index([shopId, smsConsent])` - Filter by consent status
- `@@index([shopId, birthDate])` - Birthday automation queries
- `@@index([shopId, createdAt])` - Sort by creation date
- `@@index([shopId, gender])` - Gender-based filtering

**Cascade Behavior:** Deleted when Shop is deleted.

---

### Segment

**Description:** Customer segments for targeted campaigns. Segments are defined by rules stored as JSON.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `name` | String | Segment name | Required |
| `ruleJson` | Json | Segment rules as JSON (e.g., filters, conditions) | Required |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)
- `memberships` → `SegmentMembership[]` (One-to-Many)

**Constraints:**

- `@@unique([shopId, name])` - Unique segment name per shop

**Indexes:**

- `@@index([shopId, name])` - Fast segment name lookups
- `@@index([shopId, createdAt])` - Sort by creation date

**Cascade Behavior:** Deleted when Shop is deleted.

---

### SegmentMembership

**Description:** Junction table linking contacts to segments (many-to-many relationship).

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `segmentId` | String | Reference to Segment | Foreign Key, Required |
| `contactId` | String | Reference to Contact | Foreign Key, Required |

**Relationships:**

- `contact` → `Contact` (Many-to-One, Required)
- `segment` → `Segment` (Many-to-One, Required)

**Constraints:**

- `@@unique([segmentId, contactId])` - Prevent duplicate memberships

**Cascade Behavior:** Deleted when Contact or Segment is deleted.

---

### Campaign

**Description:** SMS marketing campaigns. Campaigns can be immediate, scheduled, or recurring.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `name` | String | Campaign name | Required |
| `message` | String | SMS message content | Required |
| `audience` | String | Target audience (e.g., `all`, `male`, `female`, segment ID) | Required |
| `discountId` | String? | Optional discount code ID | Optional |
| `scheduleAt` | DateTime? | Scheduled send time | Optional |
| `recurringDays` | Int? | Days between recurring sends | Optional |
| `scheduleType` | ScheduleType | Campaign schedule type | Required |
| `status` | CampaignStatus | Campaign status | Default: `draft` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)
- `metrics` → `CampaignMetrics?` (One-to-One, Optional)
- `recipients` → `CampaignRecipient[]` (One-to-Many)
- `messages` → `MessageLog[]` (One-to-Many)

**Constraints:**

- `@@unique([shopId, name])` - Unique campaign name per shop

**Indexes:**

- `@@index([shopId, status])` - Filter campaigns by status
- `@@index([shopId, createdAt])` - Sort by creation date
- `@@index([shopId, scheduleAt])` - Query scheduled campaigns

**Cascade Behavior:** Deleted when Shop is deleted.

---

### CampaignRecipient

**Description:** Individual recipients of a campaign. Tracks delivery status and Mitto message IDs.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `campaignId` | String | Reference to Campaign | Foreign Key, Required |
| `contactId` | String? | Reference to Contact (if contact exists) | Foreign Key, Optional |
| `phoneE164` | String | Recipient phone number (E.164 format) | Required |
| `status` | String | Delivery status (`sent`, `delivered`, `failed`, etc.) | Required |
| `mittoMessageId` | String? | Mitto API message ID | Optional |
| `sentAt` | DateTime? | When SMS was sent | Optional |
| `deliveredAt` | DateTime? | When SMS was delivered | Optional |
| `error` | String? | Error message if delivery failed | Optional |
| `deliveryStatus` | String? | Mitto delivery status (e.g., `Delivered`, `Failed`, `Queued`) | Optional |
| `senderNumber` | String? | Sender number used for this message | Optional |

**Relationships:**

- `campaign` → `Campaign` (Many-to-One, Required)
- `contact` → `Contact?` (Many-to-One, Optional)

**Indexes:**

- `@@index([campaignId, status])` - Filter recipients by campaign and status
- `@@index([campaignId, phoneE164])` - Quick lookups during SMS sending
- `@@index([sentAt])` - Time-based queries
- `@@index([status])` - Status-based filtering

**Cascade Behavior:** Deleted when Campaign is deleted.

---

### CampaignMetrics

**Description:** Aggregated metrics for a campaign. One-to-one relationship with Campaign.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `campaignId` | String | Reference to Campaign | Foreign Key, Unique, Required |
| `totalSent` | Int | Total messages sent | Default: `0` |
| `totalDelivered` | Int | Total messages delivered | Default: `0` |
| `totalFailed` | Int | Total messages failed | Default: `0` |
| `totalClicked` | Int | Total clicks (if tracking links) | Default: `0` |

**Relationships:**

- `campaign` → `Campaign` (One-to-One, Required)

**Constraints:**

- `@@unique([campaignId])` - One metrics record per campaign

**Cascade Behavior:** Deleted when Campaign is deleted.

---

### MessageLog

**Description:** Complete log of all SMS messages sent and received. Tracks provider interactions.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `phoneE164` | String | Recipient/sender phone number (E.164 format) | Required |
| `provider` | String | SMS provider (e.g., `mitto`) | Required |
| `providerMsgId` | String? | Provider's message ID | Optional |
| `payload` | Json? | Original request/response payload | Optional |
| `error` | String? | Error message if failed | Optional |
| `direction` | MessageDirection | Message direction (`outbound` or `inbound`) | Required |
| `status` | MessageStatus? | Message status | Optional |
| `deliveryStatus` | String? | Provider delivery status | Optional |
| `senderNumber` | String? | Sender number used | Optional |
| `campaignId` | String? | Reference to Campaign (if part of campaign) | Foreign Key, Optional |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)
- `campaign` → `Campaign?` (Many-to-One, Optional)

**Indexes:**

- `@@index([shopId, direction])` - Filter by direction
- `@@index([shopId, status])` - Filter by status
- `@@index([shopId, createdAt])` - Sort by creation date
- `@@index([shopId, providerMsgId])` - Lookup by provider ID
- `@@index([shopId, phoneE164])` - Lookup by phone number
- `@@index([campaignId, status])` - Campaign status queries
- `@@index([createdAt, status])` - Time-based filtering with status
- `@@index([providerMsgId])` - Quick lookups by provider message ID

**Cascade Behavior:** Deleted when Shop is deleted.

---

### Wallet

**Description:** Wallet for tracking SMS credits. One-to-one relationship with Shop.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Unique, Required |
| `balance` | Int | Current credit balance | Default: `0` |
| `totalUsed` | Int | Total credits used (lifetime) | Default: `0` |
| `totalBought` | Int | Total credits purchased (lifetime) | Default: `0` |
| `active` | Boolean | Whether wallet is active | Default: `true` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `shop` → `Shop` (One-to-One, Required)

**Constraints:**

- `@@unique([shopId])` - One wallet per shop

**Cascade Behavior:** Deleted when Shop is deleted.

---

### WalletTransaction

**Description:** Transaction log for wallet credits (purchases, debits, credits, refunds, adjustments).

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `credits` | Int | Credit amount (positive or negative) | Required |
| `type` | TransactionType | Transaction type | Required |
| `ref` | String? | Reference ID (e.g., campaign ID, purchase ID) | Optional |
| `meta` | Json? | Additional metadata | Optional |
| `createdAt` | DateTime | Transaction timestamp | Auto-generated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)

**Cascade Behavior:** Deleted when Shop is deleted.

---

### SmsPackage

**Description:** Available SMS credit packages for purchase. Standalone entity (not shop-scoped).

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `name` | String | Package name (e.g., `1000 SMS`) | Required |
| `credits` | Int | Number of SMS credits | Required |
| `priceCents` | Int | Price in cents | Required |
| `currency` | String | Currency code | Default: `"EUR"` |
| `description` | String? | Package description | Optional |
| `features` | String[] | Array of feature strings | Default: `[]` |
| `isActive` | Boolean | Whether package is available | Default: `true` |
| `isPopular` | Boolean | Whether to highlight as popular | Default: `false` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:** None (standalone entity)

---

### BillingTransaction

**Description:** Stripe payment transactions for credit purchases. Links to Shop and tracks payment status.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `creditsAdded` | Int | Credits added to wallet | Required |
| `amount` | Int | Payment amount in cents | Required |
| `currency` | String | Currency code | Default: `"EUR"` |
| `packageType` | String | Package identifier | Required |
| `stripeSessionId` | String | Stripe checkout session ID | Required |
| `stripePaymentId` | String? | Stripe payment intent ID | Optional |
| `status` | String | Transaction status (`pending`, `completed`, `failed`) | Default: `"pending"` |
| `createdAt` | DateTime | Transaction creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Transaction last update timestamp | Auto-updated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)

**Indexes:**

- `@@index([shopId, createdAt])` - Sort transactions by date

**Cascade Behavior:** Deleted when Shop is deleted.

---

### ShopSettings

**Description:** Shop-specific configuration settings. One-to-one relationship with Shop.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Unique, Required |
| `senderNumber` | String? | Custom sender number for SMS | Optional |
| `senderName` | String? | Custom sender name | Optional |
| `timezone` | String | Shop timezone | Default: `"UTC"` |
| `currency` | String | Shop currency | Default: `"EUR"` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `shop` → `Shop` (One-to-One, Required)

**Constraints:**

- `@@unique([shopId])` - One settings record per shop

**Cascade Behavior:** Deleted when Shop is deleted.

---

### Template

**Description:** SMS message templates. Public templates available to all shops.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `title` | String | Template title | Required |
| `category` | String | Template category (e.g., `marketing`, `promotional`) | Required |
| `content` | String | Template message content | Required |
| `previewImage` | String? | Preview image URL | Optional |
| `tags` | String[] | Array of tags | Default: `[]` |
| `isPublic` | Boolean | Whether template is public | Default: `true` |
| `isSystemDefault` | Boolean | Whether template is a system default | Default: `false` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `usage` → `TemplateUsage[]` (One-to-Many)

---

### TemplateUsage

**Description:** Tracks template usage by shops for analytics.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `templateId` | String | Reference to Template | Foreign Key, Required |
| `usedCount` | Int | Number of times template was used | Default: `0` |
| `lastUsedAt` | DateTime? | Last usage timestamp | Optional |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)
- `template` → `Template` (Many-to-One, Required)

**Cascade Behavior:** Deleted when Shop or Template is deleted.

---

### Automation

**Description:** System-defined automation templates (e.g., welcome, birthday, abandoned cart).

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `title` | String | Automation title | Required |
| `description` | String? | Automation description | Optional |
| `triggerEvent` | AutomationTrigger | Trigger event type | Required |
| `defaultMessage` | String | Default SMS message | Required |
| `isSystemDefault` | Boolean | Whether automation is system default | Default: `false` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `userAutomations` → `UserAutomation[]` (One-to-Many)

---

### UserAutomation

**Description:** Shop-specific automation configurations. Links Automation to Shop with custom messages.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `automationId` | String | Reference to Automation | Foreign Key, Required |
| `userMessage` | String? | Custom message override | Optional |
| `isActive` | Boolean | Whether automation is active | Default: `true` |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)
- `automation` → `Automation` (Many-to-One, Required)

**Constraints:**

- `@@unique([shopId, automationId])` - One automation config per shop

**Cascade Behavior:** Deleted when Shop or Automation is deleted.

---

### AutomationLog

**Description:** Log of automation executions. Tracks when automations are triggered and their outcomes.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `automationId` | String | Reference to Automation | Required |
| `storeId` | String | Reference to Shop | Foreign Key, Required |
| `status` | String | Execution status (`sent`, `skipped`, `failed`) | Required |
| `reason` | String? | Reason for skip/failure | Optional |
| `triggeredAt` | DateTime | When automation was triggered | Auto-generated |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)

**Indexes:**

- `@@index([storeId, status])` - Filter by shop and status
- `@@index([automationId, triggeredAt])` - Sort by automation and trigger time

**Cascade Behavior:** Deleted when Shop is deleted.

---

### DiscountLink

**Description:** Links discount codes to campaigns. Tracks which discounts are used in campaigns.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `shopId` | String | Reference to Shop | Foreign Key, Required |
| `code` | String | Discount code | Required |
| `campaignId` | String? | Reference to Campaign (if linked) | Optional |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |

**Relationships:**

- `shop` → `Shop` (Many-to-One, Required)

**Indexes:**

- `@@index([shopId, code])` - Fast discount code lookups

**Cascade Behavior:** Deleted when Shop is deleted.

---

### QueueJob

**Description:** Database-backed queue jobs for background processing. Used for SMS sending and other async tasks.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `queueName` | String | Queue name (e.g., `sms-send`) | Required |
| `jobName` | String | Job type/name | Required |
| `data` | String | Job data as JSON string | Required |
| `status` | String | Job status (`pending`, `processing`, `completed`, `failed`) | Default: `"pending"` |
| `attempts` | Int | Number of attempts made | Default: `0` |
| `maxAttempts` | Int | Maximum retry attempts | Default: `3` |
| `priority` | Int | Job priority (higher = more important) | Default: `0` |
| `delay` | DateTime? | Scheduled execution time | Optional |
| `startedAt` | DateTime? | When job started processing | Optional |
| `completedAt` | DateTime? | When job completed | Optional |
| `failedAt` | DateTime? | When job failed | Optional |
| `result` | String? | Job result as JSON string | Optional |
| `error` | String? | Error message if failed | Optional |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:** None (standalone entity)

**Indexes:**

- `@@index([queueName, status])` - Filter jobs by queue and status
- `@@index([status, createdAt])` - Sort pending jobs
- `@@index([delay])` - Query scheduled jobs

---

### ShopifySession

**Description:** Shopify OAuth session storage. Stores session data for authenticated shops.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Session ID | Primary Key |
| `shop` | String | Shop domain | Required |
| `state` | String? | OAuth state parameter | Optional |
| `isOnline` | Boolean | Whether session is online (user-specific) | Default: `false` |
| `scope` | String? | OAuth scopes | Optional |
| `expires` | DateTime? | Session expiration time | Optional |
| `accessToken` | String? | Shopify access token | Optional |
| `userId` | String? | Shopify user ID (for online sessions) | Optional |
| `sessionData` | String | Additional session data as JSON string | Required |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |
| `updatedAt` | DateTime | Record last update timestamp | Auto-updated |

**Relationships:** None (standalone entity)

**Indexes:**

- `@@index([shop])` - Fast shop lookups
- `@@index([expires])` - Cleanup expired sessions
- `@@index([shop, isOnline])` - Filter by shop and session type

---

### RateLimitRecord

**Description:** Database-backed rate limiting records. Tracks rate limit hits for throttling.

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier (CUID) | Primary Key |
| `key` | String | Rate limit key (e.g., `shopId:endpoint`) | Required |
| `createdAt` | DateTime | Record creation timestamp | Auto-generated |

**Relationships:** None (standalone entity)

**Indexes:**

- `@@index([key, createdAt])` - Filter by key and time window
- `@@index([createdAt])` - Cleanup old records

---

## Enums

### SmsConsent

SMS consent status for contacts.

- `opted_in` - Contact has opted in to SMS
- `opted_out` - Contact has opted out of SMS
- `unknown` - Consent status unknown (default)

**Used in:** `Contact.smsConsent`

---

### CampaignStatus

Campaign lifecycle status.

- `draft` - Campaign is in draft (default)
- `scheduled` - Campaign is scheduled for future sending
- `sending` - Campaign is currently being sent
- `sent` - Campaign has been sent
- `failed` - Campaign failed to send
- `cancelled` - Campaign was cancelled

**Used in:** `Campaign.status`

---

### ScheduleType

Campaign scheduling type.

- `immediate` - Send immediately
- `scheduled` - Send at a specific time
- `recurring` - Send on a recurring schedule

**Used in:** `Campaign.scheduleType`

---

### MessageDirection

Message direction.

- `outbound` - Outgoing message (shop to customer)
- `inbound` - Incoming message (customer to shop)

**Used in:** `MessageLog.direction`

---

### MessageStatus

Message delivery status.

- `queued` - Message is queued for sending
- `sent` - Message has been sent
- `delivered` - Message has been delivered
- `failed` - Message delivery failed
- `received` - Message was received (inbound)

**Used in:** `MessageLog.status`

---

### TransactionType

Wallet transaction type.

- `purchase` - Credits purchased
- `debit` - Credits used (deducted)
- `credit` - Credits added (refund, adjustment)
- `refund` - Credits refunded
- `adjustment` - Manual credit adjustment

**Used in:** `WalletTransaction.type`

---

### AutomationTrigger

Automation trigger events.

- `welcome` - Welcome message for new customers
- `abandoned_cart` - Cart abandonment reminder
- `order_confirmation` - Order confirmation SMS
- `shipping_update` - Shipping update notification
- `delivery_confirmation` - Delivery confirmation
- `review_request` - Review request after purchase
- `reorder_reminder` - Reorder reminder
- `birthday` - Birthday message
- `customer_inactive` - Inactive customer reminder
- `cart_abandoned` - Cart abandoned (alias)
- `order_placed` - Order placed (alias)

**Used in:** `Automation.triggerEvent`

---

## Indexes Summary

### Performance Indexes

The schema includes strategic indexes for common query patterns:

**Shop-scoped queries:**
- `Shop`: `[status, createdAt]`, `[country]`
- `Contact`: `[shopId, phoneE164]`, `[shopId, email]`, `[shopId, smsConsent]`, `[shopId, birthDate]`, `[shopId, createdAt]`, `[shopId, gender]`
- `Campaign`: `[shopId, status]`, `[shopId, createdAt]`, `[shopId, scheduleAt]`
- `MessageLog`: `[shopId, direction]`, `[shopId, status]`, `[shopId, createdAt]`, `[shopId, providerMsgId]`, `[shopId, phoneE164]`
- `Segment`: `[shopId, name]`, `[shopId, createdAt]`
- `BillingTransaction`: `[shopId, createdAt]`

**Campaign-related queries:**
- `CampaignRecipient`: `[campaignId, status]`, `[campaignId, phoneE164]`, `[sentAt]`, `[status]`
- `CampaignMetrics`: `[campaignId]` (unique)
- `MessageLog`: `[campaignId, status]`, `[createdAt, status]`

**Automation queries:**
- `AutomationLog`: `[storeId, status]`, `[automationId, triggeredAt]`

**Queue and session management:**
- `QueueJob`: `[queueName, status]`, `[status, createdAt]`, `[delay]`
- `ShopifySession`: `[shop]`, `[expires]`, `[shop, isOnline]`
- `RateLimitRecord`: `[key, createdAt]`, `[createdAt]`

---

## Relationships Summary

### One-to-One Relationships

- `Shop` ↔ `Wallet` (one shop has one wallet)
- `Shop` ↔ `ShopSettings` (one shop has one settings)
- `Campaign` ↔ `CampaignMetrics` (one campaign has one metrics)

### One-to-Many Relationships

- `Shop` → `Contact[]`
- `Shop` → `Campaign[]`
- `Shop` → `Segment[]`
- `Shop` → `MessageLog[]`
- `Shop` → `WalletTransaction[]`
- `Shop` → `BillingTransaction[]`
- `Shop` → `UserAutomation[]`
- `Shop` → `AutomationLog[]`
- `Shop` → `DiscountLink[]`
- `Shop` → `TemplateUsage[]`
- `Campaign` → `CampaignRecipient[]`
- `Campaign` → `MessageLog[]`
- `Contact` → `CampaignRecipient[]`
- `Contact` → `SegmentMembership[]`
- `Segment` → `SegmentMembership[]`
- `Template` → `TemplateUsage[]`
- `Automation` → `UserAutomation[]`

### Many-to-Many Relationships

- `Contact` ↔ `Segment` (via `SegmentMembership`)
- `Shop` ↔ `Template` (via `TemplateUsage`)

### Cascade Delete Behavior

All shop-scoped entities are configured with `onDelete: Cascade`, meaning:

- When a `Shop` is deleted, all related data is automatically deleted:
  - Contacts, Campaigns, Segments, Messages, Wallet, Transactions, Settings, etc.
- When a `Campaign` is deleted:
  - CampaignRecipients and CampaignMetrics are deleted
- When a `Contact` is deleted:
  - SegmentMemberships are deleted
- When a `Segment` is deleted:
  - SegmentMemberships are deleted

This ensures data consistency and prevents orphaned records.

---

## Best Practices

### Querying

1. **Always filter by `shopId`** for store-scoped queries
2. **Use indexes** - Query patterns match existing indexes
3. **Pagination** - Use `skip` and `take` for list queries
4. **Selective fields** - Only select needed fields to reduce payload

### Data Integrity

1. **Unique constraints** - Enforced at database level (e.g., `[shopId, phoneE164]`)
2. **Foreign keys** - All relationships have proper foreign key constraints
3. **Cascade deletes** - Automatic cleanup prevents orphaned data

### Performance

1. **Indexes** - Strategic indexes for common query patterns
2. **Batch operations** - Use transactions for multiple related operations
3. **Connection pooling** - Prisma handles connection pooling automatically

---

## Migration Notes

### Database Provider

- **Production:** PostgreSQL
- **Development:** Can use SQLite (change `provider` in `schema.prisma`)

### Migrations

Run migrations with:
```bash
npm run db:migrate:dev  # Development
npm run db:migrate      # Production
```

### Schema Changes

When modifying the schema:
1. Update `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name description`
3. Apply migration: `npx prisma migrate deploy`
4. Regenerate Prisma Client: `npx prisma generate`

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Maintained by:** Sendly Development Team

