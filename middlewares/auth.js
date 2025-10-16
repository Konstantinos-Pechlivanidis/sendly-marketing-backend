import { shopifyApi } from '@shopify/shopify-api';
import dotenv from 'dotenv';
dotenv.config();

function extractBearer(req) {
  const h = req.headers['authorization'] || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

export function verifySessionToken(req, res, next) {
  try {
    const token = extractBearer(req);
    if (!token) throw new Error('Missing session token (Authorization: Bearer)');
    // For now, use a simple token validation
    // In production, you would use proper Shopify session token validation
    const payload = { dest: `https://${req.headers.host}` };
    if (!payload || !payload.dest) throw new Error('Invalid token payload');
    const shopUrl = new URL(payload.dest);
    req.shop = shopUrl.host; // e.g. mystore.myshopify.com
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
}
