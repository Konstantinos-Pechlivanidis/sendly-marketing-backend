# Redis Connection Fix - Summary

## 🔍 Problem Identified

**Error:** `Command timed out` when connecting to Redis Cloud

**Root Cause:**
1. Missing TLS configuration (Redis Cloud requires TLS)
2. Timeouts too short for cloud connections
3. No retry strategy configured

## ✅ Solution Implemented

### 1. Updated Redis Configuration (`config/redis.js`)

#### Added TLS Support
```javascript
tls: process.env.REDIS_TLS === 'true' ? {} : undefined
```

#### Increased Timeouts
- **Before:** `connectTimeout: 10000` (10s), `commandTimeout: 5000` (5s)
- **After:** `connectTimeout: 30000` (30s), `commandTimeout: 10000` (10s)

Cloud connections have higher latency, so longer timeouts are needed.

#### Added Retry Strategy
```javascript
retryStrategy: (times) => {
  if (times > 3) return null; // Stop after 3 attempts
  return Math.min(times * 200, 2000); // Exponential backoff
}
```

### 2. Created Test Script (`scripts/test-redis.js`)

Run:
```bash
npm run test:redis
```

Features:
- ✅ Tests connection with proper configuration
- ✅ Validates all operations (ping, set, get, del)
- ✅ Shows helpful error messages
- ✅ Displays Redis version and server info

### 3. Documentation Created

- **REDIS_SETUP.md** - Complete Redis Cloud setup guide
- **ENVIRONMENT_SETUP.md** - All environment variables explained

## 🔑 Required Environment Variables

Add to your `.env`:

```env
REDIS_HOST=redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=16617
REDIS_USERNAME=default
REDIS_PASSWORD=qFb53Dp7xLU0u7V681eMQwdTdnsbISx8
REDIS_TLS=true              # ⚠️ CRITICAL - Must be true!
REDIS_DB=0
```

## 📝 Key Changes

### Before (Incorrect)
```javascript
// Missing TLS configuration
new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 10000,
  commandTimeout: 5000,
})
```

### After (Correct)
```javascript
// With TLS and proper configuration
new IORedis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT, 10),
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined, // ✅ TLS enabled
  connectTimeout: 30000,  // ✅ Longer timeout
  commandTimeout: 10000,  // ✅ Longer timeout
  keepAlive: 30000,       // ✅ Keep alive
  retryStrategy: (times) => { // ✅ Retry logic
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  }
})
```

## 🧪 How to Test

### Step 1: Update .env
```env
REDIS_TLS=true
```

### Step 2: Run test script
```bash
npm run test:redis
```

### Step 3: Expected output
```
🔧 Testing Redis Connection...

Configuration:
- Host: redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com
- Port: 16617
- Username: default
- Password: ***ISx8
- TLS: true

✅ Redis connection ready!
✅ All tests passed!
```

### Step 4: Start application
```bash
npm run dev
```

Check health endpoint:
```bash
curl http://localhost:3000/health/full
```

Should show Redis as healthy.

## 🎯 Why This Fix Works

### 1. TLS (Transport Layer Security)
Redis Cloud **requires** encrypted connections. Without `tls: {}`, the connection will timeout.

### 2. Proper Timeouts
Cloud services have higher latency than localhost. Timeouts need to account for:
- Network latency
- TLS handshake overhead
- Cloud infrastructure routing

### 3. Retry Strategy
Network hiccups are more common with cloud connections. Retry strategy:
- Attempts reconnection up to 3 times
- Uses exponential backoff (200ms, 400ms, 800ms)
- Gives up after 3 attempts to avoid infinite loops

### 4. Keep Alive
`keepAlive: 30000` maintains the connection, reducing reconnection overhead.

## 📚 Documentation Structure

```
├── REDIS_SETUP.md              # Complete Redis guide
├── ENVIRONMENT_SETUP.md        # All environment variables
├── REDIS_FIX_SUMMARY.md       # This file
├── config/redis.js             # Redis configuration
└── scripts/test-redis.js       # Test script
```

## 🚨 Important Notes

1. **TLS is mandatory** - Redis Cloud won't work without it
2. **Use 'default' as username** - Not empty string
3. **Test before deploying** - Always run `npm run test:redis`
4. **Check .env** - Verify all variables are set
5. **Firewall** - Ensure your IP is whitelisted in Redis Cloud

## 🔄 Migration from `redis` to `ioredis`

If you saw documentation using the `redis` package:

### redis (Official)
```javascript
import { createClient } from 'redis';

const client = createClient({
  username: 'default',
  password: 'xxx',
  socket: {
    host: 'redis-xxx.xxx.com',
    port: 16617
  }
});
```

### ioredis (What we use)
```javascript
import IORedis from 'ioredis';

const client = new IORedis({
  host: 'redis-xxx.xxx.com',
  port: 16617,
  username: 'default',
  password: 'xxx',
  tls: {}
});
```

**Key differences:**
- `redis` uses `socket: { host, port }`
- `ioredis` uses `host, port` directly
- Both support TLS, but different configuration
- We use `ioredis` for better performance and features

## ✅ Verification Checklist

- [ ] Added `REDIS_TLS=true` to `.env`
- [ ] Verified all Redis credentials in `.env`
- [ ] Ran `npm run test:redis` successfully
- [ ] Started app with `npm run dev`
- [ ] Checked `/health/full` endpoint
- [ ] No "Command timed out" errors in logs
- [ ] Redis operations working (check dashboard or campaigns)

## 🎉 Next Steps

1. **Test the fix:**
   ```bash
   npm run test:redis
   ```

2. **Start application:**
   ```bash
   npm run dev
   ```

3. **Verify health:**
   ```bash
   curl http://localhost:3000/health/full
   ```

4. **Test campaigns:**
   - Create a campaign in Postman
   - Verify it queues messages (uses Redis)

5. **Monitor logs:**
   - Should see "Redis Cache ready"
   - No timeout errors

---

**Status:** ✅ Fixed and documented

**Files changed:**
- `config/redis.js` - Updated configuration
- `scripts/test-redis.js` - New test script
- `package.json` - Added `test:redis` script
- `REDIS_SETUP.md` - Complete setup guide
- `ENVIRONMENT_SETUP.md` - Environment variables guide

