/**
 * Production Environment Variables
 * Hard-coded values from env_data.md for testing
 * These are used directly in tests to ensure proper API functionality
 *
 * IMPORTANT: These values are synchronized with env_data.md
 * Update this file whenever env_data.md is updated
 */

export const PRODUCTION_ENV = {
  // Database (from env_data.md)
  DATABASE_URL: 'postgresql://sendly_marketing_db_user:cI0orLyedUzwm7FzzHwevjYPdj8ZLM9f@dpg-d3ne803uibrs739dg27g-a.frankfurt-postgres.render.com/sendly_marketing_db',

  // Redis Configuration (Redis Cloud) - from env_data.md
  REDIS_HOST: 'redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com',
  REDIS_PORT: 16617,
  REDIS_USERNAME: 'default',
  REDIS_PASSWORD: 'qFb53Dp7xLU0u7V681eMQwdTdnsbISx8',

  // Shopify - from env_data.md
  SHOPIFY_API_KEY: '0286162ebb7d760fa7c6fe8b00b19081',
  SHOPIFY_API_SECRET: 'd7ec472526d8beb20274c3f034449a82P',
  SCOPES: 'read_customers,write_customers,read_orders,read_discounts,write_discounts,read_checkouts,read_price_rules,write_price_rules,read_products',

  // Mitto SMS - from env_data.md
  MITTO_API_BASE: 'https://messaging.mittoapi.com',
  MITTO_API_KEY: 'i3Hk3O2mIZAqfNZP0SlDpHhrXpeH5JMItHcVCOb86o',
  MITTO_TRAFFIC_ACCOUNT_ID: 'e8a5e53f-51ce-4cc8-9f3c-43fb1d24daf7',
  MITTO_SENDER_NAME: 'Sendly',
  MITTO_WEBHOOK_SECRET: '',

  // Stripe - from env_data.md
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key_here',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here',

  // Stripe Price IDs - EUR (from env_data.md)
  STRIPE_PRICE_ID_1000_EUR: 'prod_TNtYsxIMjpSWIO',
  STRIPE_PRICE_ID_5000_EUR: 'prod_TNta0ByxwriXVK',
  STRIPE_PRICE_ID_10000_EUR: 'prod_TNtbyT7i4XfUCD',
  STRIPE_PRICE_ID_25000_EUR: 'prod_TNtbFPemOKuKBx',

  // Stripe Price IDs - USD (from env_data.md)
  STRIPE_PRICE_ID_1000_USD: 'prod_TNtsDe5V2uRCkA',
  STRIPE_PRICE_ID_5000_USD: 'prod_TNtt8H2sHnrC9W',
  STRIPE_PRICE_ID_10000_USD: 'prod_TNttfdW67GTNSb',
  STRIPE_PRICE_ID_25000_USD: 'prod_TNtuDiIn9qfGW5',

  // Application - from env_data.md
  HOST: 'https://sendly-marketing-backend.onrender.com',
  FRONTEND_URL: 'http://localhost:3000',
  APP_DEFAULT_CURRENCY: 'EUR',
  ALLOWED_ORIGINS: 'https://sendly-marketing-backend.onrender.com',

  // Test Shop Configuration
  // Using sms-blossom-dev.myshopify.com as test shop
  TEST_SHOP_DOMAIN: 'sms-blossom-dev.myshopify.com',
  TEST_SHOP_NAME: 'SMS Blossom Dev',
  TEST_SHOP_CREDITS: 10000,
  TEST_SHOP_CURRENCY: 'EUR',
};

/**
 * Set production environment variables for tests
 */
export function setProductionEnv() {
  Object.entries(PRODUCTION_ENV).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      process.env[key] = value;
    }
  });
}

export default PRODUCTION_ENV;

