# Multi-Tenant Store Scoping Guide

## Overview

This guide explains how to implement and maintain strict multi-tenant store scoping in the Sendly Marketing Backend. Every operation is scoped to a specific store (tenant) to ensure complete data isolation and security.

## Architecture Principles

### 1. Single Source of Truth
- **Store Resolution Middleware**: All routes use `resolveStore` middleware to establish store context
- **Request Context**: Store information is attached to `req.ctx.store`
- **No Global State**: All operations are explicitly scoped to a store

### 2. Data Model Constraints
- **Foreign Key Constraints**: All models have `shopId` (FK) with `ON DELETE CASCADE`
- **Unique Constraints**: Composite uniques ensure data integrity per store
- **Indexes**: Optimized queries with `shopId` + other fields

### 3. Store Scoping Enforcement
- **Automatic Injection**: `withStoreScope()` helper automatically injects `shopId`
- **Ownership Validation**: `validateStoreOwnership()` prevents cross-store access
- **Query Protection**: All database operations are store-scoped

## Database Schema

### Core Store Model
```prisma
model Shop {
  id           String              @id @default(cuid())
  shopDomain   String              @unique
  shopName     String?
  accessToken  String?
  status       String              @default("active")
  country      String?
  currency     String              @default("EUR")
  credits      Int                 @default(0)
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
  
  // Relations
  contacts     Contact[]
  campaigns    Campaign[]
  segments     Segment[]
  messages     MessageLog[]
  automations  UserAutomation[]
  templates    TemplateUsage[]
  billingTransactions BillingTransaction[]
  settings     ShopSettings?
  
  @@index([status, createdAt])
  @@index([country])
}
```

### Store-Scoped Models
All models include `shopId` with proper constraints:

```prisma
model Contact {
  id          String              @id @default(cuid())
  shopId      String              // FK to Shop
  firstName   String?
  lastName    String?
  phoneE164   String
  email       String?
  smsConsent  SmsConsent          @default(unknown)
  tags        String[]            @default([])
  createdAt   DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
  
  shop        Shop                @relation(fields: [shopId], references: [id], onDelete: Cascade)
  
  @@index([shopId, phoneE164])
  @@index([shopId, email])
  @@index([shopId, smsConsent])
  @@index([shopId, createdAt])
  @@unique([shopId, phoneE164])
  @@unique([shopId, email])
}
```

## Store Resolution Middleware

### Implementation
```javascript
// middlewares/store-resolution.js
export async function resolveStore(req, res, next) {
  try {
    let storeId = null;
    let shopDomain = null;
    let store = null;

    // Method 1: Shopify session/JWT (primary)
    if (req.headers['x-shopify-shop-domain'] || req.query.shop) {
      shopDomain = req.headers['x-shopify-shop-domain'] || req.query.shop;
      store = await prisma.shop.findUnique({
        where: { shopDomain },
        include: { settings: true },
      });
    }

    // Method 2: Admin bearer token
    if (!store && req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      // Validate admin token and map to store
    }

    // Method 3: Development fallback
    if (!store && process.env.NODE_ENV === 'development') {
      store = await prisma.shop.findFirst({ include: { settings: true } });
    }

    if (!store) {
      return res.status(401).json({
        success: false,
        error: 'Store not found',
        message: 'Unable to resolve store context',
      });
    }

    // Attach store context
    req.ctx = {
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        credits: store.credits,
        currency: store.settings?.currency || 'EUR',
        timezone: store.settings?.timezone || 'UTC',
        senderNumber: store.settings?.senderNumber,
        senderName: store.settings?.senderName,
        settings: store.settings,
      },
    };

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Store resolution failed',
      message: error.message,
    });
  }
}
```

### Usage in Routes
```javascript
// app.js
app.use('/contacts', resolveStore, requireStore, contactsRoutes);
app.use('/campaigns', resolveStore, requireStore, campaignsRoutes);
app.use('/billing', resolveStore, requireStore, billingRoutes);
```

