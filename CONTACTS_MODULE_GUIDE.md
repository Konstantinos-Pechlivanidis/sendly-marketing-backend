# Enhanced Contacts Module Guide

## Overview

The Enhanced Contacts Module provides comprehensive contact management with full multi-store support, advanced filtering, birthday automation integration, and robust data validation.

## Features

### ✅ **Data Model Enhancements**
- **birthDate**: DateTime field for birthday automation triggers
- **gender**: String field with validation (male, female, other)
- **Enhanced SMS consent**: Three-state consent (opted_in, opted_out, unknown)
- **Store scoping**: All operations scoped to current store
- **Comprehensive indexing**: Optimized queries for all use cases

### ✅ **API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts with filtering, search, pagination |
| GET | `/api/contacts/stats` | Get contact statistics |
| GET | `/api/contacts/birthdays` | Get contacts with birthdays today |
| GET | `/api/contacts/:id` | Get single contact |
| POST | `/api/contacts` | Create new contact |
| POST | `/api/contacts/import` | Import contacts from CSV |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |

### ✅ **Advanced Filtering & Search**

#### Query Parameters
```javascript
// Basic pagination
GET /api/contacts?page=1&pageSize=20

// Filtering
GET /api/contacts?filter=male                    // male, female, consented, nonconsented
GET /api/contacts?gender=female                  // male, female, other
GET /api/contacts?smsConsent=opted_in           // opted_in, opted_out, unknown
GET /api/contacts?hasBirthDate=true             // true, false

// Search
GET /api/contacts?q=John                        // Search by name, email, phone, tags

// Sorting
GET /api/contacts?sortBy=createdAt&sortOrder=desc
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "contacts": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "applied": {
        "filter": "male",
        "searchTerm": "John",
        "gender": "male",
        "smsConsent": "opted_in"
      },
      "available": {
        "genders": ["male", "female", "other"],
        "smsConsent": ["opted_in", "opted_out", "unknown"],
        "filters": ["all", "male", "female", "consented", "nonconsented"]
      }
    }
  }
}
```

### ✅ **Data Validation**

#### Phone Number Validation
```javascript
// E.164 format required
const e164Regex = /^\+[1-9]\d{1,14}$/;
// Examples: +1234567890, +306912345678
```

#### Gender Validation
```javascript
// Allowed values: male, female, other, null
if (gender && !['male', 'female', 'other'].includes(gender)) {
  throw new Error('Invalid gender');
}
```

#### Birth Date Validation
```javascript
// Must be valid ISO date, cannot be in future
const birthDate = new Date(birthDateString);
if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
  throw new Error('Invalid birth date');
}
```

#### SMS Consent Validation
```javascript
// Three-state consent system
const validConsent = ['opted_in', 'opted_out', 'unknown'];
if (!validConsent.includes(smsConsent)) {
  throw new Error('Invalid SMS consent');
}
```

### ✅ **Birthday Automation Integration**

#### Birthday Contact Query
```javascript
// Get contacts with birthdays today
const birthdayContacts = await getBirthdayContactsForStore(storeId, new Date());

// Filter by month and day
const todayBirthdays = birthdayContacts.filter(contact => {
  const birthDate = new Date(contact.birthDate);
  return birthDate.getMonth() === today.getMonth() && 
         birthDate.getDate() === today.getDate();
});
```

#### Automation Processing
```javascript
// Process birthday automation for store
const results = await processBirthdayAutomation(storeId);

// Process for all stores
const allResults = await processAllBirthdayAutomations();
```

#### Message Personalization
```javascript
// Template placeholders
const template = "Happy Birthday {{firstName}}! Enjoy 10% off with code BDAY10";
const message = composeBirthdayMessage(template, contact);
// Result: "Happy Birthday John! Enjoy 10% off with code BDAY10"
```

### ✅ **Store Scoping & Security**

#### Automatic Store Scoping
```javascript
// All operations automatically scoped to current store
const contactsQuery = withStoreScope(storeId, prisma.contact);

// These queries only return data for the current store
const contacts = await contactsQuery.findMany();
const contact = await contactsQuery.findUnique({ where: { id } });
```

