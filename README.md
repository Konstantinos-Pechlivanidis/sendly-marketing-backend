# Sendly Marketing Backend

**SMS Blossom - Shopify SMS Marketing Extension Backend**

Production-ready backend API for Shopify SMS marketing extension with multi-tenant architecture.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database
- Redis (optional, falls back to memory cache)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start server
npm start
```

## 📚 Documentation

- **[Complete API Documentation](./COMPREHENSIVE_API_DOCUMENTATION.md)** - Full API reference
- **[Test Documentation](./tests/README.md)** - Testing guide

## 🔧 Environment Variables

See `env.example` for all required and optional environment variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SHOPIFY_API_KEY` - Shopify API key
- `SHOPIFY_API_SECRET` - Shopify API secret
- `STRIPE_SECRET_KEY` - Stripe secret key

## 🏗️ Architecture

- **Multi-tenant:** Each Shopify store is a separate tenant with complete data isolation
- **Store Resolution:** Automatic store detection from headers, query params, or body
- **Database:** PostgreSQL with Prisma ORM
- **Caching:** Redis (with memory fallback)
- **Queue:** BullMQ for background jobs

## 📡 API Endpoints

All endpoints require store context via `X-Shopify-Shop-Domain` header.

See [COMPREHENSIVE_API_DOCUMENTATION.md](./COMPREHENSIVE_API_DOCUMENTATION.md) for complete API reference.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:billing
```

## 📦 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run lint` - Run ESLint

## 🔐 Security

- Environment variable validation on startup
- Rate limiting configured
- Input validation throughout
- CORS properly configured
- Security headers via Helmet

## 🚀 Production Deployment

1. Set all required environment variables
2. Run `npm run db:migrate` to apply migrations
3. Start server with `npm start`
4. Verify health: `GET /health`

## 📝 License

ISC

## 👤 Author

Konstantinos Pechlivanidis

