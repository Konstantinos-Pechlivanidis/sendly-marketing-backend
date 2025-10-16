import request from 'supertest';
import app from '../app.js';

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('t');
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
});
