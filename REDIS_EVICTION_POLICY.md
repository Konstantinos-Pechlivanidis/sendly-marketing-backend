# Redis Eviction Policy Warning

## The Warning

You're seeing:
```
IMPORTANT! Eviction policy is volatile-lru. It should be "noeviction"
```

## What This Means

**Eviction Policy** controls what Redis does when it runs out of memory:

- **`volatile-lru`** (current): Evicts least recently used keys that have expiration times
- **`noeviction`** (recommended for queues): Never evicts keys, returns errors when memory is full

## Is This a Problem?

### For Caching ✅ **OK**
- `volatile-lru` is **acceptable** for cache
- Cache entries have TTL and can be safely evicted
- Your cache will continue working normally

### For Queues ⚠️ **Should Change**
- `noeviction` is **recommended** for queues (BullMQ)
- Prevents automatic deletion of queue jobs
- Without it, jobs might be lost if Redis runs out of memory

## How to Fix (Redis Cloud)

### Option 1: Change in Redis Cloud Dashboard

1. **Log in to Redis Cloud**
2. **Go to your database settings**
3. **Find "Memory Management" or "Eviction Policy"**
4. **Change to `noeviction`**
5. **Save and restart** (if needed)

### Option 2: Use Redis CLI

If you have Redis CLI access:
```bash
CONFIG SET maxmemory-policy noeviction
```

### Option 3: Keep Current (Acceptable)

If you're only using Redis for caching (not queues), `volatile-lru` is fine. The app will:
- ✅ Continue working normally
- ✅ Use database queue fallback for queues
- ⚠️ Show the warning (harmless)

## Current Setup

Your app has **fallback mechanisms**:
- ✅ **Queues**: Falls back to database if Redis is unavailable
- ✅ **Cache**: Uses memory cache if Redis is unavailable
- ✅ **Graceful degradation**: App continues working

## Recommendation

**For production with queues**: Change to `noeviction` in Redis Cloud settings.

**For development/caching only**: Current setting is acceptable.

## Verification

After changing the policy, restart your server and check logs:
- Should see: `Redis Queue ready` (no warnings)
- Should see: `Redis Cache ready`

The warning will disappear once the policy is set to `noeviction`.

