# Redis Cloud Setup Guide

Complete guide for configuring Redis Cloud connection with ioredis.

## 🔑 Redis Cloud Credentials

From your Redis Cloud dashboard, you'll need:

- **Host**: `redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com`
- **Port**: `16617`
- **Username**: `default`
- **Password**: `qFb53Dp7xLU0u7V681eMQwdTdnsbISx8`

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# Redis Cloud Configuration
REDIS_HOST=redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=16617
REDIS_USERNAME=default
REDIS_PASSWORD=qFb53Dp7xLU0u7V681eMQwdTdnsbISx8
REDIS_TLS=true
REDIS_DB=0
```

### Important Notes

1. **TLS Required**: Redis Cloud requires `REDIS_TLS=true`
2. **Username**: Default is `default` (not empty string)
3. **Password**: Use your actual Redis Cloud password
4. **Port**: Redis Cloud uses custom ports (not default 6379)

## 🧪 Testing Connection

### Quick Test

```bash
node scripts/test-redis.js
```

This will:
- ✅ Verify connection
- ✅ Test basic operations (ping, set, get, del)
- ✅ Show Redis version
- ✅ Display helpful error messages

### Expected Output

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

## ⚙️ Configuration Details

### IORedis Configuration

The app uses `ioredis` with optimized settings for Redis Cloud:

```javascript
{
  host: 'redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com',
  port: 16617,
  username: 'default',
  password: 'qFb53Dp7xLU0u7V681eMQwdTdnsbISx8',
  tls: {}, // Required for Redis Cloud
  connectTimeout: 30000, // 30 seconds (cloud connections may be slower)
  commandTimeout: 10000, // 10 seconds
  keepAlive: 30000, // Keep connection alive
  retryStrategy: (times) => {
    if (times > 3) return null; // Stop after 3 retries
    return Math.min(times * 200, 2000); // Exponential backoff
  }
}
```

### Timeout Settings

- **connectTimeout**: `30000ms` (30s) - Time to establish connection
- **commandTimeout**: `10000ms` (10s) - Time to execute commands
- **keepAlive**: `30000ms` (30s) - Keep connection alive

These are **longer than default** because cloud connections have higher latency.

## 🚨 Common Issues & Solutions

### Issue 1: "Command timed out"

**Cause**: Missing TLS configuration or incorrect credentials

**Solution**:
```env
REDIS_TLS=true
```

### Issue 2: "Connection refused"

**Cause**: Incorrect host or port

**Solution**:
- Verify `REDIS_HOST` and `REDIS_PORT` from Redis Cloud dashboard
- Check if Redis Cloud instance is running

### Issue 3: "NOAUTH Authentication required"

**Cause**: Missing or incorrect password

**Solution**:
```env
REDIS_USERNAME=default
REDIS_PASSWORD=your_actual_password
```

### Issue 4: "Connection timeout"

**Cause**: Firewall blocking connection or instance not accessible

**Solution**:
1. Check Redis Cloud firewall settings
2. Whitelist your IP address in Redis Cloud dashboard
3. Verify instance is running

### Issue 5: "getaddrinfo ENOTFOUND"

**Cause**: DNS resolution failure or incorrect hostname

**Solution**:
- Double-check `REDIS_HOST` spelling
- Ensure you have internet connectivity
- Try pinging the host: `ping redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com`

## 🔍 Debugging

### Enable Debug Mode

Add to your `.env`:

```env
DEBUG=ioredis:*
```

Run your app:

```bash
node index.js
```

This will show detailed ioredis logs.

### Check Redis Cloud Dashboard

1. Go to Redis Cloud console
2. Check instance status (should be "Active")
3. Verify connection string matches your `.env`
4. Check metrics for connection attempts

### Manual Connection Test

Using `redis-cli`:

```bash
redis-cli -h redis-16617.c10.us-east-1-3.ec2.redns.redis-cloud.com \
  -p 16617 \
  -a qFb53Dp7xLU0u7V681eMQwdTdnsbISx8 \
  --tls \
  ping
```

Should return: `PONG`

## 📦 Package Comparison

### ioredis (Current)

✅ Better performance
✅ More features (clustering, pipelining)
✅ Better TypeScript support
✅ Active maintenance

### redis (Official)

- Simpler API
- Official Redis client
- Different configuration syntax

**We use ioredis** because it's more feature-rich and performant.

## 🔐 Security Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Rotate passwords** - Change Redis password periodically
3. **Use IP whitelist** - Restrict access in Redis Cloud dashboard
4. **TLS always** - Never disable TLS for production
5. **Environment variables** - Never hardcode credentials

## 📊 Production Checklist

- [ ] `REDIS_TLS=true` is set
- [ ] Correct host and port from Redis Cloud
- [ ] Valid username and password
- [ ] IP whitelisted in Redis Cloud
- [ ] Connection tested with `node scripts/test-redis.js`
- [ ] No credentials in code or git history
- [ ] Redis Cloud instance is in correct region (for latency)
- [ ] Timeout settings are appropriate
- [ ] Error handling is in place

## 🔗 Resources

- [Redis Cloud Documentation](https://docs.redis.com/latest/rc/)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Commands](https://redis.io/commands/)

---

**Need help?** Run `node scripts/test-redis.js` for detailed diagnostics.

