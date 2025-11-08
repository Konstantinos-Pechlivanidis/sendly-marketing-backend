# Quick Fix: Update Redis URL

## The Error You're Seeing

```
Error: getaddrinfo ENOTFOUND fast-ringtail-24749.upstash.io
```

This means your `.env` file still has the **old Upstash Redis URL**.

## Quick Solution

### Option 1: Manual Update (Recommended)

1. **Open your `.env` file** (in the project root directory)

2. **Find this line** (or similar):
   ```env
   REDIS_URL=redis://fast-ringtail-24749.upstash.io:6379
   ```
   or
   ```env
   REDIS_URL=redis://default:password@fast-ringtail-24749.upstash.io:6379
   ```

3. **Replace it with**:
   ```env
   REDIS_URL=redis://default:qFb53Dp7xLU0u7V681eMQwdTdnsbISx8@redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617
   ```

4. **Save the file**

5. **Restart your server** (stop and start again)

### Option 2: Use Script

I've created a helper script. Run:
```bash
node scripts/update-redis-url.js
```

Then restart your server.

## What Changed?

- **Old URL**: `fast-ringtail-24749.upstash.io` (Upstash - not working)
- **New URL**: `redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com:16617` (Redis Cloud - your new provider)

## After Restart

Check your logs. You should see:
- ✅ `Redis Queue connected`
- ✅ `Redis Cache connected`
- ✅ No more `ENOTFOUND` errors

## Still Seeing Errors?

1. **Double-check** the `.env` file was saved
2. **Verify** the server was restarted
3. **Check** the exact format - no extra spaces or quotes
4. **Make sure** you're editing the correct `.env` file (not `.env.example`)

