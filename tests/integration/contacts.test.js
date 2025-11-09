/* eslint-disable no-console */
/**
 * Contacts Endpoints Tests
 * Comprehensive tests for all contact-related endpoints
 */

import { request } from '../helpers/test-client.js';
import {
  createTestShop,
  cleanupTestData,
  cleanupBeforeTest,
  createTestHeaders,
  createTestContact,
} from '../helpers/test-utils.js';
import {
  verifyContactInDb,
  // countRecords, // Available for future use
} from '../helpers/test-db.js';
import prisma from '../../services/prisma.js';
import { testConfig } from '../config/test-config.js';

describe('Contacts Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    console.log('\n📦 Setting up test shop for contacts tests...');
    // Use the actual sms-blossom-dev shop from production
    testShop = await createTestShop({
      shopDomain: testConfig.testShop.shopDomain, // sms-blossom-dev.myshopify.com
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
    console.log(`✅ Test shop ready: ${testShop.shopDomain} (ID: ${testShop.id})\n`);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /contacts', () => {
    it('should create a new contact with all fields', async () => {
      const timestamp = Date.now();
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        phoneE164: `+306977${String(timestamp).slice(-6)}`,
        email: 'john.doe@example.com',
        gender: 'male',
        birthDate: '1990-01-01',
        smsConsent: 'opted_in',
        tags: ['vip', 'newsletter'],
      };

      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send(contactData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.phoneE164).toBe(contactData.phoneE164);
      expect(res.body.data.firstName).toBe(contactData.firstName);
      expect(res.body.data.lastName).toBe(contactData.lastName);
      expect(res.body.data.email).toBe(contactData.email);
      expect(res.body.data.gender).toBe(contactData.gender);
      expect(res.body.data.smsConsent).toBe(contactData.smsConsent);
      expect(res.body.data.tags).toEqual(contactData.tags);

      // Verify in database
      await verifyContactInDb(res.body.data.id, {
        phoneE164: contactData.phoneE164,
        firstName: contactData.firstName,
        email: contactData.email,
      });
    });

    it('should create a contact with minimal required fields (phone only)', async () => {
      const timestamp = Date.now();
      const contactData = {
        phoneE164: `+306977${String(timestamp + 1).slice(-6)}`,
      };

      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send(contactData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phoneE164).toBe(contactData.phoneE164);
      expect(res.body.data.smsConsent).toBe('unknown');

      // Verify in database
      await verifyContactInDb(res.body.data.id, {
        phoneE164: contactData.phoneE164,
      });
    });

    it('should reject invalid phone format', async () => {
      const contactData = {
        phoneE164: 'invalid-phone',
      };

      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send(contactData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ValidationError');
    });

    it('should reject invalid email format', async () => {
      const timestamp = Date.now();
      const contactData = {
        phoneE164: `+306977${String(timestamp + 2).slice(-6)}`,
        email: 'invalid-email',
      };

      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send(contactData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject future birth date', async () => {
      const timestamp = Date.now();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const contactData = {
        phoneE164: `+306977${String(timestamp + 3).slice(-6)}`,
        birthDate: futureDate.toISOString(),
      };

      const res = await request()
        .post('/contacts')
        .set(testHeaders)
        .send(contactData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /contacts', () => {
    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      // Create test contacts with unique phones
      await createTestContact({ phoneE164: `+306977${String(timestamp).slice(-6)}`, firstName: 'Alice', smsConsent: 'opted_in' });
      await createTestContact({ phoneE164: `+306977${String(timestamp + 1).slice(-6)}`, firstName: 'Bob', smsConsent: 'opted_in', gender: 'male' });
      await createTestContact({ phoneE164: `+306977${String(timestamp + 2).slice(-6)}`, firstName: 'Carol', smsConsent: 'opted_out', gender: 'female' });
    });

    it('should list all contacts with pagination', async () => {
      const res = await request()
        .get('/contacts?page=1&pageSize=10')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('contacts');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.contacts)).toBe(true);
      expect(res.body.data.pagination).toHaveProperty('page', 1);
      expect(res.body.data.pagination).toHaveProperty('pageSize', 10);
    });

    it('should filter contacts by SMS consent', async () => {
      const res = await request()
        .get('/contacts?filter=consented')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // All returned contacts should have opted_in
      res.body.data.contacts.forEach(contact => {
        expect(contact.smsConsent).toBe('opted_in');
      });
    });

    it('should search contacts by name', async () => {
      const res = await request()
        .get('/contacts?search=Alice')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contacts.length).toBeGreaterThan(0);
      expect(res.body.data.contacts[0].firstName).toContain('Alice');
    });

    it('should filter contacts by gender', async () => {
      const res = await request()
        .get('/contacts?gender=male')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      res.body.data.contacts.forEach(contact => {
        expect(contact.gender).toBe('male');
      });
    });

    it('should respect max pageSize limit', async () => {
      const res = await request()
        .get('/contacts?pageSize=150') // Max is 100
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.pageSize).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /contacts/:id', () => {
    let contactId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const contact = await createTestContact({
        phoneE164: `+306977${String(timestamp).slice(-6)}`,
        firstName: 'Test',
        lastName: 'User',
      });
      contactId = contact.id;
    });

    it('should get a specific contact by ID', async () => {
      const res = await request()
        .get(`/contacts/${contactId}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(contactId);
      expect(res.body.data.phoneE164).toBe('+306977999999');
    });

    it('should return 404 for non-existent contact', async () => {
      const res = await request()
        .get('/contacts/non-existent-id')
        .set(testHeaders);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /contacts/:id', () => {
    let contactId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const contact = await createTestContact({
        phoneE164: `+306977${String(timestamp).slice(-6)}`,
        firstName: 'Original',
      });
      contactId = contact.id;
    });

    it('should update contact with new data', async () => {
      const updateData = {
        firstName: 'Updated',
        email: 'updated@example.com',
        tags: ['updated'],
      };

      const res = await request()
        .put(`/contacts/${contactId}`)
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe(updateData.firstName);
      expect(res.body.data.email).toBe(updateData.email);
      expect(res.body.data.tags).toEqual(updateData.tags);

      // Verify in database
      await verifyContactInDb(contactId, {
        firstName: updateData.firstName,
        email: updateData.email,
      });
    });

    it('should update only provided fields', async () => {
      const originalContact = await prisma.contact.findUnique({
        where: { id: contactId },
      });

      const updateData = {
        email: 'partial-update@example.com',
      };

      const res = await request()
        .put(`/contacts/${contactId}`)
        .set(testHeaders)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(updateData.email);
      expect(res.body.data.firstName).toBe(originalContact.firstName); // Unchanged
    });
  });

  describe('DELETE /contacts/:id', () => {
    let contactId;

    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const contact = await createTestContact({
        phoneE164: `+306977${String(timestamp).slice(-6)}`,
      });
      contactId = contact.id;
    });

    it('should delete a contact', async () => {
      const res = await request()
        .delete(`/contacts/${contactId}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deleted from database
      const deleted = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('GET /contacts/stats', () => {
    beforeEach(async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      // Create contacts with different consent statuses and unique phones
      await createTestContact({ phoneE164: `+306977${String(timestamp).slice(-6)}`, smsConsent: 'opted_in', gender: 'male' });
      await createTestContact({ phoneE164: `+306977${String(timestamp + 1).slice(-6)}`, smsConsent: 'opted_in', gender: 'female' });
      await createTestContact({ phoneE164: `+306977${String(timestamp + 2).slice(-6)}`, smsConsent: 'opted_out' });
    });

    it('should return contact statistics', async () => {
      const res = await request()
        .get('/contacts/stats')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('optedIn');
      expect(res.body.data).toHaveProperty('optedOut');
      expect(res.body.data).toHaveProperty('byGender');
      expect(res.body.data.byGender).toHaveProperty('male');
      expect(res.body.data.byGender).toHaveProperty('female');
    });
  });

  describe('GET /contacts/birthdays', () => {
    beforeEach(async () => {
      const today = new Date();
      const thisYear = today.getFullYear();

      // Create contact with birthday today
      await createTestContact({
        phoneE164: '+306977111111',
        birthDate: new Date(thisYear, today.getMonth(), today.getDate()),
        smsConsent: 'opted_in',
      });

      // Create contact with birthday in 3 days
      const futureDate = new Date(thisYear, today.getMonth(), today.getDate() + 3);
      await createTestContact({
        phoneE164: '+306977222222',
        birthDate: futureDate,
        smsConsent: 'opted_in',
      });
    });

    it('should return contacts with birthdays in specified range', async () => {
      const res = await request()
        .get('/contacts/birthdays?daysAhead=7')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('contacts');
      expect(res.body.data).toHaveProperty('count');
      expect(Array.isArray(res.body.data.contacts)).toBe(true);
    });
  });

  describe('POST /contacts/import', () => {
    it('should import multiple contacts', async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const phone1 = `+306977${String(timestamp).slice(-6)}`;
      const phone2 = `+306977${String(timestamp + 1).slice(-6)}`;
      const contactsData = {
        contacts: [
          {
            phoneE164: phone1,
            firstName: 'Import1',
            smsConsent: 'opted_in',
          },
          {
            phoneE164: phone2,
            firstName: 'Import2',
            email: 'import2@example.com',
            smsConsent: 'opted_in',
          },
        ],
      };

      const res = await request()
        .post('/contacts/import')
        .set(testHeaders)
        .send(contactsData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total', 2);
      expect(res.body.data).toHaveProperty('created');
      expect(res.body.data).toHaveProperty('updated');
      expect(res.body.data).toHaveProperty('skipped');
      expect(res.body.data.created).toBeGreaterThanOrEqual(0);

      // Verify contacts in database
      const contact1 = await prisma.contact.findFirst({
        where: { shopId: testShopId, phoneE164: phone1 },
      });
      expect(contact1).toBeTruthy();
      expect(contact1.firstName).toBe('Import1');
    });

    it('should update existing contacts on import', async () => {
      await cleanupBeforeTest();
      const timestamp = Date.now();
      const phone = `+306977${String(timestamp).slice(-6)}`;
      // Create existing contact
      await createTestContact({
        phoneE164: phone,
        firstName: 'Original',
      });

      const contactsData = {
        contacts: [
          {
            phoneE164: phone,
            firstName: 'Updated',
            email: 'updated@example.com',
          },
        ],
      };

      const res = await request()
        .post('/contacts/import')
        .set(testHeaders)
        .send(contactsData);

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBeGreaterThan(0);

      // Verify updated in database
      const updated = await prisma.contact.findFirst({
        where: { shopId: testShopId, phoneE164: phone },
      });
      expect(updated.firstName).toBe('Updated');
    });

    it('should skip invalid contacts', async () => {
      const timestamp = Date.now();
      const contactsData = {
        contacts: [
          {
            phoneE164: `+306977${String(timestamp + 4).slice(-6)}`,
            firstName: 'Valid',
            smsConsent: 'opted_in',
          },
          {
            phoneE164: 'invalid-phone',
            firstName: 'Invalid',
          },
        ],
      };

      const res = await request()
        .post('/contacts/import')
        .set(testHeaders)
        .send(contactsData);

      expect(res.status).toBe(200);
      expect(res.body.data.skipped).toBeGreaterThan(0);
      expect(res.body.data.errors.length).toBeGreaterThan(0);
    });
  });
});

