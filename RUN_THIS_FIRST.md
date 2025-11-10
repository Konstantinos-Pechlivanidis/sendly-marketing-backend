# 🚀 Run This First!

## Step-by-Step Setup (Copy & Paste)

### Step 1: Update .env File

Open your `.env` file and add these lines:

```env
# Redis Cloud Configuration (CRITICAL!)
REDIS_HOST=redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=16617
REDIS_USERNAME=default
REDIS_PASSWORD=qFb53Dp7xLU0u7V681eMQwdTdnsbISx8
REDIS_TLS=true
REDIS_DB=0
```

**⚠️ IMPORTANT:** Make sure `REDIS_TLS=true` is set!

---

### Step 2: Test Redis Connection

```bash
npm run test:redis
```

**✅ Expected Output:**
```
🔧 Testing Redis Connection...

Configuration:
- Host: redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com
- Port: 16617
- Username: default
- Password: ***ISx8
- TLS: true

📡 Connecting to Redis...
✅ Redis connection ready!

📍 Test 1: Ping
✅ Ping response: PONG

📍 Test 2: Set key
✅ Key set successfully

📍 Test 3: Get key
✅ Key retrieved: success

📍 Test 4: Delete key
✅ Key deleted successfully

📍 Test 5: Server info
✅ Redis version: 7.2.4

✅ All tests passed!

✨ Redis connection is working correctly
🔌 Redis connection closed
```

**❌ If you see errors:**
1. Double-check `REDIS_TLS=true` in `.env`
2. Verify all Redis credentials are correct
3. See [REDIS_SETUP.md](./REDIS_SETUP.md) for troubleshooting

---

### Step 3: Start Application

```bash
npm run dev
```

**✅ Expected Output:**
```
[INFO] Starting Sendly Backend API
[INFO] Redis Queue connected
[INFO] Redis Cache ready
[INFO] Redis cache initialized
[INFO] Server running on port 3000
```

**❌ If you see "Command timed out":**
- Stop the server (Ctrl+C)
- Verify `.env` has `REDIS_TLS=true`
- Run `npm run test:redis` again

---

### Step 4: Test Health Endpoint

**In a new terminal:**

```bash
curl http://localhost:3000/health
```

**✅ Expected Response:**
```json
{"status":"ok"}
```

---

### Step 5: Test Full Health Check

```bash
curl http://localhost:3000/health/full
```

**✅ Expected Response (partial):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T...",
  "services": {
    "database": {
      "status": "healthy"
    },
    "redis": {
      "status": "healthy",
      "latency": "15ms"
    }
  }
}
```

**Look for:** `"redis": { "status": "healthy" }`

---

### Step 6: Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `Sendly_Backend_API.postman_collection.json`
4. Click **Import** again
5. Select `Sendly_Dev_Store.postman_environment.json`
6. Select "Sendly Dev Store" from environment dropdown
7. Click eye icon → Find `shopify_access_token`
8. Update with your full Shopify access token
9. Click **Save**

---

### Step 7: Test First API Request

In Postman:

1. Select "Sendly Dev Store" environment
2. Open "🔧 Core" folder
3. Click "Health Check"
4. Click **Send**

**✅ Expected Response:**
```json
{
  "status": "ok"
}
```

---

## 🎉 You're Done!

### What Works Now:
- ✅ Redis connection (no more timeouts!)
- ✅ Application running
- ✅ All endpoints accessible
- ✅ Postman ready for testing

### Next Steps:

1. **Create a Contact:**
   - Postman → "👥 Contacts" → "Create Contact"
   - Update phone number
   - Click **Send**

2. **Create a Campaign:**
   - Postman → "📢 Campaigns" → "Create Campaign"
   - Customize message
   - Click **Send**

3. **Check Dashboard:**
   - Postman → "🏠 Dashboard" → "Get Dashboard Overview"
   - Click **Send**

---

## 📚 Need Help?

| Issue | See Document |
|-------|--------------|
| Redis errors | [REDIS_SETUP.md](./REDIS_SETUP.md) |
| Environment setup | [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) |
| Postman questions | [POSTMAN_SETUP.md](./POSTMAN_SETUP.md) |
| Quick reference | [QUICK_START.md](./QUICK_START.md) |
| Complete overview | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |

---

## 🚨 Common Issues

### "Command timed out"
```env
# Add this to .env:
REDIS_TLS=true
```

### "NOAUTH Authentication required"
```env
# Add this to .env:
REDIS_USERNAME=default
REDIS_PASSWORD=qFb53Dp7xLU0u7V681eMQwdTdnsbISx8
```

### Postman "Store not found"
- Verify `X-Shopify-Shop-Domain` header is set
- Check environment variable `shopDomain`

### Application won't start
```bash
# Check dependencies
npm install

# Regenerate Prisma client
npm run db:generate
```

---

## ✅ Quick Verification

Run all these commands to verify everything works:

```bash
# Test Redis
npm run test:redis

# Start app
npm run dev

# In another terminal:
curl http://localhost:3000/health
curl http://localhost:3000/health/full
```

All should return healthy status!

---

**Status:** 🎯 Ready to go!

**Documentation:** All 6 guides available in repository root

**Support:** Check documentation or run test scripts for diagnostics

