# Shopify Access Token Setup Guide

## 🔑 Problem: "Shopify access token not available"

If you see this error:
```json
{
  "error": "app_error",
  "message": "Shopify access token not available for store: sms-blossom-dev.myshopify.com. Please complete the app installation."
}
```

This means the Shopify access token is not in the database yet.

## ✅ Solution: Add Access Token to Database

### Step 1: Get Full Access Token

1. Open your Shopify admin frontend
2. Find the **Debug Information** section
3. Copy the **full access token** (starts with `shpat_`, ~50+ characters)
4. **Important:** Copy the FULL token, not just the preview!

Example:
```
shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Add to Environment Variables

Open your `.env` file and add:

```env
# Shopify Configuration
SHOPIFY_SHOP_DOMAIN=sms-blossom-dev.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_full_access_token_here
```

**Replace** `shpat_your_full_access_token_here` with your actual token!

### Step 3: Run Setup Script

```bash
npm run setup:shop
```

**Expected Output:**
```
🔍 Checking if shop exists...
Shop Domain: sms-blossom-dev.myshopify.com
📝 Shop found. Updating access token...
✅ Access token updated successfully!

📊 Shop Details:
- ID: cmhrigaa300080arcrw5r4fia
- Domain: sms-blossom-dev.myshopify.com
- Access Token: shpat_87fa...ISx8
- Credits: 100
- Active: true

✨ Done! You can now use the Shopify API endpoints.
```

### Step 4: Test Shopify Integration

```bash
curl http://localhost:3000/discounts \
  -H "X-Shopify-Shop-Domain: sms-blossom-dev.myshopify.com"
```

Should return list of discount codes!

## 🧪 Testing in Postman

After setup, test these endpoints:

1. **Get Discounts:**
   - Endpoint: `GET /discounts`
   - Should return discount codes from Shopify

2. **Get Shopify Discounts:**
   - Endpoint: `GET /shopify/discounts`
   - Should return discount codes

3. **Create Campaign with Discount:**
   - Endpoint: `POST /campaigns`
   - Include `discountId` in body (optional)

## 🚨 Common Issues

### Issue 1: "Invalid access token"

**Symptoms:**
```
❌ ERROR: Invalid access token
Access token must be the full token from Debug Information
```

**Solution:**
- Make sure you copied the FULL token
- Token should be ~50+ characters
- Token should start with `shpat_`

### Issue 2: "SHOPIFY_ACCESS_TOKEN not found"

**Symptoms:**
```
❌ ERROR: SHOPIFY_ACCESS_TOKEN not found in environment variables
```

**Solution:**
1. Open `.env` file
2. Add: `SHOPIFY_ACCESS_TOKEN=shpat_your_token_here`
3. Save file
4. Run `npm run setup:shop` again

### Issue 3: "Shop not found"

**Symptoms:**
```
Store not found for domain: sms-blossom-dev.myshopify.com
```

**Solution:**
The setup script will automatically create the shop record!
Just run `npm run setup:shop`

### Issue 4: Still getting "access token not available" after setup

**Solution:**
1. Check database was updated:
   ```bash
   npx prisma studio
   ```
2. Open `Shop` table
3. Verify `accessToken` field is filled (not "pending")
4. If still "pending", run setup script again

## 📝 Manual Database Update (Alternative)

If the script doesn't work, update manually:

```sql
-- Using Prisma Studio
1. Run: npx prisma studio
2. Open "Shop" table
3. Find your shop (sms-blossom-dev.myshopify.com)
4. Edit "accessToken" field
5. Paste your full access token
6. Save
```

## 🔐 Security Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Rotate tokens regularly** - Change access token every 3-6 months
3. **Use different tokens per environment**:
   - Development: Dev store token
   - Production: Production store token
4. **Monitor token usage** - Check Shopify API logs

## 📊 What This Token Is Used For

The Shopify access token is used to:

1. **Fetch Discount Codes** - For campaigns
2. **Read Customer Data** - For contact sync (if enabled)
3. **Read Orders** - For order-based automations
4. **Verify Store** - For authentication

**Scopes Required:**
```
read_customers,write_customers,read_orders,read_discounts,write_discounts
```

Check `SCOPES` in `.env` file.

## ✅ Verification Checklist

- [ ] Copied full access token from Debug Information
- [ ] Added `SHOPIFY_ACCESS_TOKEN` to `.env`
- [ ] Added `SHOPIFY_SHOP_DOMAIN` to `.env`
- [ ] Ran `npm run setup:shop` successfully
- [ ] Tested `/discounts` endpoint
- [ ] No "access token not available" errors

## 🔗 Related Documentation

- [POSTMAN_SETUP.md](./POSTMAN_SETUP.md) - API testing
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - All env variables
- [QUICK_START.md](./QUICK_START.md) - Quick reference

---

**Status:** ✅ Once configured, the token is stored in database and persists across restarts

**Note:** If you change stores, run `npm run setup:shop` again with the new store's token

