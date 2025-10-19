# 🚀 Sendly Marketing Backend - Refactoring Implementation Plan

**Based on**: ARCHITECTURE_AUDIT_REPORT.md  
**Date**: October 19, 2025  
**Status**: Phase 1 Complete ✅

---

## ✅ Phase 1: COMPLETED

### What Was Done:
1. ✅ **Architecture Audit Report** - Comprehensive analysis completed
2. ✅ **Removed Debug Files** - Cleaned up development artifacts
3. ✅ **Created Dashboard Service** - Proper service layer implementation
4. ✅ **Refactored Dashboard Controller** - Clean controller pattern
5. ✅ **Fixed Logging** - Consistent logger usage
6. ✅ **Improved Error Handling** - Logger integration in global error handler

### Files Changed:
- `ARCHITECTURE_AUDIT_REPORT.md` (NEW)
- `services/dashboard.js` (NEW)
- `controllers/dashboard.js` (REFACTORED)
- `utils/errors.js` (UPDATED)
- Deleted: `debug-shopify-headers.js`, `frontend-shop-domain-extractor.js`, `quick-debug.js`, `updated-api-client.js`

---

## 🔄 Phase 2: Service Layer Implementation (IN PROGRESS)

### Priority: HIGH 🔴
### Estimated Time: 3-4 days

### Objectives:
Create service layer for all remaining controllers to achieve proper separation of concerns.

### Services to Create:

#### 1. `services/contacts.js` 🔴 CRITICAL
**Purpose**: Handle all contact-related business logic

**Methods Needed**:
```javascript
- listContacts(storeId, filters, pagination)
- getContactById(storeId, contactId)
- createContact(storeId, contactData)
- updateContact(storeId, contactId, contactData)
- deleteContact(storeId, contactId)
- getContactStats(storeId)
- getBirthdayContacts(storeId)
- importContacts(storeId, contactsArray)
- exportContacts(storeId, filters)
- validatePhoneNumber(phone)
- checkDuplicates(storeId, phone, email)
```

**Business Rules**:
- Phone number validation and normalization
- Email validation
- Duplicate detection
- SMS consent management
- Birthday validation
- Tag management

#### 2. `services/campaigns.js` 🔴 CRITICAL
**Purpose**: Handle campaign creation, scheduling, and sending

**Methods Needed**:
```javascript
- listCampaigns(storeId, filters, pagination)
- getCampaignById(storeId, campaignId)
- createCampaign(storeId, campaignData)
- updateCampaign(storeId, campaignId, campaignData)
- deleteCampaign(storeId, campaignId)
- prepareCampaign(storeId, campaignId)
- sendCampaign(storeId, campaignId)
- scheduleCampaign(storeId, campaignId, scheduleData)
- getCampaignMetrics(storeId, campaignId)
- getCampaignStats(storeId)
- validateCampaign(campaignData)
- calculateRecipients(storeId, audience)
- validateCredits(storeId, recipientCount)
```

**Business Rules**:
- Credit validation before sending
- Audience filtering
- Schedule validation
- Message length validation
- Discount code validation
- Recipient calculation
- Campaign status management

#### 3. `services/billing.js` 🔴 CRITICAL
**Purpose**: Handle billing, credits, and Stripe integration

**Methods Needed**:
```javascript
- getBalance(storeId)
- getPackages()
- createPurchaseSession(storeId, packageType, returnUrls)
- handleStripeWebhook(event)
- addCredits(storeId, credits, ref, meta)
- deductCredits(storeId, credits, ref, meta)
- getTransactionHistory(storeId, filters, pagination)
- validatePurchase(storeId, packageType)
- processPurchase(storeId, stripeSessionId, packageType)
```

**Business Rules**:
- Credit balance validation
- Package pricing
- Stripe session creation
- Webhook verification
- Transaction logging
- Balance updates

#### 4. `services/templates.js` 🟡 MEDIUM
**Purpose**: Handle template browsing and usage tracking

**Methods Needed**:
```javascript
- getAllTemplates(filters, pagination)
- getTemplateById(templateId)
- getTemplateCategories()
- trackTemplateUsage(storeId, templateId)
- getPopularTemplates(limit)
- searchTemplates(query)
```

**Business Rules**:
- Category filtering
- Usage tracking
- Search functionality
- Template validation

#### 5. `services/settings.js` 🟡 MEDIUM
**Purpose**: Handle shop settings and configuration

**Methods Needed**:
```javascript
- getSettings(storeId)
- updateSettings(storeId, settingsData)
- updateSenderNumber(storeId, senderNumber)
- validateSenderNumber(senderNumber)
- getAccountInfo(storeId)
```