## Store Scoping Utilities

### withStoreScope Helper
```javascript
// utils/store-scoping.js
export function withStoreScope(storeId, model) {
  return {
    findMany: (args = {}) => {
      return model.findMany({
        ...args,
        where: { ...args.where, shopId: storeId },
      });
    },
    findUnique: (args) => {
      return model.findUnique({
        ...args,
        where: { ...args.where, shopId: storeId },
      });
    },
    create: (args) => {
      return model.create({
        ...args,
        data: { ...args.data, shopId: storeId },
      });
    },
    update: (args) => {
      return model.update({
        ...args,
        where: { ...args.where, shopId: storeId },
      });
    },
    delete: (args) => {
      return model.delete({
        ...args,
        where: { ...args.where, shopId: storeId },
      });
    },
  };
}
```

### Controller Implementation
```javascript
// controllers/contacts-scoped.js
export async function list(req, res) {
  try {
    const storeId = getStoreId(req);
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    
    const contacts = await contactsQuery.findMany({
      where: { smsConsent: 'opted_in' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function create(req, res) {
  try {
    const storeId = getStoreId(req);
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    
    const contact = await contactsQuery.create({
      data: req.body,
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

## Security Measures

### 1. Cross-Store Access Prevention
```javascript
// Validate ownership before operations
await validateStoreOwnership(storeId, prisma.contact, contactId, 'Contact');

// Block cross-store updates
try {
  await withStoreScope(store1Id, prisma.contact).update({
    where: { id: store2ContactId },
    data: { firstName: 'Hacked' },
  });
} catch (error) {
  // This will fail - contact not found in store1 context
}
```

### 2. Input Validation
```javascript
// Never accept storeId from client
const storeId = getStoreId(req); // Server-side only

// Validate all inputs
if (!phoneE164 || !/^\+[1-9]\d{1,14}$/.test(phoneE164)) {
  return res.status(400).json({
    success: false,
    error: 'Invalid phone format',
  });
}
```

### 3. Audit Logging
```javascript
// Log all operations with store context
logger.info('Contact created', {
  storeId,
  contactId: contact.id,
  phoneE164: contact.phoneE164,
  timestamp: new Date().toISOString(),
});
```

## External Integrations

### Shopify Integration
```javascript
// Store-scoped Shopify calls
export async function getShopifyDiscounts(storeId) {
  const store = await prisma.shop.findUnique({
    where: { id: storeId },
    select: { accessToken: true, shopDomain: true },
  });

  if (!store?.accessToken) {
    throw new Error('Shopify access token not found');
  }

  // Use store-specific access token
  const response = await fetch(`https://${store.shopDomain}/admin/api/2024-01/discount_codes.json`, {
    headers: {
      'X-Shopify-Access-Token': store.accessToken,
    },
  });

  return response.json();
}
```

### Mitto SMS Integration
```javascript
// Store-scoped SMS sending
export async function sendSms({ to, text, storeId }) {
  // Get store-specific sender settings
  const store = await prisma.shop.findUnique({
    where: { id: storeId },
    include: { settings: true },
  });

  const sender = store.settings?.senderNumber || process.env.MITTO_SENDER_NAME;

  // Send SMS with store context
  const result = await mittoApi.send({
    to,
    text,
    sender,
    metadata: { storeId },
  });

  // Log with store context
  await prisma.messageLog.create({
    data: {
      shopId: storeId,
      phoneE164: to,
      provider: 'mitto',
      providerMsgId: result.messageId,
      direction: 'outbound',
      status: 'sent',
    },
  });

  return result;
}
```

### Stripe Integration
```javascript
// Store-scoped Stripe sessions
export async function createStripeSession(storeId, packageId) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: packageId, quantity: 1 }],
    mode: 'payment',
    metadata: {
      storeId, // Critical for webhook processing
      packageId,
    },
    success_url: `${process.env.FRONTEND_URL}/settings?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/settings?canceled=true`,
  });

  return session;
}

