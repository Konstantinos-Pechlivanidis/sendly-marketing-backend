# 🚀 SMS Blossom Backend - Production Deployment Guide

This guide will help you deploy the SMS Blossom backend to Render.com for production use.

## 📋 Prerequisites

- Node.js 18+ installed locally
- Git repository with your code
- Render.com account
- PostgreSQL database (provided by Render)
- Redis instance (provided by Render)
- Shopify Partner account
- Mitto SMS API account

## 🔧 Environment Setup

### 1. Environment Variables

Create a `.env` file based on `env.example`:

```bash
cp env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Redis
REDIS_URL=redis://localhost:6379

# Shopify
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SCOPES=read_customers,write_customers,read_orders,read_discounts,write_discounts,read_checkouts,read_price_rules,write_price_rules,read_products

# Mitto SMS
MITTO_API_BASE=https://api.mitto.ch
MITTO_API_KEY=your_mitto_api_key
MITTO_SENDER_NAME=Sendly
MITTO_WEBHOOK_SECRET=your_webhook_secret

# Application
HOST=https://sendly-marketing-backend.onrender.com
ALLOWED_ORIGINS=https://sendly-marketing-backend.onrender.com,https://sendly-marketing-frontend.onrender.com
APP_DEFAULT_CURRENCY=EUR
NODE_ENV=production
```

## 🏗️ Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

### 3. Start Development Server

```bash
npm run dev
```

## 🚀 Render.com Deployment

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/yourrepo.git
git push -u origin main
```

### 2. Deploy to Render.com

1. **Go to [Render.com](https://render.com)** and sign in
2. **Click "New" → "Blueprint"**
3. **Connect your GitHub repository**
4. **Render will automatically detect the `render.yaml` file**
5. **Configure environment variables** (see below)
6. **Click "Apply" to deploy**

### 3. Environment Variables in Render

Set these environment variables in your Render dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection | Auto-set by Render |
| `REDIS_URL` | Redis connection | Auto-set by Render |
| `SHOPIFY_API_KEY` | Shopify API key | `your_shopify_api_key` |
| `SHOPIFY_API_SECRET` | Shopify API secret | `your_shopify_api_secret` |
| `MITTO_API_KEY` | Mitto SMS API key | `your_mitto_api_key` |
| `MITTO_WEBHOOK_SECRET` | Webhook secret | `your_webhook_secret` |
| `HOST` | Your app URL | `https://sendly-marketing-backend.onrender.com` |
| `ALLOWED_ORIGINS` | CORS origins | `https://sendly-marketing-backend.onrender.com` |

### 4. Database Migration

After deployment, run database migrations:

```bash
# Connect to your Render service and run:
npm run db:migrate
npm run db:seed
```

## 🔍 Health Checks

Your deployed application includes comprehensive health checks:

- **Basic Health**: `https://sendly-marketing-backend.onrender.com/health`
- **Configuration Health**: `https://sendly-marketing-backend.onrender.com/health/config`
- **Full Health Check**: `https://sendly-marketing-backend.onrender.com/health/full`

## 📊 Monitoring

### Health Check Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Basic health status |
| `/health/config` | Configuration health |
| `/health/full` | Comprehensive health check |
| `/metrics` | Application metrics |

### Metrics Available

- Database connection health
- Redis connection health
- Queue system health
- External API health (Mitto)
- System metrics (memory, CPU, uptime)
- Application metrics

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate API keys regularly

### 2. Database Security
- Use connection pooling
- Enable SSL connections
- Regular backups

### 3. API Security
- Rate limiting enabled
- CORS properly configured
- Helmet security headers
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Verify database is accessible
   - Check network connectivity

2. **Redis Connection Failed**
   - Check `REDIS_URL` environment variable
   - Verify Redis instance is running
   - Check connection limits

3. **Shopify API Errors**
   - Verify API keys are correct
   - Check scopes are properly configured
   - Ensure webhook URLs are accessible

4. **Mitto SMS Errors**
   - Verify API key and base URL
   - Check account balance
   - Verify sender name configuration

### Debugging

1. **Check Logs**
   ```bash
   # View Render logs
   render logs --service your-service-name
   ```

2. **Health Check**
   ```bash
   curl https://sendly-marketing-backend.onrender.com/health/full
   ```

3. **Database Connection**
   ```bash
   # Connect to database
   psql $DATABASE_URL
   ```

## 📈 Performance Optimization

### 1. Database Optimization
- Use connection pooling
- Add proper indexes
- Monitor query performance

### 2. Redis Optimization
- Configure appropriate memory limits
- Use Redis clustering for high availability
- Monitor cache hit rates

### 3. Application Optimization
- Enable compression
- Use CDN for static assets
- Monitor memory usage

## 🔄 Updates and Maintenance

### 1. Code Updates
```bash
git add .
git commit -m "Update description"
git push origin main
# Render will automatically redeploy
```

### 2. Database Migrations
```bash
# After code updates with schema changes
npm run db:migrate
```

### 3. Environment Updates
- Update environment variables in Render dashboard
- Restart service after critical changes

## 📞 Support

For deployment issues:

1. Check Render logs
2. Verify environment variables
3. Test health endpoints
4. Check external service status

## 🔗 Useful Links

- [Render.com Documentation](https://render.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shopify API Documentation](https://shopify.dev/api)
- [Mitto API Documentation](https://docs.mitto.ch)

---

**Note**: This deployment guide assumes you have the necessary accounts and API keys. Make sure to secure all credentials and never expose them in your code or logs.
