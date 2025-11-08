# 📘 Implementation Guide - Redis Independence & Shopify Improvements

**Ημερομηνία**: Δεκέμβριος 2024

---

## 🎯 Overview

Αυτό το guide εξηγεί πώς να εφαρμόσεις τις βελτιώσεις για:
1. **Redis Independence** - Λειτουργία χωρίς Redis dependency
2. **Enhanced Shopify Integration** - Proper session management

---

## 📋 Προαπαιτούμενα

1. PostgreSQL database (ήδη υπάρχει)
2. Prisma migrations
3. Environment variables

---

## 🔧 Step 1: Database Schema Updates

### 1.1 Προσθήκη νέων models στο Prisma schema

Πρόσθεσε τα παρακάτω models στο `prisma/schema.prisma`:

```prisma
model QueueJob {
  id            String    @id @default(cuid())
  queueName    String
  jobName      String
  data         String    // JSON string
  status       String    @default("pending") // pending, processing, completed, failed
  attempts     Int       @default(0)
  maxAttempts  Int       @default(3)
  priority     Int       @default(0)
  delay        DateTime?
  startedAt    DateTime?
  completedAt  DateTime?
  failedAt     DateTime?
  result       String?   // JSON string
  error        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([queueName, status])
  @@index([status, createdAt])
  @@index([delay])
}

model ShopifySession {
  id          String    @id
  shop        String
  state       String?
  isOnline    Boolean   @default(false)
  scope       String?
  expires     DateTime?
  accessToken String?
  userId      String?
  sessionData String    // JSON string
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([shop])
  @@index([expires])
  @@index([shop, isOnline])
}

model RateLimitRecord {
  id        String   @id @default(cuid())
  key       String
  createdAt DateTime @default(now())

  @@index([key, createdAt])
  @@index([createdAt])
}
```

### 1.2 Run Migration

```bash
npx prisma migrate dev --name add_queue_and_session_models
npx prisma generate
```

---

## 🔧 Step 2: Update Queue System

### 2.1 Αντικατάσταση queue/index.js

Αντικατέστησε το `queue/index.js` με το `queue/index-enhanced.js`:

```bash
# Backup existing file
mv queue/index.js queue/index.js.backup

# Use enhanced version
cp queue/index-enhanced.js queue/index.js
```

### 2.2 Update Queue Workers

Ενημέρωσε το `queue/worker.js` για να χρησιμοποιεί database queues:

```javascript
import { databaseSmsQueue, databaseCampaignQueue, databaseAutomationQueue } from './database-queue.js';
import { handleMittoSend } from './jobs/mittoSend.js';

// Register handlers for database queues
databaseSmsQueue.process(async (job) => {
  return await handleMittoSend(job);
});

databaseCampaignQueue.process(async (job) => {
  // Campaign processing logic
});

databaseAutomationQueue.process(async (job) => {
  // Automation processing logic
});
```

---

## 🔧 Step 3: Update Shopify Integration

### 3.1 Αντικατάσταση services/shopify.js

Αντικατέστησε το `services/shopify.js` με το `services/shopify-enhanced.js`:

```bash
# Backup existing file
mv services/shopify.js services/shopify.js.backup

# Use enhanced version
cp services/shopify-enhanced.js services/shopify.js
```

### 3.2 Update OAuth Flow

Στο OAuth callback handler, αποθήκευσε το session:

```javascript
import { storeSession } from './services/shopify-session.js';

// In OAuth callback
const session = await shopifyAuth.callback({
  // ... callback params
});

// Store session in database
await storeSession(session);
```

---

## 🔧 Step 4: Update Rate Limiting

### 4.1 Προσθήκη Database Rate Limiting Fallback

Στο `middlewares/rateLimits.js`, πρόσθεσε fallback:

```javascript
import { checkRedisHealth } from '../config/redis.js';
import { 
  dbGeneralRateLimit,
  dbContactsRateLimit,
  // ... other database rate limiters
} from './database-rate-limit.js';

let useDatabaseRateLimit = false;

// Check Redis availability
async function checkRateLimitBackend() {
  try {
    const health = await checkRedisHealth();
    useDatabaseRateLimit = health.status !== 'healthy';
  } catch {
    useDatabaseRateLimit = true;
  }
}

// Use database rate limit if Redis unavailable
export const generalRateLimit = async (req, res, next) => {
  await checkRateLimitBackend();
  
  if (useDatabaseRateLimit) {
    return dbGeneralRateLimit(req, res, next);
  }
  
  // Use Redis-based rate limit
  return originalGeneralRateLimit(req, res, next);
};
```

---

## 🔧 Step 5: Environment Variables

Πρόσθεσε/ελέγξει τα παρακάτω environment variables:

```bash
# Optional: Set to disable Redis completely
REDIS_DISABLED=false

# Shopify (already exists)
SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
SHOPIFY_SCOPES=read_products,write_products
HOST=your-host.com
```

---

## 🧪 Step 6: Testing

### 6.1 Test Redis Independence

```bash
# Disable Redis
unset REDIS_URL

# Start server
npm start

# Test endpoints - should work with database fallback
curl http://localhost:3000/health
```

### 6.2 Test Queue System

```javascript
// Test database queue
import { databaseSmsQueue } from './queue/database-queue.js';

const job = await databaseSmsQueue.add('test-job', { message: 'test' });
console.log('Job added:', job.id);
```

### 6.3 Test Shopify Session

```javascript
import { getShopifySession, storeSession } from './services/shopify-session.js';

// Store session
await storeSession(session);

// Retrieve session
const session = await getShopifySession('shop.myshopify.com');
```

---

## 📊 Monitoring

### Health Check

Το `/health/full` endpoint τώρα ελέγχει:
- Redis availability
- Database queue status
- Session storage status

### Logs

Monitor logs για:
- `Redis unavailable, using database queue fallback`
- `Database queue processor started`
- `Shopify session stored`

---

## 🚀 Performance Considerations

### Database Queue vs Redis Queue

**Database Queue**:
- ✅ Works without Redis
- ✅ Persistent job storage
- ⚠️ Slower (polling-based)
- ⚠️ Higher database load

**Redis Queue**:
- ✅ Fast (pub/sub)
- ✅ Better for high volume
- ❌ Requires Redis infrastructure

**Recommendation**: Use hybrid approach (Redis preferred, Database fallback)

---

## 🔄 Migration Path

### Phase 1: Add Database Support (Non-Breaking)
1. Add database queue implementation
2. Add database rate limiting
3. Test with Redis enabled (should still use Redis)

### Phase 2: Enable Fallback
1. Add automatic failover
2. Test with Redis disabled
3. Monitor performance

### Phase 3: Full Independence (Optional)
1. Disable Redis completely
2. Use database-only mode
3. Monitor and optimize

---

## 📝 Notes

1. **Database Queue Performance**: Database queues use polling, so they're slower than Redis. Consider increasing `pollInterval` for lower database load.

2. **Rate Limiting**: Database rate limiting creates more database writes. Consider cleanup frequency.

3. **Session Storage**: Sessions are now persistent. Implement cleanup job for expired sessions.

4. **Backward Compatibility**: All changes are backward compatible. Existing code continues to work.

---

## ✅ Checklist

- [ ] Prisma schema updated
- [ ] Migration run
- [ ] Queue system updated
- [ ] Shopify integration updated
- [ ] Rate limiting updated
- [ ] Tests passing
- [ ] Redis fallback tested
- [ ] Monitoring configured

---

**Status**: Ready for Implementation  
**Next**: Follow steps 1-6 above

