# 🚀 Sendly Marketing Backend - Quick Reference Guide

**For Developers**: Quick access to common patterns and guidelines

---

## 📁 Project Structure

```
sendly-marketing-backend/
├── controllers/        # Request handlers (thin layer)
├── services/          # Business logic (thick layer)
├── routes/            # Route definitions
├── middlewares/       # Request processing
├── utils/             # Helper functions
├── queue/             # Background jobs
├── prisma/            # Database schema
└── config/            # Configuration files
```

---

## 🎯 Core Patterns

### 1. Controller Pattern ✅

**Always follow this structure:**

```javascript
import serviceLayer from '../services/feature.js';
import { getStoreId } from '../middlewares/store-resolution.js';
import { logger } from '../utils/logger.js';

/**
 * Brief description
 * @route METHOD /path
 */
export async function handlerName(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const data = await serviceLayer.method(storeId, req.body);
    
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error description', {
      error: error.message,
      storeId,
      context: req.body,
    });
    next(error);
  }
}
```

**❌ DON'T:**
- Use `console.log` or `console.error`
- Put business logic in controllers
- Query Prisma directly from controllers
- Use `res.status().json()` for errors (use `next(error)`)

**✅ DO:**
- Use `logger` for all logging
- Keep controllers thin
- Use service layer for business logic
- Use `next(error)` for error handling
- Add JSDoc comments

### 2. Service Pattern ✅

**Always follow this structure:**

```javascript
import prisma from './prisma.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Brief description
 * @param {string} storeId - The store ID
 * @param {Object} data - Input data
 * @returns {Promise<Object>} Result data
 */
export async function methodName(storeId, data) {
  logger.info('Operation started', { storeId, data });
  
  // Validation
  if (!data.required) {
    throw new ValidationError('Required field missing');
  }
  
  // Business logic
  const result = await prisma.model.findUnique({
    where: { id: data.id, shopId: storeId },
  });
  
  if (!result) {
    throw new NotFoundError('Resource');
  }
  
  logger.info('Operation completed', { storeId, resultId: result.id });
  
  return result;
}

export default {
  methodName,
  // ... other methods
};
```

**❌ DON'T:**
- Return HTTP status codes from services
- Use `res` or `req` in services
- Handle HTTP responses in services
- Use `console.log`

**✅ DO:**
- Throw custom errors (ValidationError, NotFoundError, etc.)
- Log important operations
- Return data objects
- Keep services focused on business logic
- Always filter by `shopId` for data isolation

### 3. Error Handling ✅

**Use custom error classes:**

```javascript
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ConflictError,
} from '../utils/errors.js';

// Validation error
if (!isValid) {
  throw new ValidationError('Invalid input', details);
}

// Not found error
if (!resource) {
  throw new NotFoundError('Resource name');
}

// Conflict error
if (exists) {
  throw new ConflictError('Resource already exists');
}

// Authentication error
if (!authenticated) {
  throw new AuthenticationError('Invalid credentials');
}
```

**Error Response Format:**
```json
{
  "error": "validation_error",
  "message": "Invalid input",
  "timestamp": "2025-10-19T12:00:00.000Z",
  "path": "/api/contacts",
  "method": "POST",
  "requestId": "req_123456"
}
```

### 4. Logging Pattern ✅

**Always use logger, never console:**

```javascript
import { logger } from '../utils/logger.js';

// Info level
logger.info('Operation description', {
  storeId,
  userId,
  action: 'create',
});

// Error level
logger.error('Error description', {
  error: error.message,
  stack: error.stack,
  storeId,
  context: additionalData,
});

// Warning level
logger.warn('Warning description', {
  storeId,
  reason: 'why this happened',
});

// Debug level (development only)
logger.debug('Debug info', {
  data: complexObject,
});
```

**❌ DON'T:**
```javascript
console.log('Something happened');
console.error('Error:', error);
console.info('Info');
```

**✅ DO:**
```javascript
logger.info('Something happened', { context });
logger.error('Error occurred', { error: error.message, context });
logger.warn('Warning', { context });
```

### 5. Database Queries ✅

**Always scope by shopId:**

```javascript
// ✅ CORRECT
const contacts = await prisma.contact.findMany({
  where: {
    shopId: storeId,  // Always include!
    smsConsent: 'opted_in',
  },
});

// ❌ WRONG - Missing shopId
const contacts = await prisma.contact.findMany({
  where: {
    smsConsent: 'opted_in',
  },
});
```

**Use select() to limit fields:**

```javascript
// ✅ CORRECT
const shop = await prisma.shop.findUnique({
  where: { id: storeId },
  select: {
    id: true,
    credits: true,
    currency: true,
  },
});

// ⚠️ AVOID - Fetches all fields
const shop = await prisma.shop.findUnique({
  where: { id: storeId },
});
```

**Use transactions for multi-step operations:**

```javascript
await prisma.$transaction(async (tx) => {
  // Deduct credits
  await tx.shop.update({
    where: { id: storeId },
    data: { credits: { decrement: cost } },
  });
  
  // Create transaction record
  await tx.walletTransaction.create({
    data: {
      shopId: storeId,
      type: 'debit',
      credits: -cost,
      ref: 'campaign_send',
    },
  });
});
```