**Business Rules**:
- Sender number validation
- Timezone validation
- Currency validation
- Settings validation

#### 6. `services/tracking.js` 🟡 MEDIUM
**Purpose**: Handle message delivery tracking

**Methods Needed**:
```javascript
- getMittoMessageStatus(messageId)
- getCampaignDeliveryStatus(storeId, campaignId)
- bulkUpdateDeliveryStatus(updates)
- updateMessageStatus(messageId, status, deliveryData)
```

**Business Rules**:
- Status validation
- Delivery tracking
- Webhook processing
- Status updates

#### 7. `services/audiences.js` 🟢 LOW
**Purpose**: Handle audience/segment management

**Methods Needed**:
```javascript
- listSegments(storeId)
- getSegmentById(storeId, segmentId)
- createSegment(storeId, segmentData)
- updateSegment(storeId, segmentId, segmentData)
- deleteSegment(storeId, segmentId)
- calculateSegmentSize(storeId, rules)
- getSegmentMembers(storeId, segmentId, pagination)
```

**Business Rules**:
- Rule validation
- Member calculation
- Dynamic segments
- Segment caching

---

## 🔄 Phase 3: Controller Refactoring

### After Service Layer Creation

For each controller, follow this pattern:

**BEFORE** (Current Pattern):
```javascript
export async function list(req, res, next) {
  try {
    const storeId = getStoreId(req);
    
    // ❌ Direct Prisma queries
    const contacts = await prisma.contact.findMany({
      where: { shopId: storeId },
      // ... complex query logic
    });
    
    // ❌ Business logic in controller
    const filtered = contacts.filter(c => c.smsConsent === 'opted_in');
    
    return res.json({ data: filtered });
  } catch (e) {
    console.error(e);  // ❌ Wrong logger
    next(e);
  }
}
```

**AFTER** (Refactored Pattern):
```javascript
import contactsService from '../services/contacts.js';
import { getStoreId } from '../middlewares/store-resolution.js';
import { logger } from '../utils/logger.js';

/**
 * List contacts
 * @route GET /contacts
 */
export async function list(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const filters = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      filter: req.query.filter || 'all',
      q: req.query.q || '',
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };
    
    // ✅ Use service layer
    const result = await contactsService.listContacts(storeId, filters);
    
    return res.json({
      success: true,
      data: result.contacts,
      pagination: result.pagination,
    });
  } catch (error) {
    // ✅ Proper logging
    logger.error('List contacts error', {
      error: error.message,
      storeId: getStoreId(req),
      filters: req.query,
    });
    next(error);
  }
}
```

### Controllers to Refactor:
1. ✅ `controllers/dashboard.js` - DONE
2. 🔴 `controllers/contacts-enhanced.js` - HIGH PRIORITY
3. 🔴 `controllers/campaigns.js` - HIGH PRIORITY
4. 🔴 `controllers/billing.js` - HIGH PRIORITY
5. 🟡 `controllers/automations.js` - MEDIUM PRIORITY
6. 🟡 `controllers/templates.js` - MEDIUM PRIORITY
7. 🟡 `controllers/reports.js` - MEDIUM PRIORITY
8. 🟡 `controllers/settings.js` - MEDIUM PRIORITY
9. 🟢 `controllers/discounts.js` - LOW PRIORITY
10. 🟢 `controllers/audiences.js` - LOW PRIORITY
11. 🟢 `controllers/tracking.js` - LOW PRIORITY

---

## 🔒 Phase 4: Security & Validation

### Input Validation
Add Zod schemas for all inputs:

```javascript
// schemas/contacts.js
import { z } from 'zod';

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100).optional(),
  phoneE164: z.string().regex(/^\+[1-9]\d{1,14}$/),
  email: z.string().email().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: z.string().datetime().optional(),
  smsConsent: z.boolean(),
});

export const updateContactSchema = createContactSchema.partial();
```

### Rate Limiting
Apply to all authenticated routes:

```javascript
// middlewares/rateLimits.js - Update existing
export const contactsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this store',
  keyGenerator: (req) => getStoreId(req), // Per-store limits
});
```

### Security Checklist:
- [ ] Add input validation to all POST/PUT routes
- [ ] Apply rate limiting to all authenticated routes
- [ ] Remove development fallbacks
- [ ] Add request size limits
- [ ] Validate all user inputs
- [ ] Sanitize all outputs
- [ ] Add CSRF protection
- [ ] Add request signing

---

## 📊 Phase 5: Performance Optimization

### Caching Strategy

