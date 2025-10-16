import request from 'supertest';
import app from '../app.js';

describe('Security Tests', () => {
  describe('Rate Limiting', () => {
    it('should allow normal requests', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.ok).toBe(true);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject requests with invalid content type', async () => {
      const response = await request(app)
        .post('/contacts')
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(400);

      expect(response.body.error).toContain('Invalid content type');
    });

    it('should handle large requests', async () => {
      const largeData = 'x'.repeat(6 * 1024 * 1024); // 6MB
      
      const response = await request(app)
        .post('/contacts')
        .send({ data: largeData })
        .expect(413);

      expect(response.body.error).toContain('Request entity too large');
    });
  });

  describe('Security Headers', () => {
    it('should include all security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
      ];

      securityHeaders.forEach(header => {
        expect(response.headers[header]).toBeDefined();
      });
    });

    it('should not expose X-Powered-By header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://sendly-marketing-backend.onrender.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include CORS headers for preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'https://sendly-marketing-backend.onrender.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should not expose internal errors', async () => {
      // This test would need to trigger an internal error
      // For now, we'll test that the error handler exists
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/contacts')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Request ID', () => {
    it('should include request ID in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });
});