### 6. Response Format ✅

**Standard success response:**

```javascript
return res.json({
  success: true,
  data: result,
});
```

**With pagination:**

```javascript
return res.json({
  success: true,
  data: items,
  pagination: {
    page: 1,
    pageSize: 20,
    totalPages: 5,
    totalItems: 100,
    hasMore: true,
  },
});
```

**With metadata:**

```javascript
return res.json({
  success: true,
  data: result,
  meta: {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  },
});
```

---

## 🔒 Security Checklist

### Every Route Must Have:
- [ ] Store resolution middleware (`resolveStore`)
- [ ] Store requirement middleware (`requireStore`)
- [ ] Input validation
- [ ] Rate limiting
- [ ] Proper error handling

### Every Query Must:
- [ ] Filter by `shopId`
- [ ] Use parameterized queries
- [ ] Validate input
- [ ] Handle errors properly

### Every Response Must:
- [ ] Not leak sensitive data
- [ ] Use consistent format
- [ ] Include proper status codes
- [ ] Log appropriately

---

## 📊 Common Operations

### Get Store Context:
```javascript
import { getStoreId, getStoreContext } from '../middlewares/store-resolution.js';

// Get store ID
const storeId = getStoreId(req);

// Get full store context
const store = getStoreContext(req);
// store = { id, shopDomain, credits, currency, ... }
```

### Validate Credits:
```javascript
import { validateCredits } from '../services/credit-validation.js';

await validateCredits(storeId, requiredCredits);
// Throws error if insufficient credits
```

### Send SMS:
```javascript
import { sendSms } from '../services/mitto.js';

const result = await sendSms({
  to: phoneE164,
  message: text,
  sender: senderNumber,
});
```

### Queue Background Job:
```javascript
import { smsQueue } from '../queue/index.js';

await smsQueue.add('send-campaign', {
  campaignId,
  storeId,
});
```

---

## 🧪 Testing

### Unit Test Example:
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import dashboardService from '../services/dashboard.js';

describe('Dashboard Service', () => {
  beforeEach(() => {
    // Setup
  });
  
  it('should return overview data', async () => {
    const result = await dashboardService.getOverview('store_123');
    
    expect(result).toHaveProperty('sms');
    expect(result).toHaveProperty('contacts');
    expect(result).toHaveProperty('wallet');
  });
});
```

### Integration Test Example:
```javascript
import request from 'supertest';
import app from '../app.js';

describe('Dashboard Routes', () => {
  it('GET /dashboard/overview', async () => {
    const response = await request(app)
      .get('/dashboard/overview')
      .set('X-Shopify-Shop-Domain', 'test-store.myshopify.com')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });
});
```

---

## 📝 Documentation

### JSDoc Format:
```javascript
/**
 * Brief one-line description
 * 
 * Longer description if needed.
 * Can span multiple lines.
 * 
 * @param {string} storeId - The store ID
 * @param {Object} data - Input data
 * @param {string} data.name - Name field
 * @param {number} data.count - Count field
 * @returns {Promise<Object>} Result object
 * @throws {ValidationError} If validation fails
 * @throws {NotFoundError} If resource not found
 * 
 * @example
 * const result = await methodName('store_123', { name: 'Test', count: 5 });
 */
```

---

## 🔍 Debugging

### Enable Debug Logging:
```bash
DEBUG=sendly:* npm start
```

### Check Logs:
```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Debug logs
tail -f logs/debug.log
```

### Common Issues:

**Store not found:**
- Check `X-Shopify-Shop-Domain` header
- Verify store exists in database
- Check middleware configuration

**Insufficient credits:**
- Check wallet balance
- Verify credit deduction logic
- Check transaction history

**Rate limit exceeded:**
- Check rate limit configuration
- Verify request frequency
- Check per-store limits

---

## 🚀 Deployment

### Pre-Deployment Checklist:
- [ ] All tests pass
- [ ] No console.log/error
- [ ] All TODOs resolved
- [ ] Documentation updated
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Redis configured
- [ ] Monitoring enabled

### Environment Variables:
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MITTO_API_KEY=...
MITTO_API_BASE=...
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
```

---

## 📞 Getting Help

### Documentation:
- **Architecture**: See `ARCHITECTURE_AUDIT_REPORT.md`
- **Implementation**: See `REFACTORING_IMPLEMENTATION_PLAN.md`
- **API Docs**: See `Shopify_App_Development_Guide.md`
- **Quick Setup**: See `Shopify_App_Quick_Setup.md`

### Code Examples:
- **Dashboard**: `controllers/dashboard.js` + `services/dashboard.js`
- **Error Handling**: `utils/errors.js`
- **Logging**: `utils/logger.js`
- **Store Resolution**: `middlewares/store-resolution.js`

### Common Commands:
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format

# Database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

---

**Last Updated**: October 19, 2025  
**Maintained By**: Development Team  
**Questions?**: See documentation or ask in team chat

