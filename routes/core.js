import { Router } from 'express';
import { verifySessionToken } from '../middlewares/auth.js';
import { diagnostics as shopifyDiag } from '../services/shopify.js';
import prisma from '../services/prisma.js';
import IORedis from 'ioredis';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';
import { cacheManager } from '../utils/cache.js';

const r = Router();

// health
r.get('/health', (req, res) => res.json({ ok: true, t: Date.now() }));
r.get('/health/config', (req, res) =>
  res.json({
    ok: true,
    shopify: shopifyDiag(),
    redis: !!process.env.REDIS_URL,
    mitto: { base: process.env.MITTO_API_BASE || '', hasKey: !!process.env.MITTO_API_KEY },
  })
);

r.get('/health/full', async (req, res) => {
  const startTime = Date.now();
  const out = {
    ok: true,
    checks: {},
    metrics: {},
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  };

  // Database health
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbDuration = Date.now() - dbStart;
    out.checks.db = { status: 'healthy', responseTime: `${dbDuration}ms` };
    metrics.recordDatabaseQuery('health', 'ping', dbDuration, true);
  } catch (e) {
    out.checks.db = { status: 'unhealthy', error: String(e.message) };
    out.ok = false;
    metrics.recordError(e, { component: 'database' });
  }

  // Redis health
  try {
    const redisStart = Date.now();
    const redis = new IORedis(process.env.REDIS_URL, { lazyConnect: true });
    await redis.connect();
    await redis.ping();
    await redis.quit();
    const redisDuration = Date.now() - redisStart;
    out.checks.redis = { status: 'healthy', responseTime: `${redisDuration}ms` };
  } catch (e) {
    out.checks.redis = { status: 'unhealthy', error: String(e.message) };
    out.ok = false;
    metrics.recordError(e, { component: 'redis' });
  }

  // Cache health
  try {
    const cacheHealth = await cacheManager.healthCheck();
    out.checks.cache = cacheHealth;
  } catch (e) {
    out.checks.cache = { status: 'unhealthy', error: String(e.message) };
  }

  // Queue health
  try {
    const queueStart = Date.now();
    const { smsQueue } = await import('../queue/index.js');
    const j = await smsQueue.add(
      'health',
      { t: Date.now() },
      { removeOnComplete: true, removeOnFail: true }
    );
    await j.remove();
    const queueDuration = Date.now() - queueStart;
    out.checks.queue = { status: 'healthy', responseTime: `${queueDuration}ms` };
  } catch (e) {
    out.checks.queue = { status: 'unhealthy', error: String(e.message) };
    out.ok = false;
    metrics.recordError(e, { component: 'queue' });
  }

  // Mitto API health
  try {
    const mittoStart = Date.now();
    const base = process.env.MITTO_API_BASE || '';
    if (base) {
      await axios.get(base, { timeout: 5000 }).catch(() => ({}));
      const mittoDuration = Date.now() - mittoStart;
      out.checks.mitto = { status: 'healthy', responseTime: `${mittoDuration}ms` };
    } else {
      out.checks.mitto = { status: 'not_configured', message: 'No MITTO_API_BASE set' };
    }
  } catch (e) {
    out.checks.mitto = { status: 'unhealthy', error: String(e.message) };
  }

  // Shopify config
  out.checks.shopify = shopifyDiag();

  // System metrics
  out.metrics = {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
  };

  // Application metrics
  out.metrics.app = metrics.getAllMetrics();

  const totalDuration = Date.now() - startTime;
  out.responseTime = `${totalDuration}ms`;

  logger.info('Health check completed', {
    ok: out.ok,
    duration: totalDuration,
    checks: Object.keys(out.checks).length,
  });

  res.json(out);
});

// app uninstall webhook (Shopify validates HMAC if you use Registry.process in a handler)
r.post('/webhooks/app_uninstalled', async (req, res) => {
  // TODO: add Shopify.Webhooks.Registry.process(req, res) if using the Registry,
  // and cleanup any shop data linked to req.body.myshopify_domain
  res.status(200).send('OK');
});

// example "whoami" with session token
r.get('/whoami', verifySessionToken, (req, res) => {
  res.json({ shop: req.shop });
});

// Metrics endpoint (for monitoring systems)
r.get('/metrics', (req, res) => {
  const format = req.query.format || 'json';

  if (format === 'prometheus') {
    res.setHeader('Content-Type', 'text/plain');
    res.send(metrics.exportPrometheus());
  } else {
    res.json(metrics.getAllMetrics());
  }
});

export default r;
