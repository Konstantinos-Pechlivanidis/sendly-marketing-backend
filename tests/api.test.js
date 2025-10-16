import request from 'supertest';
import app from '../app.js';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('t');
      expect(typeof response.body.t).toBe('number');
    });
  });

  describe('GET /health/config', () => {
    it('should return configuration health', async () => {
      const response = await request(app)
        .get('/health/config')
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('shopify');
      expect(response.body).toHaveProperty('redis');
      expect(response.body).toHaveProperty('mitto');
    });
  });

  describe('GET /health/full', () => {
    it('should return comprehensive health check', async () => {
      const response = await request(app)
        .get('/health/full')
        .expect(200);

      expect(response.body).toHaveProperty('ok');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics in JSON format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return metrics in Prometheus format when requested', async () => {
      const response = await request(app)
        .get('/metrics?format=prometheus')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
    });
  });

  describe('POST /webhooks/app_uninstalled', () => {
    it('should handle app uninstall webhook', async () => {
      const response = await request(app)
        .post('/webhooks/app_uninstalled')
        .send({ myshopify_domain: 'test-shop.myshopify.com' })
        .expect(200);

      expect(response.text).toBe('OK');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('CORS', () => {
    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