#### Dashboard Caching:
```javascript
// services/dashboard.js
import { cacheManager } from '../utils/cache.js';

export async function getOverview(storeId) {
  const cacheKey = `dashboard:overview:${storeId}`;
  
  // Try cache first
  const cached = await cacheManager.get(cacheKey);
  if (cached) return cached;
  
  // Fetch data
  const data = await fetchOverviewData(storeId);
  
  // Cache for 5 minutes
  await cacheManager.set(cacheKey, data, 300);
  
  return data;
}
```

#### Cache Invalidation:
- Invalidate on data changes
- Use cache tags for group invalidation
- Implement cache warming for common queries

### Database Optimization:
- [ ] Review all queries for N+1 problems
- [ ] Add missing indexes
- [ ] Use select() to limit fields
- [ ] Implement pagination everywhere
- [ ] Use transactions for multi-step operations

---

## 🧪 Phase 6: Testing

### Test Structure:
```
tests/
├── unit/
│   ├── services/
│   │   ├── dashboard.test.js
│   │   ├── contacts.test.js
│   │   └── campaigns.test.js
│   └── utils/
│       ├── errors.test.js
│       └── validation.test.js
├── integration/
│   ├── routes/
│   │   ├── dashboard.test.js
│   │   ├── contacts.test.js
│   │   └── campaigns.test.js
│   └── services/
│       └── mitto.test.js
└── e2e/
    └── postman/
        └── collection.test.js
```

### Testing Priorities:
1. 🔴 Unit tests for services
2. 🔴 Integration tests for critical routes
3. 🟡 E2E tests with Postman
4. 🟢 Performance tests

---

## 📝 Phase 7: Documentation

### Code Documentation:
- [ ] Add JSDoc comments to all services
- [ ] Add JSDoc comments to all controllers
- [ ] Document all error codes
- [ ] Document all response formats
- [ ] Add inline comments for complex logic

### API Documentation:
- [ ] Update OpenAPI spec
- [ ] Update Postman collection
- [ ] Update README
- [ ] Create API usage examples
- [ ] Document authentication flow

---

## 📋 Implementation Checklist

### Week 1: Service Layer
- [ ] Day 1-2: Create contacts.service.js
- [ ] Day 2-3: Create campaigns.service.js
- [ ] Day 3-4: Create billing.service.js
- [ ] Day 4-5: Create remaining services

### Week 2: Controller Refactoring
- [ ] Day 1: Refactor contacts controller
- [ ] Day 2: Refactor campaigns controller
- [ ] Day 3: Refactor billing controller
- [ ] Day 4: Refactor remaining controllers
- [ ] Day 5: Testing and bug fixes

### Week 3: Security & Performance
- [ ] Day 1-2: Add input validation
- [ ] Day 2-3: Add rate limiting
- [ ] Day 3-4: Implement caching
- [ ] Day 4-5: Security audit and fixes

### Week 4: Testing & Documentation
- [ ] Day 1-2: Write unit tests
- [ ] Day 2-3: Write integration tests
- [ ] Day 3-4: Update documentation
- [ ] Day 4-5: Final testing and deployment

---

## 🎯 Success Metrics

### Code Quality:
- ✅ All controllers use service layer
- ✅ No direct Prisma queries in controllers
- ✅ Consistent error handling
- ✅ Consistent logging (no console.log/error)
- ✅ All inputs validated
- ✅ All routes rate-limited

### Performance:
- ✅ Dashboard loads < 500ms
- ✅ Contact list loads < 1s
- ✅ Campaign creation < 2s
- ✅ All queries optimized
- ✅ Caching implemented

### Security:
- ✅ No data leakage between stores
- ✅ All inputs validated
- ✅ All outputs sanitized
- ✅ Rate limiting active
- ✅ Security audit passed

### Testing:
- ✅ 80%+ code coverage
- ✅ All Postman tests pass
- ✅ No critical bugs
- ✅ Performance tests pass

---

## 🚀 Deployment Plan

### Pre-Deployment:
1. Run all tests
2. Security audit
3. Performance testing
4. Code review
5. Documentation review

### Deployment:
1. Deploy to staging
2. Run smoke tests
3. Monitor for 24 hours
4. Deploy to production
5. Monitor for 48 hours

### Post-Deployment:
1. Monitor error rates
2. Monitor performance
3. Gather user feedback
4. Plan next iteration

---

## 📞 Support & Maintenance

### Ongoing Tasks:
- Weekly code reviews
- Monthly security audits
- Quarterly performance reviews
- Continuous monitoring
- Regular updates

### Contact:
- Architecture Questions: See ARCHITECTURE_AUDIT_REPORT.md
- Implementation Help: See this document
- Bug Reports: GitHub Issues
- Feature Requests: GitHub Discussions

---

**Last Updated**: October 19, 2025  
**Next Review**: October 26, 2025  
**Status**: Phase 1 Complete, Phase 2 Ready to Start

