# Redis Configuration Guide

## Current Setup

Your application uses **IORedis** (not the `redis` package). The connection is configured in `config/redis.js`.

## Redis Connection Options

You have **two options** to configure Redis:

### Option 1: Using REDIS_URL (Recommended)

Use a single Redis URL string in your `.env` file:

```env
REDIS_URL=redis://default:qFb53Dp7xLU0u7V681eMQwdTdnsbISx8@redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617
```

**Format**: `redis://username:password@host:port`

**For your Redis Cloud setup**:
```env
REDIS_URL=redis://default:qFb53Dp7xLU0u7V681eMQwdTdnsbISx8@redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617
```

### Option 2: Using Individual Environment Variables

Alternatively, you can use separate environment variables:

```env
REDIS_HOST=redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=16617
REDIS_USERNAME=default
REDIS_PASSWORD=qFb53Dp7xLU0u7V681eMQwdTdnsbISx8
```

## What to Add to .env

**Recommended (URL format)**:
```env
REDIS_URL=redis://default:qFb53Dp7xLU0u7V681eMQwdTdnsbISx8@redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617
```

## Connection Verification

The app is correctly configured to use IORedis. The connection will:
- ✅ Automatically handle authentication
- ✅ Support lazy connection (connects when needed)
- ✅ Fall back to memory cache if Redis is unavailable
- ✅ Retry on connection failures

## Differences from Your Example

Your example uses the `redis` package:
```javascript
import { createClient } from 'redis';
const client = createClient({ username: '...', password: '...', socket: {...} });
```

But the app uses **IORedis**:
```javascript
import IORedis from 'ioredis';
const redis = new IORedis(REDIS_URL);
```

IORedis supports the URL format directly, so you just need to provide the `REDIS_URL` in the format shown above.

## Testing Connection

After updating your `.env` file, restart the server and check the logs. You should see:
- `Redis Queue connected`
- `Redis Cache connected`
- `Redis Session connected`

If you see errors, the app will automatically fall back to memory cache (which is fine for development).

