# Sendly Marketing Backend

**SMS Blossom - Shopify SMS Marketing Extension Backend**

Production-ready backend API for Shopify SMS marketing extension with multi-tenant architecture.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- Redis instance
- Shopify Partner account with API credentials
- Stripe account for payment processing
- Mitto account for SMS delivery

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your production configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Test Redis connection
npm run test:redis

# Setup Shopify access token
npm run setup:shop

# Start server
npm start
```

## 🔧 Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SHOPIFY_API_KEY` - Shopify API key
- `SHOPIFY_API_SECRET` - Shopify API secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `MITTO_API_KEY` - Mitto SMS API key
- `MITTO_API_BASE` - Mitto API base URL
- `MITTO_TRAFFIC_ACCOUNT_ID` - Mitto traffic account ID
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `REDIS_USERNAME` - Redis username
- `REDIS_PASSWORD` - Redis password

## 🏗️ Architecture

- **Multi-tenant:** Each Shopify store is a separate tenant with complete data isolation
- **Store Resolution:** Automatic store detection from `X-Shopify-Shop-Domain` header
- **Database:** PostgreSQL with Prisma ORM
- **Caching:** Redis for performance optimization
- **Queue:** BullMQ for background job processing
- **SMS Provider:** Mitto for reliable SMS delivery
- **Payments:** Stripe for credit purchases

## 📡 API Endpoints

All store-scoped endpoints require the `X-Shopify-Shop-Domain` header.

### Core Endpoints
- `GET /` - API status and info
- `GET /health` - Health check
- `GET /health/full` - Comprehensive health check
- `GET /metrics` - Application metrics

### Main Features
- **Dashboard** - Overview and statistics
- **Contacts** - Customer contact management
- **Campaigns** - SMS campaign creation and management
- **Automations** - Automated SMS triggers (welcome, birthday, abandoned cart)
- **Templates** - Pre-built SMS message templates
- **Reports** - Analytics and performance reports
- **Billing** - Credit management and purchase
- **Settings** - Store configuration

## 🔌 API Testing with Postman

Import the provided Postman collection and environment:

1. Import `Sendly_Backend.postman_collection.json`
2. Import `Sendly_Dev_Store.postman_environment.json`
3. Update the `shopify_access_token` in the environment with your store's access token
4. Select the "Sendly Dev Store" environment
5. Start making requests!

**Note:** Most endpoints require the `X-Shopify-Shop-Domain` header, which is automatically included using the `{{shopDomain}}` variable.

## 📦 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations (production)
- `npm run db:migrate:dev` - Run database migrations (development)
- `npm run db:studio` - Open Prisma Studio
- `npm run db:status` - Check migration status

## 🔐 Security Features

- Environment variable validation on startup
- Rate limiting on all endpoints
- Input validation using express-validator
- Request sanitization
- CORS properly configured
- Security headers via Helmet
- SQL injection protection via Prisma
- XSS protection
- Request size limits

## 🚀 Production Deployment

### Render.com (Recommended)

1. Connect your GitHub repository
2. Configure environment variables in Render dashboard
3. Deploy automatically on push to main branch

The `render.yaml` file contains the deployment configuration.

### Manual Deployment

1. Set all required environment variables
2. Run `npm run db:migrate` to apply migrations
3. Start server with `npm start`
4. Verify health: `GET /health`

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (dev)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

## 🏪 Shopify Integration

### Store Connection

1. Install the Shopify extension on your store
2. During installation, the app will:
   - Create a Shop record in the database
   - Store the access token securely
   - Initialize default automations and settings
3. All API requests must include the store domain header

### Multi-Store Support

The backend supports multiple Shopify stores:
- Each store has isolated data
- Store context is resolved from the `X-Shopify-Shop-Domain` header
- Automatic store creation on first request

## 💳 Billing System

The app uses a credit-based billing system:
- Credits are purchased via Stripe
- Available packages: 1,000 / 5,000 / 10,000 / 25,000 credits
- Each SMS costs 1 credit
- Automatic credit deduction on SMS send
- Transaction history tracking

## 🤖 Background Jobs

BullMQ handles background processing:
- SMS sending queue
- Automation triggers
- Scheduled campaigns
- Delivery status tracking

## 📊 Monitoring

- Winston logging to console and files
- Metrics endpoint for Prometheus
- Request performance monitoring
- Error tracking and alerting

## 🐛 Troubleshooting

### Server won't start
- Check environment variables are set correctly
- Verify database connection
- Ensure Redis is accessible
- Check logs in `logs/` directory

### SMS not sending
- Verify Mitto API credentials
- Check sufficient credit balance
- Review error logs
- Verify phone number format (E.164)

### Database issues
- Run `npm run db:status` to check migration status
- Run `npm run db:migrate` to apply pending migrations
- Check `DATABASE_URL` format

## 📝 License

ISC

## 👤 Author

Konstantinos Pechlivanidis

## 🔗 Links

- Production URL: https://sendly-marketing-backend.onrender.com
- Dev Store: sms-blossom-dev.myshopify.com

---

**Status:** Production Ready ✅
