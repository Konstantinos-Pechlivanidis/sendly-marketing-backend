// Temporary fix for development testing
// This will hardcode the shop domain for testing

import fs from 'fs';
import path from 'path';

const authMiddlewarePath = './middlewares/auth.js';

const fixedAuthMiddleware = `import { shopifyApi } from '@shopify/shopify-api';
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
    
    // DEVELOPMENT FIX: Hardcode shop domain for testing
    // In production, you would validate the Shopify session token properly
    req.shop = 'sms-blossom-dev.myshopify.com';
    
    console.log('🔐 Auth middleware - Shop set to:', req.shop);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: err.message });
  }
}
`;

// Write the fixed middleware
fs.writeFileSync(authMiddlewarePath, fixedAuthMiddleware);
console.log('✅ Auth middleware fixed for development testing');
console.log('🔧 Shop domain hardcoded to: sms-blossom-dev.myshopify.com');
console.log('📝 This is a temporary fix for development only!');
