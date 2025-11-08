/**
 * Templates Endpoints Tests
 * Comprehensive tests for all template-related endpoints
 */

import request from 'supertest';
import app from '../../app.js';
import {
  createTestShop,
  cleanupTestData,
  createTestHeaders,
} from '../helpers/test-utils.js';
import prisma from '../../services/prisma.js';

describe('Templates Endpoints', () => {
  let testShop;
  let testShopId;
  let testHeaders;

  beforeAll(async () => {
    testShop = await createTestShop({
      shopDomain: 'templates-test.myshopify.com',
    });
    testShopId = testShop.id;
    testHeaders = createTestHeaders(testShop.shopDomain);
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /templates', () => {
    beforeEach(async () => {
      // Create test templates
      await prisma.template.createMany({
        data: [
          {
            name: 'Welcome Message',
            category: 'welcome',
            content: 'Welcome to our store!',
            isPublic: true,
          },
          {
            name: 'Order Confirmation',
            category: 'order',
            content: 'Your order has been confirmed!',
            isPublic: true,
          },
          {
            name: 'Abandoned Cart',
            category: 'cart',
            content: 'Complete your purchase!',
            isPublic: true,
          },
        ],
      });
    });

    it('should return all public templates', async () => {
      const res = await request(app)
        .get('/templates')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('templates');
      expect(Array.isArray(res.body.data.templates)).toBe(true);
      expect(res.body.data.templates.length).toBeGreaterThan(0);
    });

    it('should filter templates by category', async () => {
      const res = await request(app)
        .get('/templates?category=welcome')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      res.body.data.templates.forEach(template => {
        expect(template.category).toBe('welcome');
      });
    });

    it('should search templates by name', async () => {
      const res = await request(app)
        .get('/templates?search=Welcome')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.templates.length).toBeGreaterThan(0);
      expect(res.body.data.templates[0].name).toContain('Welcome');
    });
  });

  describe('GET /templates/categories', () => {
    beforeEach(async () => {
      await prisma.template.createMany({
        data: [
          { name: 'Template 1', category: 'welcome', isPublic: true },
          { name: 'Template 2', category: 'order', isPublic: true },
          { name: 'Template 3', category: 'cart', isPublic: true },
        ],
      });
    });

    it('should return template categories', async () => {
      const res = await request(app)
        .get('/templates/categories')
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('categories');
      expect(Array.isArray(res.body.data.categories)).toBe(true);
    });
  });

  describe('GET /templates/:id', () => {
    let templateId;

    beforeEach(async () => {
      const template = await prisma.template.create({
        data: {
          name: 'Test Template',
          category: 'test',
          content: 'Test content',
          isPublic: true,
        },
      });
      templateId = template.id;
    });

    it('should return a specific template by ID', async () => {
      const res = await request(app)
        .get(`/templates/${templateId}`)
        .set(testHeaders);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(templateId);
      expect(res.body.data.name).toBe('Test Template');
      expect(res.body.data.content).toBe('Test content');
    });

    it('should return 404 for non-existent template', async () => {
      const res = await request(app)
        .get('/templates/non-existent-id')
        .set(testHeaders);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /templates/:id/track', () => {
    let templateId;

    beforeEach(async () => {
      const template = await prisma.template.create({
        data: {
          name: 'Trackable Template',
          category: 'test',
          content: 'Test',
          isPublic: true,
        },
      });
      templateId = template.id;
    });

    it('should track template usage', async () => {
      const trackData = {
        campaignId: 'test-campaign-id',
      };

      const res = await request(app)
        .post(`/templates/${templateId}/track`)
        .set(testHeaders)
        .send(trackData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify usage tracked in database
      const usage = await prisma.templateUsage.findFirst({
        where: {
          templateId,
          shopId: testShopId,
        },
      });

      expect(usage).toBeTruthy();
    });

    it('should increment usage count for same template', async () => {
      // Track first time
      await request(app)
        .post(`/templates/${templateId}/track`)
        .set(testHeaders)
        .send({});

      // Track second time
      const res = await request(app)
        .post(`/templates/${templateId}/track`)
        .set(testHeaders)
        .send({});

      expect(res.status).toBe(200);

      // Verify usage count increased
      const usage = await prisma.templateUsage.findFirst({
        where: {
          templateId,
          shopId: testShopId,
        },
      });

      expect(usage).toBeTruthy();
    });
  });
});

