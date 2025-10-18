import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';
import { initShopifyContext } from './services/shopify.js';
import { logger, requestId, performanceMonitor, securityMonitor } from './utils/logger.js';
import { globalErrorHandler, notFoundHandler } from './utils/errors.js';
import {
  apiVersioning,
  backwardCompatibility,
  versionedResponse,
} from './middlewares/versioning.js';
import {
  sanitizeRequest,
  validateContentType,
  validateRequestSize,
} from './middlewares/security.js';
import { metricsMiddleware } from './utils/metrics.js';
import coreRoutes from './routes/core.js';
import dashboardRoutes from './routes/dashboard.js';
import contactsRoutes from './routes/contacts-enhanced.js';
import campaignsRoutes from './routes/campaigns.js';
import templatesRoutes from './routes/templates.js';
import adminTemplatesRoutes from './routes/admin-templates.js';
import automationsRoutes from './routes/automations.js';
import automationWebhookRoutes from './routes/automation-webhooks.js';
import reportsRoutes from './routes/reports.js';
import discountsRoutes from './routes/discounts.js';
import billingRoutes from './routes/billing.js';
import mittoRoutes from './routes/mitto.js';
import trackingRoutes from './routes/tracking.js';
import settingsRoutes from './routes/settings.js';
import stripeWebhookRoutes from './routes/stripe-webhooks.js';
import audiencesRoutes from './routes/audiences.js';
import shopifyRoutes from './routes/shopify.js';
import docsRoutes from './routes/docs.js';
// import { setDevShop } from './middlewares/dev-shop.js'; // Not used in current implementation
import { resolveStore, requireStore } from './middlewares/store-resolution.js';

initShopifyContext();

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(hpp());
app.use(compression());

// Request processing
app.use(requestId);
app.use(performanceMonitor);
app.use(securityMonitor);
app.use(metricsMiddleware);
app.use(sanitizeRequest);
app.use(validateContentType);
app.use(validateRequestSize(5 * 1024 * 1024)); // 5MB limit

// API versioning
app.use(apiVersioning);
app.use(backwardCompatibility);
app.use(versionedResponse);

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID', 'API-Version'],
  }),
);

// Body parsing
app.use(
  express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
      // Store raw body for webhook verification
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Logging
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);

// mount
app.use('/', mittoRoutes); // Mitto webhooks (no auth)
app.use('/', coreRoutes); // health, webhooks, auth helpers
if (process.env.NODE_ENV !== 'production') app.use('/', docsRoutes); // Swagger UI (dev only)
// Store-scoped routes (require store context)
app.use('/dashboard', resolveStore, requireStore, dashboardRoutes);
app.use('/contacts', resolveStore, requireStore, contactsRoutes);
app.use('/campaigns', resolveStore, requireStore, campaignsRoutes);
app.use('/automations', resolveStore, requireStore, automationsRoutes);
app.use('/reports', resolveStore, requireStore, reportsRoutes);
app.use('/discounts', resolveStore, requireStore, discountsRoutes);
app.use('/billing', resolveStore, requireStore, billingRoutes);
app.use('/settings', resolveStore, requireStore, settingsRoutes);
app.use('/audiences', resolveStore, requireStore, audiencesRoutes);
app.use('/shopify', resolveStore, requireStore, shopifyRoutes);

// Public routes (no store context required)
app.use('/templates', templatesRoutes); // Public templates
app.use('/tracking', trackingRoutes); // Tracking endpoints
app.use('/automation-webhooks', automationWebhookRoutes); // Automation webhooks
app.use('/webhooks/stripe', stripeWebhookRoutes); // Stripe webhooks

// Admin routes (special handling)
app.use('/admin/templates', resolveStore, requireStore, adminTemplatesRoutes);

// Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
