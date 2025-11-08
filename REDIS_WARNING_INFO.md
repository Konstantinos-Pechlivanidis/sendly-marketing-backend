# Redis Eviction Policy Warning - Info

## The Warning

You're seeing:
```
IMPORTANT! Eviction policy is volatile-lru. It should be "noeviction"
```

## What This Means

This warning comes from **IORedis/BullMQ** libraries detecting that your Redis server has `volatile-lru` eviction policy instead of `noeviction`.

## Is This a Problem?

**For your use case: Probably not**

- Your app has **database queue fallback** - if Redis has issues, queues fall back to database
- Cache uses TTL - eviction is acceptable for cache entries
- The warning is informational - your app will continue working

## How to Fix (If Needed)

If you want to remove the warning, you need to change the Redis server configuration:

1. **Redis Cloud Dashboard**:
   - Go to your database settings
   - Find "Memory Management" or "Eviction Policy"
   - Change from `volatile-lru` to `noeviction`
   - Save

2. **Or via Redis CLI**:
   ```bash
   CONFIG SET maxmemory-policy noeviction
   ```

## Current Status

The warning is **harmless** for your setup because:
- ✅ You have database queue fallback
- ✅ Cache eviction is acceptable
- ✅ App continues working normally

You can safely ignore this warning, or change the Redis server policy if you want to eliminate it.

