# Update Redis URL - Quick Fix

## The Problem

You're still seeing this error:
```
Error: getaddrinfo ENOTFOUND fast-ringtail-24749.upstash.io
```

This means your `.env` file still has the old Upstash Redis URL.

## Solution

**Open your `.env` file and update the `REDIS_URL` line:**

### Find this line (or similar):
```env
REDIS_URL=redis://fast-ringtail-24749.upstash.io:6379
# or
REDIS_URL=redis://default:password@fast-ringtail-24749.upstash.io:6379
```

### Replace it with:
```env
REDIS_URL=redis://default:qFb53Dp7xLU0u7V681eMQwdTdnsbISx8@redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617
```

## Complete Steps

1. **Open `.env` file** in your project root
2. **Find the line** with `REDIS_URL=`
3. **Replace the entire line** with:
   ```env
   REDIS_URL=redis://default:qFb53Dp7xLU0u7V681eMQwdTdnsbISx8@redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617
   ```
4. **Save the file**
5. **Restart your server** (stop and start again)

## After Restart

You should see in the logs:
- ✅ `Redis Queue connected`
- ✅ `Redis Cache connected`
- ✅ `Redis Session connected`

Instead of:
- ❌ `ENOTFOUND fast-ringtail-24749.upstash.io`

## If You Don't Have REDIS_URL in .env

If there's no `REDIS_URL` line, **add it**:
```env
REDIS_URL=redis://default:qFb53Dp7xLU0u7V681eMQwdTdnsbISx8@redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617
```

## Alternative: Use Individual Variables

If the URL format doesn't work, you can use:
```env
REDIS_HOST=redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=16617
REDIS_USERNAME=default
REDIS_PASSWORD=qFb53Dp7xLU0u7V681eMQwdTdnsbISx8
```

But remove or comment out the old `REDIS_URL` line if you use this method.

