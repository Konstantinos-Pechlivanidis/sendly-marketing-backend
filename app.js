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
import contactsRoutes from './routes/contacts.js';
import campaignsRoutes from './routes/campaigns.js';
import templatesRoutes from './routes/templates.js';
import automationsRoutes from './routes/automations.js';
import reportsRoutes from './routes/reports.js';
import discountsRoutes from './routes/discounts.js';
import billingRoutes from './routes/billing.js';
import mittoRoutes from './routes/mitto.js';
import docsRoutes from './routes/docs.js';
import { notFound, errorHandler } from './middlewares/error.js';

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
  })
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
  })
);

// Body parsing
app.use(
  express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
      // Store raw body for webhook verification
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Logging
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// mount
app.use('/', mittoRoutes); // Mitto webhooks (no auth)
app.use('/', coreRoutes); // health, webhooks, auth helpers
if (process.env.NODE_ENV !== 'production') app.use('/', docsRoutes); // Swagger UI (dev only)
app.use('/dashboard', dashboardRoutes);
app.use('/contacts', contactsRoutes);
app.use('/campaigns', campaignsRoutes);
app.use('/templates', templatesRoutes);
app.use('/automations', automationsRoutes);
app.use('/reports', reportsRoutes);
app.use('/discounts', discountsRoutes);
app.use('/billing', billingRoutes);

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
