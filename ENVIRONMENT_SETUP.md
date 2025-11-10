# Environment Variables Setup Guide

Complete guide for configuring environment variables for Sendly Backend.

## 📋 Quick Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values with your actual credentials
3. **Never commit `.env`** to git (already in `.gitignore`)

## 🔑 Required Variables

### Application Settings

```env
NODE_ENV=development          # development | production | test
PORT=3000                     # Server port
APP_URL=https://your-app-url  # Your deployed backend URL
```

### Shopify Configuration

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_customers,write_customers,read_marketing,write_marketing,read_discounts
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
```

**Where to find:**
- API Key & Secret: Shopify Partner Dashboard → Apps → Your App
- Shop Domain: Your Shopify store URL
- Access Token: Shopify Admin → Apps → Your App → Debug Information

### Redis Cloud Configuration ⚠️ CRITICAL

```env
REDIS_HOST=redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=16617
REDIS_USERNAME=default
REDIS_PASSWORD=qFb53Dp7xLU0u7V681eMQwdTdnsbISx8
REDIS_TLS=true              # MUST be true for Redis Cloud
REDIS_DB=0
```

**Important:**
- `REDIS_TLS=true` is **required** for Redis Cloud connections
- Without TLS, you'll get "Command timed out" errors
- See [REDIS_SETUP.md](./REDIS_SETUP.md) for detailed guide

**Test connection:**
```bash
npm run test:redis
```

### Database Configuration

```env
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```

**Format:**
- PostgreSQL: `postgresql://user:password@host:port/dbname`
- With SSL: `postgresql://user:password@host:port/dbname?sslmode=require`

### Mitto SMS Service

```env
MITTO_API_KEY=your_api_key
MITTO_SENDER_NAME=YourBrand
MITTO_BASE_URL=https://rest.mitto.ch/api/v1
```

**Where to find:**
- Mitto Dashboard → API Keys
- Sender Name: Your approved sender ID

### Stripe Payment

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx    # Test key starts with sk_test_
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Where to find:**
- Stripe Dashboard → Developers → API Keys
- Webhook Secret: Developers → Webhooks → Add endpoint

**Important:**
- Use `sk_test_` for development
- Use `sk_live_` for production only

### Security

```env
JWT_SECRET=generate_random_32_char_string
SESSION_SECRET=generate_random_32_char_string
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Logging

```env
LOG_LEVEL=info              # debug | info | warn | error
LOG_FORMAT=json             # json | pretty
```

### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

## 🧪 Testing Variables

```env
SKIP_REDIS=false            # Set to true to skip Redis in tests
NODE_ENV=test               # Set to test for test mode
```

## ✅ Validation Checklist

Use this checklist to verify your setup:

### Shopify
- [ ] `SHOPIFY_API_KEY` is set
- [ ] `SHOPIFY_API_SECRET` is set
- [ ] `SHOPIFY_SHOP_DOMAIN` matches your store
- [ ] `SHOPIFY_ACCESS_TOKEN` is the full token from Debug Information

### Redis Cloud
- [ ] `REDIS_HOST` is correct (copy from Redis Cloud dashboard)
- [ ] `REDIS_PORT` is correct (usually custom port like 16617)
- [ ] `REDIS_USERNAME` is set to `default`
- [ ] `REDIS_PASSWORD` is correct
- [ ] `REDIS_TLS=true` is set
- [ ] Connection test passes: `npm run test:redis`

### Database
- [ ] `DATABASE_URL` is valid PostgreSQL connection string
- [ ] Can connect: `npx prisma db pull`

### Mitto
- [ ] `MITTO_API_KEY` is valid
- [ ] `MITTO_SENDER_NAME` is approved

### Stripe
- [ ] `STRIPE_SECRET_KEY` is set
- [ ] Using `sk_test_` for development
- [ ] `STRIPE_WEBHOOK_SECRET` is set (if using webhooks)

### Security
- [ ] `JWT_SECRET` is random and secure (32+ characters)
- [ ] `SESSION_SECRET` is random and secure (32+ characters)

## 🚨 Common Issues

### Issue: "Redis Command timed out"

**Solution:**
```env
REDIS_TLS=true  # Add this!
```

### Issue: "Shopify API authentication failed"

**Solution:**
- Verify `SHOPIFY_ACCESS_TOKEN` is the **full** token
- Check token in Shopify Admin → Apps → Debug Information
- Token should start with `shpat_`

### Issue: "Database connection failed"

**Solution:**
- Verify `DATABASE_URL` format is correct
- Check if database is accessible
- Try: `npx prisma db pull`

### Issue: "Stripe API key invalid"

**Solution:**
- Use `sk_test_` for development
- Never use live keys in development
- Get key from Stripe Dashboard → Developers → API Keys

## 🔐 Security Best Practices

1. **Never commit `.env`**
   - Already in `.gitignore`
   - Double-check before commits

2. **Use different credentials per environment**
   - Development: Test/sandbox credentials
   - Production: Live credentials

3. **Rotate secrets regularly**
   - Change passwords quarterly
   - Regenerate API keys if compromised

4. **Restrict access**
   - Use IP whitelisting where possible
   - Limit API key permissions

5. **Monitor usage**
   - Check logs for suspicious activity
   - Monitor API usage in dashboards

## 📝 Environment-Specific Configurations

### Development

```env
NODE_ENV=development
LOG_LEVEL=debug
LOG_FORMAT=pretty
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### Production

```env
NODE_ENV=production
LOG_LEVEL=info
LOG_FORMAT=json
STRIPE_SECRET_KEY=sk_live_xxxxx
REDIS_TLS=true
```

### Testing

```env
NODE_ENV=test
SKIP_REDIS=true
LOG_LEVEL=error
```

## 🔗 Related Documentation

- [REDIS_SETUP.md](./REDIS_SETUP.md) - Detailed Redis configuration
- [POSTMAN_SETUP.md](./POSTMAN_SETUP.md) - API testing setup
- [README.md](./README.md) - General documentation

## 🧪 Testing Your Configuration

### Test Redis Connection
```bash
npm run test:redis
```

### Test Database Connection
```bash
npx prisma db pull
```

### Test Application
```bash
npm run dev
```

Then check:
- `http://localhost:3000/health` - Should return OK
- `http://localhost:3000/health/full` - Should show all services healthy

---

**Need help?** Check the troubleshooting sections in each service's documentation.

