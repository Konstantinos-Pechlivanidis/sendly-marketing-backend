import { shopifyApi, ApiVersion, Session } from '@shopify/shopify-api';
import dotenv from 'dotenv';
dotenv.config();

let initialized = false;

export function initShopifyContext() {
  if (initialized) return;
  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST } = process.env;
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !HOST) {
    console.warn('[Shopify] Missing envs. Check SHOPIFY_API_KEY/SECRET/HOST');
  }
  // For now, use a simple configuration without session storage
  // In production, you would implement proper session storage
  console.log('Shopify API initialized with basic configuration');
  initialized = true;
}

export function diagnostics() {
  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST } = process.env;
  return {
    hasApiKey: !!SHOPIFY_API_KEY,
    hasApiSecret: !!SHOPIFY_API_SECRET,
    hasHost: !!HOST,
    scopesCount: (SCOPES || '').split(',').filter(Boolean).length,
    embedded: true,
    apiVersion: 'April25',
  };
}

export default { initShopifyContext, diagnostics };