#### Cross-Store Protection
```javascript
// Validate ownership before operations
await validateStoreOwnership(storeId, prisma.contact, contactId, 'Contact');

// Cross-store access attempts are blocked
try {
  await withStoreScope(store1Id, prisma.contact).update({
    where: { id: store2ContactId },
    data: { firstName: 'Hacked' }
  });
} catch (error) {
  // This will fail - contact not found in store1 context
}
```

### ✅ **Statistics & Analytics**

#### Contact Statistics
```javascript
GET /api/contacts/stats

// Response
{
  "success": true,
  "data": {
    "total": 150,
    "smsConsent": {
      "optedIn": 120,
      "optedOut": 20,
      "unknown": 10,
      "consentRate": 80
    },
    "gender": {
      "male": 75,
      "female": 70,
      "other": 5,
      "unspecified": 0
    },
    "birthDate": {
      "withBirthDate": 100,
      "withoutBirthDate": 50,
      "birthDateRate": 67
    },
    "automation": {
      "birthdayEligible": 100,
      "smsEligible": 120
    }
  }
}
```

#### Birthday Automation Stats
```javascript
const stats = await getBirthdayAutomationStats(storeId, startDate, endDate);

// Returns:
{
  totalBirthdayContacts: 100,
  messagesSent: 25,
  upcomingBirthdays: 5,
  upcoming: [...] // Next 10 upcoming birthdays
}
```

### ✅ **Import/Export Functionality**

#### CSV Import
```javascript
POST /api/contacts/import
Content-Type: application/json

{
  "contacts": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "phoneE164": "+1234567890",
      "email": "john@example.com",
      "gender": "male",
      "birthDate": "1990-05-15",
      "smsConsent": "opted_in",
      "tags": ["vip", "loyal"]
    }
  ]
}
```

#### Import Response
```json
{
  "success": true,
  "data": {
    "total": 100,
    "imported": 95,
    "skipped": 5,
    "skippedContacts": ["+1234567890", "+1987654321"]
  },
  "message": "Successfully imported 95 contacts"
}
```

### ✅ **Performance Optimizations**

#### Database Indexes
```sql
-- Critical indexes for performance
CREATE INDEX idx_contact_shop_phone ON "Contact" ("shopId", "phoneE164");
CREATE INDEX idx_contact_shop_email ON "Contact" ("shopId", "email");
CREATE INDEX idx_contact_shop_sms_consent ON "Contact" ("shopId", "smsConsent");
CREATE INDEX idx_contact_shop_birth_date ON "Contact" ("shopId", "birthDate");
CREATE INDEX idx_contact_shop_created ON "Contact" ("shopId", "createdAt");
CREATE INDEX idx_contact_shop_gender ON "Contact" ("shopId", "gender");
```

#### Query Optimization
```javascript
// Efficient pagination
const contacts = await withStoreScope(storeId, prisma.contact).findMany({
  where: { smsConsent: 'opted_in' },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: (page - 1) * 20,
});

// Efficient aggregation
const stats = await withStoreScope(storeId, prisma.contact).aggregate({
  _count: { id: true },
  _sum: { credits: true },
  where: { smsConsent: 'opted_in' }
});
```

### ✅ **Error Handling**

#### Validation Errors
```json
{
  "success": false,
  "error": "Invalid phone format",
  "message": "Phone number must be in E.164 format (e.g., +1234567890)"
}
```

#### Access Control Errors
```json
{
  "success": false,
  "error": "Access denied",
  "message": "This contact does not belong to your store"
}
```

#### Duplicate Data Errors
```json
{
  "success": false,
  "error": "Contact already exists",
  "message": "A contact with this phoneE164 already exists in your store"
}
```

### ✅ **Integration Examples**

#### Campaign Audience Selection
```javascript
// Get SMS-consented contacts for campaign
const audience = await withStoreScope(storeId, prisma.contact).findMany({
  where: { smsConsent: 'opted_in' },
  select: { id: true, phoneE164: true, firstName: true }
});
```

