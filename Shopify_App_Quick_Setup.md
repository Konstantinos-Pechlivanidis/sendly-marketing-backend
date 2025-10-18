# 🚀 Sendly Marketing - Shopify App Quick Setup

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Redis server
- Shopify Partner account
- Mitto SMS account

## ⚡ Quick Start (5 minutes)

### 1. Backend Setup
```bash
# Clone and setup
git clone <your-repo>
cd sendly-marketing-backend
npm install

# Environment setup
cp env.example .env
# Edit .env with your credentials

# Database setup
npx prisma db push
npx prisma db seed

# Start backend
npm start
```

### 2. Environment Configuration
```bash
# .env file
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/sendly
REDIS_URL=redis://localhost:6379

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SCOPES=read_customers,write_customers,read_orders,read_discounts

# Mitto SMS Configuration
MITTO_API_BASE=http://messaging.mittoapi.com
MITTO_API_KEY=your_mitto_api_key
MITTO_TRAFFIC_ACCOUNT_ID=your_traffic_account_id
MITTO_SENDER_NAME=Sendly

# Your Store Domain
SHOP_DOMAIN=your-store.myshopify.com
```

### 3. Postman Testing
1. Import `Shopify_App_Development.postman_collection.json`
2. Import `Shopify_App_Development.postman_environment.json`
3. Update `shopDomain` variable with your store domain
4. Test health endpoint: `GET http://localhost:3000/health`

### 4. Frontend Development
```bash
# Create React app
npx create-react-app sendly-marketing-frontend
cd sendly-marketing-frontend

# Install dependencies
npm install axios react-router-dom

# Copy API service from documentation
# Implement components as shown in guide
```

## 🧪 Testing Checklist

### Backend Health
- [ ] `GET /health` returns 200
- [ ] `GET /health/full` shows all services healthy
- [ ] Database connection working
- [ ] Redis connection working

### Store Resolution
- [ ] `X-Shopify-Shop-Domain` header resolves store
- [ ] All API endpoints scoped to store
- [ ] No cross-store data leakage

### Core Features
- [ ] Contacts CRUD operations
- [ ] Campaign creation and sending
- [ ] Automation configuration
- [ ] Template browsing
- [ ] Reports generation
- [ ] Settings management

### SMS Integration
- [ ] Mitto API credentials configured
- [ ] SMS sending works
- [ ] Delivery tracking functional
- [ ] Credit validation working

## 🔧 Development Workflow

### Daily Development
1. **Start Backend**: `npm start` (port 3000)
2. **Start Frontend**: `npm start` (port 3001)
3. **Test with Postman**: Use development collection
4. **Monitor Logs**: Check console for errors

### API Testing
```bash
# Health check
curl -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
     http://localhost:3000/health

# Dashboard
curl -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
     http://localhost:3000/api/dashboard/overview

# Contacts
curl -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
     http://localhost:3000/api/contacts
```

### Frontend Integration
```javascript
// API service configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://sendly-marketing-backend.onrender.com'
  : 'http://localhost:3000';

const SHOP_DOMAIN = 'your-store.myshopify.com';

// All requests include store domain
const response = await fetch(`${API_BASE_URL}/api/contacts`, {
  headers: {
    'X-Shopify-Shop-Domain': SHOP_DOMAIN,
    'Content-Type': 'application/json'
  }
});
```

## 🚀 Production Deployment

### Backend Deployment
1. **Deploy to Render**: Connect GitHub repo
2. **Set Environment Variables**: All production values
3. **Database**: Production PostgreSQL URL
4. **Redis**: Production Redis URL
5. **Domain**: Update Shopify app settings

### Frontend Deployment
1. **Build**: `npm run build`
2. **Deploy**: Upload to hosting service
3. **Environment**: Set production API URL
4. **Shopify App**: Update app URL in partner dashboard

## 🐛 Common Issues & Solutions

### Store Resolution Failed
```bash
# Check store domain format
X-Shopify-Shop-Domain: your-store.myshopify.com  # ✅ Correct
X-Shopify-Shop-Domain: your-store               # ❌ Wrong
```

### Database Connection Issues
```bash
# Check DATABASE_URL format
DATABASE_URL=postgresql://user:pass@host:port/db  # ✅ Correct
DATABASE_URL=postgres://user:pass@host:port/db   # ❌ Wrong
```

### Redis Connection Issues
```bash
# Check REDIS_URL format
REDIS_URL=redis://localhost:6379        # ✅ Correct
REDIS_URL=redis://user:pass@host:6379  # ✅ Also correct
```

### SMS Sending Issues
```bash
# Check Mitto configuration
MITTO_API_KEY=your_actual_key           # ✅ Correct
MITTO_TRAFFIC_ACCOUNT_ID=your_actual_id # ✅ Correct
MITTO_SENDER_NAME=Sendly                # ✅ Correct
```

## 📞 Support

- **Documentation**: `Shopify_App_Development_Guide.md`
- **API Reference**: `Sendly_API_Documentation.md`
- **Postman Collection**: `Shopify_App_Development.postman_collection.json`
- **Environment**: `Shopify_App_Development.postman_environment.json`

## 🎯 Next Steps

1. **Configure your store domain** in environment variables
2. **Test all endpoints** using Postman collection
3. **Implement frontend components** following the guide
4. **Deploy to production** when ready
5. **Monitor performance** and user feedback

Happy coding! 🚀