// Webhook processing with store validation
export async function handleStripeWebhook(req, res) {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const { storeId } = event.data.object.metadata;
    
    // Validate store exists
    const store = await prisma.shop.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new Error('Store not found in webhook');
    }

    // Process payment for specific store
    await processPayment(storeId, event.data.object);
  }
}
```

## Background Jobs

### Store-Scoped Job Processing
```javascript
// queue/jobs/store-scoped.js
export async function processStoreJob(storeId, jobData) {
  try {
    // Validate store exists
    const store = await prisma.shop.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    // Process job with store context
    const result = await processJob(storeId, jobData);

    logger.info('Store job processed', {
      storeId,
      jobType: jobData.type,
      result,
    });

    return result;
  } catch (error) {
    logger.error('Store job failed', {
      storeId,
      error: error.message,
    });
    throw error;
  }
}

// Daily re-engagement check per store
export async function dailyReengagementCheck() {
  const stores = await prisma.shop.findMany({
    where: { status: 'active' },
    select: { id: true, shopDomain: true },
  });

  for (const store of stores) {
    await processStoreJob(store.id, {
      type: 'reengagement',
      data: { storeId: store.id },
    });
  }
}
```

## Testing Multi-Tenant Isolation

### Unit Tests
```javascript
// tests/multi-tenant.test.js
describe('Multi-Tenant Isolation', () => {
  test('Store1 cannot access Store2 data', async () => {
    const store1 = await createTestStore('store1.myshopify.com');
    const store2 = await createTestStore('store2.myshopify.com');
    
    const contact1 = await createContact(store1.id, { phoneE164: '+1234567890' });
    const contact2 = await createContact(store2.id, { phoneE164: '+1987654321' });

    // Store1 should not see Store2's contact
    const store1Contacts = await withStoreScope(store1.id, prisma.contact).findMany();
    expect(store1Contacts).toHaveLength(1);
    expect(store1Contacts[0].id).toBe(contact1.id);

    // Cross-store access should fail
    await expect(
      withStoreScope(store1.id, prisma.contact).update({
        where: { id: contact2.id },
        data: { firstName: 'Hacked' },
      })
    ).rejects.toThrow();
  });
});
```

### Integration Tests
```javascript
// tests/integration/multi-tenant.test.js
describe('Multi-Tenant API Endpoints', () => {
  test('Contacts API respects store scoping', async () => {
    const store1 = await createTestStore('store1.myshopify.com');
    const store2 = await createTestStore('store2.myshopify.com');
    
    const contact1 = await createContact(store1.id, { phoneE164: '+1234567890' });
    const contact2 = await createContact(store2.id, { phoneE164: '+1987654321' });

    // Store1 API should only see Store1 contacts
    const response = await request(app)
      .get('/api/contacts')
      .set('X-Shopify-Shop-Domain', 'store1.myshopify.com');
    
    expect(response.status).toBe(200);
    expect(response.body.data.contacts).toHaveLength(1);
    expect(response.body.data.contacts[0].id).toBe(contact1.id);
  });
});
```

## Performance Considerations

### Database Indexes
```sql
-- Critical indexes for multi-tenant performance
CREATE INDEX idx_contact_shop_phone ON "Contact" ("shopId", "phoneE164");
CREATE INDEX idx_contact_shop_email ON "Contact" ("shopId", "email");
CREATE INDEX idx_campaign_shop_status ON "Campaign" ("shopId", "status");
CREATE INDEX idx_message_shop_created ON "MessageLog" ("shopId", "createdAt");
CREATE INDEX idx_billing_shop_created ON "BillingTransaction" ("shopId", "createdAt");
```

### Query Optimization
```javascript
// Efficient store-scoped queries
const contacts = await withStoreScope(storeId, prisma.contact).findMany({
  where: {
    smsConsent: 'opted_in',
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
});

// Use aggregation for statistics
const stats = await withStoreScope(storeId, prisma.contact).aggregate({
  _count: { id: true },
  _sum: { credits: true },
  where: { smsConsent: 'opted_in' },
});
```

## Monitoring and Observability

### Logging Pattern
```javascript
// Consistent logging with store context
logger.info('Operation completed', {
  storeId,
  operation: 'contact_created',
  entityId: contact.id,
  duration: Date.now() - startTime,
  result: 'success',
});
```

### Metrics Collection
```javascript
// Store-specific metrics
const metrics = {
  storeId,
  operation: 'sms_sent',
  count: 1,
  creditsUsed: 1,
  timestamp: new Date().toISOString(),
};

await collectMetrics(metrics);
```

### Alerting
```javascript
// Store-specific alerts
if (store.credits < 100) {
  await sendAlert({
    storeId: store.id,
    type: 'low_credits',
    message: `Store ${store.shopDomain} has ${store.credits} credits remaining`,
  });
}
```

## Migration Strategy

### Data Migration Script
```javascript
// scripts/migrate-to-multi-tenant.js
async function migrateToMultiTenant() {
  // 1. Add storeId to all tables
  await prisma.$executeRaw`
    ALTER TABLE "Contact" ADD COLUMN "shopId" TEXT;
    ALTER TABLE "Campaign" ADD COLUMN "shopId" TEXT;
    ALTER TABLE "MessageLog" ADD COLUMN "shopId" TEXT;
  `;

  // 2. Backfill storeId for existing records
  const shops = await prisma.shop.findMany();
  for (const shop of shops) {
    await prisma.contact.updateMany({
      where: { shopDomain: shop.shopDomain },
      data: { shopId: shop.id },
    });
  }

  // 3. Add constraints
  await prisma.$executeRaw`
    ALTER TABLE "Contact" ADD CONSTRAINT "Contact_shopId_fkey" 
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE;
  `;

  // 4. Add indexes
  await prisma.$executeRaw`
    CREATE INDEX idx_contact_shop ON "Contact" ("shopId");
    CREATE INDEX idx_campaign_shop ON "Campaign" ("shopId");
  `;
}
```

## Best Practices

### 1. Always Use Store Context
```javascript
// ✅ Good
const storeId = getStoreId(req);
const contacts = await withStoreScope(storeId, prisma.contact).findMany();

// ❌ Bad
const contacts = await prisma.contact.findMany(); // No store scoping!
```

### 2. Validate Ownership
```javascript
// ✅ Good
await validateStoreOwnership(storeId, prisma.contact, contactId, 'Contact');

// ❌ Bad
const contact = await prisma.contact.findUnique({ where: { id: contactId } });
```

### 3. Use Transactions for Atomic Operations
```javascript
// ✅ Good
await withStoreTransaction(storeId, async (tx) => {
  const contact = await tx.contact.create({ data: contactData });
  await tx.messageLog.create({ data: messageData });
});
```

### 4. Log All Operations
```javascript
// ✅ Good
logger.info('Contact created', {
  storeId,
  contactId: contact.id,
  phoneE164: contact.phoneE164,
});
```

### 5. Handle Errors Gracefully
```javascript
// ✅ Good
try {
  await validateStoreOwnership(storeId, prisma.contact, contactId, 'Contact');
} catch (error) {
  if (error.message.includes('does not belong to the current store')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }
  throw error;
}
```

## Conclusion

Multi-tenant store scoping ensures complete data isolation and security. By following these patterns and practices, you can build a robust, scalable system that maintains strict tenant boundaries while providing excellent performance and user experience.

Key takeaways:
- Always use store resolution middleware
- Implement store-scoped database operations
- Validate ownership before operations
- Log all operations with store context
- Test multi-tenant isolation thoroughly
- Monitor performance and security
