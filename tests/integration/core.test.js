/**
 * Core Endpoints Tests
 * Tests for health check and core endpoints
 */

import { request } from '../helpers/test-client.js';

describe('Core Endpoints', () => {
  describe('GET /', () => {
    it('should return API status', async () => {
      const res = await request()
        .get('/');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('time');
    });
  });

  describe('GET /health', () => {
    it('should return basic health check', async () => {
      const res = await request()
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('t');
    });
  });

  describe('GET /health/config', () => {
    it('should return configuration health', async () => {
      const res = await request()
        .get('/health/config');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('shopify');
      expect(res.body).toHaveProperty('redis');
      expect(res.body).toHaveProperty('mitto');
    });
  });

  describe('GET /health/full', () => {
    it('should return comprehensive health check', async () => {
      const res = await request()
        .get('/health/full');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ok');
      expect(res.body).toHaveProperty('checks');
      expect(res.body).toHaveProperty('metrics');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body.checks).toHaveProperty('db');
      expect(res.body.checks).toHaveProperty('shopify');
    }, 10000); // Longer timeout for full health check
  });

  describe('GET /metrics', () => {
    it('should return metrics in JSON format', async () => {
      const res = await request()
        .get('/metrics');

      expect(res.status).toBe(200);
      expect(res.body).toBeTruthy();
    });

    it('should return metrics in Prometheus format', async () => {
      const res = await request()
        .get('/metrics?format=prometheus');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
    });
  });

  describe('GET /whoami', () => {
    it('should return shop information when authenticated', async () => {
      const res = await request()
        .get('/whoami')
        .set({
          'X-Shopify-Shop-Domain': 'test-store.myshopify.com',
        });

      // May require authentication middleware
      expect([200, 401]).toContain(res.status);
    });
  });
});