#### Birthday Automation Trigger
```javascript
// Daily job to check for birthdays
const today = new Date();
const birthdayContacts = await getBirthdayContactsForStore(storeId, today);

for (const contact of birthdayContacts) {
  await sendBirthdaySMS(contact, storeId);
}
```

#### Segment Creation
```javascript
// Create segment based on contact criteria
const segment = await withStoreScope(storeId, prisma.segment).create({
  data: {
    name: "VIP Customers",
    ruleJson: {
      conditions: [
        { field: "tags", operator: "contains", value: "vip" },
        { field: "smsConsent", operator: "equals", value: "opted_in" }
      ]
    }
  }
});
```

### ✅ **Testing & Validation**

#### Unit Tests
```javascript
describe('Enhanced Contacts', () => {
  test('Store scoping works correctly', async () => {
    const store1 = await createTestStore();
    const store2 = await createTestStore();
    
    const contact1 = await createContact(store1.id, { phoneE164: '+1234567890' });
    const contact2 = await createContact(store2.id, { phoneE164: '+1987654321' });
    
    // Store1 should not see Store2's contact
    const store1Contacts = await withStoreScope(store1.id, prisma.contact).findMany();
    expect(store1Contacts).toHaveLength(1);
    expect(store1Contacts[0].id).toBe(contact1.id);
  });
});
```

#### Integration Tests
```javascript
describe('Birthday Automation', () => {
  test('Finds contacts with birthdays today', async () => {
    const store = await createTestStore();
    const contact = await createContact(store.id, {
      birthDate: new Date(),
      smsConsent: 'opted_in'
    });
    
    const birthdayContacts = await getBirthdayContactsForStore(store.id, new Date());
    expect(birthdayContacts).toHaveLength(1);
    expect(birthdayContacts[0].id).toBe(contact.id);
  });
});
```

### ✅ **Best Practices**

#### 1. Always Use Store Scoping
```javascript
// ✅ Good
const contacts = await withStoreScope(storeId, prisma.contact).findMany();

// ❌ Bad
const contacts = await prisma.contact.findMany(); // No store scoping!
```

#### 2. Validate Input Data
```javascript
// ✅ Good
const e164Regex = /^\+[1-9]\d{1,14}$/;
if (!e164Regex.test(phoneE164)) {
  throw new Error('Invalid phone format');
}

// ❌ Bad
// No validation - security risk!
```

#### 3. Handle Errors Gracefully
```javascript
// ✅ Good
try {
  await validateStoreOwnership(storeId, prisma.contact, contactId, 'Contact');
} catch (error) {
  if (error.message.includes('does not belong to the current store')) {
    return res.status(403).json({ error: 'Access denied' });
  }
  throw error;
}
```

#### 4. Log All Operations
```javascript
// ✅ Good
logger.info('Contact created', {
  storeId,
  contactId: contact.id,
  phoneE164: contact.phoneE164,
  hasBirthDate: !!contact.birthDate
});
```

#### 5. Use Efficient Queries
```javascript
// ✅ Good - Use indexes
const contacts = await withStoreScope(storeId, prisma.contact).findMany({
  where: { smsConsent: 'opted_in' },
  orderBy: { createdAt: 'desc' },
  take: 20
});

// ❌ Bad - No index usage
const contacts = await withStoreScope(storeId, prisma.contact).findMany({
  where: { firstName: { contains: 'John' } }
});
```

## Conclusion

The Enhanced Contacts Module provides a robust, scalable, and secure foundation for contact management in a multi-tenant environment. With comprehensive filtering, birthday automation integration, and strict store scoping, it ensures data isolation while providing powerful features for customer engagement.

Key benefits:
- **Complete store isolation** - No cross-tenant data access
- **Advanced filtering** - Gender, consent, birth date, search
- **Birthday automation** - Seamless integration with SMS campaigns
- **Data validation** - E.164 phones, valid dates, proper consent
- **Performance optimized** - Efficient queries with proper indexing
- **Comprehensive testing** - Unit, integration, and E2E tests
- **Production ready** - Error handling, logging, monitoring
