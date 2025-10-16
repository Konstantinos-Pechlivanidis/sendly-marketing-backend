// Fallback cache implementation when Redis is not available
class FallbackCache {
  constructor() {
    this.cache = new Map();
    this.expiry = new Map();
  }

  async set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    this.expiry.set(key, Date.now() + (ttlSeconds * 1000));
  }

  async get(key) {
    const expiry = this.expiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.expiry.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async delete(key) {
    this.cache.delete(key);
    this.expiry.delete(key);
  }

  async clearPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.cache.delete(key);
        this.expiry.delete(key);
      }
    }
  }

  async healthCheck() {
    return { status: 'healthy', type: 'fallback' };
  }
}

export const fallbackCache = new FallbackCache();
