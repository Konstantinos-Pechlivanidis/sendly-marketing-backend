export const productionConfig = {
  // Server Configuration
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'https://sendly-marketing-backend.onrender.com',
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: 20,
    connectionTimeout: 30000,
    queryTimeout: 30000,
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  
  // Security Configuration
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://sendly-marketing-backend.onrender.com',
        'https://sendly-marketing-frontend.onrender.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID', 'API-Version'],
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    },
  },
  
  // Shopify Configuration
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(',') || [
      'read_customers',
      'write_customers',
      'read_orders',
      'read_discounts',
      'write_discounts',
      'read_checkouts',
      'read_price_rules',
      'write_price_rules',
      'read_products',
    ],
  },
  
  // Mitto SMS Configuration
  mitto: {
    apiBase: process.env.MITTO_API_BASE || 'https://api.mitto.ch',
    apiKey: process.env.MITTO_API_KEY,
    senderName: process.env.MITTO_SENDER_NAME || 'Sendly',
    webhookSecret: process.env.MITTO_WEBHOOK_SECRET,
    timeout: 15000,
  },
  
  // Application Configuration
  app: {
    defaultCurrency: process.env.APP_DEFAULT_CURRENCY || 'EUR',
    timezone: 'UTC',
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    enableConsole: true,
    enableFile: false, // Disabled for cloud deployment
  },
  
  // Monitoring Configuration
  monitoring: {
    enableMetrics: true,
    enableHealthChecks: true,
    healthCheckInterval: 30000, // 30 seconds
  },
  
  // Queue Configuration
  queue: {
    concurrency: 20,
    maxRetries: 3,
    retryDelay: 5000,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
};
