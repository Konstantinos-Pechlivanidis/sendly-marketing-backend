# 🚀 Render.com Deployment Guide

## 📋 Prerequisites

- GitHub repository with your code (see GITHUB_SETUP.md)
- Render.com account
- PostgreSQL database (provided by Render)
- Redis instance (provided by Render)

## 🚀 Step-by-Step Deployment

### 1. Prepare GitHub Repository

First, make sure your code is pushed to GitHub:

```bash
# Add remote origin (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/sendly-marketing-backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. Deploy to Render.com

1. **Go to [Render.com](https://render.com)**
2. **Sign in** with your GitHub account
3. **Click "New" → "Blueprint"**
4. **Select your repository**: `sendly-marketing-backend`
5. **Render will auto-detect the `render.yaml` file**

### 3. Configure Environment Variables

In the Render dashboard, set these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment |
| `DATABASE_URL` | *(auto-set by Render)* | PostgreSQL connection |
| `REDIS_URL` | *(auto-set by Render)* | Redis connection |
| `SHOPIFY_API_KEY` | `your_shopify_api_key` | Shopify API key |
| `SHOPIFY_API_SECRET` | `your_shopify_api_secret` | Shopify API secret |
| `MITTO_API_KEY` | `your_mitto_api_key` | Mitto SMS API key |
| `MITTO_WEBHOOK_SECRET` | `your_webhook_secret` | Webhook secret |
| `HOST` | `https://your-app-name.onrender.com` | Your app URL |
| `ALLOWED_ORIGINS` | `https://your-app-name.onrender.com` | CORS origins |
| `APP_DEFAULT_CURRENCY` | `EUR` | Default currency |

### 4. Build and Start Commands

**Build Command:**
```bash
npm ci && npx prisma generate && npx prisma migrate deploy
```

**Start Command:**
```bash
npm start
```

### 5. Deploy

1. **Click "Apply"** to deploy
2. **Monitor the deployment** in the logs
3. **Wait for deployment** to complete (usually 2-5 minutes)

## 🔍 Post-Deployment Verification

### 1. Health Check
Visit your app URL + `/health`:
```
https://your-app-name.onrender.com/health
```

Expected response:
```json
{
  "ok": true,
  "t": 1703123456789
}
```

### 2. Full Health Check
Visit your app URL + `/health/full`:
```
https://your-app-name.onrender.com/health/full
```

This will show comprehensive system health including:
- Database connection
- Redis connection
- Queue health
- External API health

### 3. Metrics Endpoint
Visit your app URL + `/metrics`:
```
https://your-app-name.onrender.com/metrics
```

## 🛠️ Render.com Configuration Details

### Build Process
1. **Install Dependencies**: `npm ci` (production dependencies only)
2. **Generate Prisma Client**: `npx prisma generate`
3. **Run Database Migrations**: `npx prisma migrate deploy`
4. **Start Application**: `npm start`

### Environment Variables
- **Database**: Auto-configured by Render
- **Redis**: Auto-configured by Render
- **Custom Variables**: Set in Render dashboard

### Health Checks
- **Path**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds

## 📊 Monitoring Your Deployment

### 1. Render Dashboard
- **Logs**: View real-time application logs
- **Metrics**: CPU, memory, and request metrics
- **Health**: Service health status

### 2. Application Health Endpoints
- `/health` - Basic health status
- `/health/config` - Configuration health
- `/health/full` - Comprehensive health check
- `/metrics` - Application metrics

### 3. Key Metrics to Monitor
- **Response Time**: Should be < 2 seconds
- **Error Rate**: Should be < 5%
- **Database Health**: Connection status
- **Redis Health**: Cache and queue status

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check if all dependencies are in `package.json`
   - Verify Node.js version (18+)
   - Check build logs for specific errors

2. **Database Connection Fails**
   - Verify `DATABASE_URL` is set correctly
   - Check if database is accessible
   - Run `npx prisma migrate deploy` manually

3. **Redis Connection Fails**
   - Verify `REDIS_URL` is set correctly
   - Check if Redis instance is running
   - Test connection with `redis-cli`

4. **Application Won't Start**
   - Check if `PORT` environment variable is set
   - Verify all required environment variables
   - Check application logs for errors

### Debug Commands

```bash
# Check application health
curl https://your-app-name.onrender.com/health/full

# Check database connection
npx prisma migrate status

# Check Redis connection
redis-cli -u $REDIS_URL ping
```

## 🔄 Updates and Maintenance

### Updating Your Application
1. **Make changes** to your code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push origin main
   ```
3. **Render will auto-deploy** the changes

### Database Migrations
If you make schema changes:
1. **Update Prisma schema**
2. **Create migration**: `npx prisma migrate dev`
3. **Commit and push** changes
4. **Render will run migrations** automatically

## 📈 Performance Optimization

### 1. Database Optimization
- Use connection pooling (already configured)
- Monitor query performance
- Add indexes as needed

### 2. Redis Optimization
- Monitor cache hit rates
- Optimize queue configurations
- Set appropriate TTL values

### 3. Application Optimization
- Monitor memory usage
- Optimize API endpoints
- Use compression (already enabled)

## 🎯 Success Metrics

After successful deployment, you should see:

- ✅ **Health Check**: `/health` returns `{"ok": true}`
- ✅ **Database**: Connected and migrations applied
- ✅ **Redis**: Connected and queues working
- ✅ **API**: All endpoints responding correctly
- ✅ **Monitoring**: Metrics and logs available

## 📞 Support

If you encounter issues:

1. **Check Render logs** for error messages
2. **Verify environment variables** are set correctly
3. **Test health endpoints** to identify issues
4. **Check database and Redis** connections
5. **Review application logs** for specific errors

---

## 🎉 Congratulations!

Your SMS Blossom backend is now deployed and production-ready! 

**Your app URL**: `https://your-app-name.onrender.com`
**Health Check**: `https://your-app-name.onrender.com/health/full`
**Metrics**: `https://your-app-name.onrender.com/metrics`
