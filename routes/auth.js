import express from 'express';
import crypto from 'crypto';
import '@shopify/shopify-api/adapters/node'; // Node.js runtime adapter
import {
  verifyShopifySessionToken,
  generateAppToken,
  verifyAppToken,
} from '../services/auth.js';
import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';
import { sendSuccess } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';

const r = express.Router();

/**
 * POST /auth/shopify-token
 * Exchange Shopify App Bridge session token for app JWT token
 * Used by Shopify Extension
 */
r.post('/shopify-token', async (req, res, next) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      throw new ValidationError('Session token is required');
    }

    // Verify Shopify session token
    const shopifySession = await verifyShopifySessionToken(sessionToken);

    // Generate our app token
    const { token, store } = await generateAppToken(shopifySession.shop);

    logger.info('Shopify token exchanged for app token', {
      shopDomain: shopifySession.shop,
      storeId: store.id,
    });

    return sendSuccess(res, {
      token,
      store,
      expiresIn: '30d',
    }, 'Token generated successfully');
  } catch (error) {
    logger.error('Token exchange error', {
      error: error.message,
    });
    next(error);
  }
});

/**
 * GET /auth/shopify?shop=<domain>
 * Initiate Shopify OAuth flow
 * Used by Web App
 */
r.get('/shopify', async (req, res, next) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop parameter is required',
        message: 'Please provide shop domain as query parameter',
      });
    }

    // Normalize shop domain
    const shopDomain = shop.includes('.myshopify.com')
      ? shop
      : `${shop}.myshopify.com`;

    const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, HOST } = process.env;

    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Shopify API credentials not configured',
        message: 'SHOPIFY_API_KEY and SHOPIFY_API_SECRET must be set',
      });
    }

    // Build callback URL
    const hostName = HOST?.replace(/^https?:\/\//, '').split('/')[0] || 'sendly-marketing-backend.onrender.com';
    const protocol = HOST?.startsWith('https') ? 'https' : 'http';
    const callbackUrl = `${protocol}://${hostName}/auth/callback`;

    // Build scopes
    const scopes = (process.env.SCOPES || 'read_products,read_customers,read_orders,write_discounts').split(',').join(',');

    // Generate state for security (optional but recommended)
    const state = crypto.randomBytes(16).toString('hex');

    // Build Shopify OAuth URL
    const encodedRedirectUri = encodeURIComponent(callbackUrl);
    const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_API_KEY}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodedRedirectUri}&` +
      `state=${state}`;

    logger.info('OAuth flow initiated', {
      shopDomain,
      callbackUrl,
      encodedRedirectUri,
      hostName,
      protocol,
      HOST: process.env.HOST,
      message: `⚠️ IMPORTANT: Add this exact URL to Shopify Partners Dashboard: ${callbackUrl}`,
    });

    // Redirect to Shopify OAuth page
    res.redirect(authUrl);
  } catch (error) {
    logger.error('OAuth initiation error', {
      error: error.message,
      shop: req.query.shop,
    });
    next(error);
  }
});

/**
 * GET /auth/callback
 * Handle Shopify OAuth callback
 * Exchange authorization code for access token
 */
r.get('/callback', async (req, res, _next) => {
  try {
    const { code, shop, hmac: hmacParam } = req.query;

    if (!code || !shop) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Code and shop parameters are required',
      });
    }

    const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET } = process.env;

    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Shopify API credentials not configured',
      });
    }

    // Verify HMAC (security check)
    // eslint-disable-next-line no-unused-vars
    const { hmac: _hmac, ...params } = req.query;
    const queryString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const calculatedHmac = crypto
      .createHmac('sha256', SHOPIFY_API_SECRET)
      .update(queryString)
      .digest('hex');

    if (calculatedHmac !== hmacParam) {
      logger.warn('Invalid HMAC in OAuth callback', { shop });
      return res.status(401).json({
        success: false,
        error: 'Invalid request',
        message: 'HMAC verification failed',
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Failed to exchange OAuth code', {
        status: tokenResponse.status,
        error: errorText,
      });
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const shopDomain = shop;

    logger.info('OAuth callback received', {
      shopDomain,
      hasAccessToken: !!accessToken,
    });

    // Find or create store
    let store = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!store) {
      // Create new store
      store = await prisma.shop.create({
        data: {
          shopDomain,
          shopName: shopDomain.replace('.myshopify.com', ''),
          accessToken,
          credits: 100, // Initial credits
          currency: 'EUR',
          status: 'active',
          settings: {
            create: {
              currency: 'EUR',
              timezone: 'Europe/Athens',
              senderNumber: process.env.MITTO_SENDER_NAME || 'Sendly',
              senderName: process.env.MITTO_SENDER_NAME || 'Sendly',
            },
          },
        },
        include: { settings: true },
      });

      logger.info('New store created from OAuth', {
        storeId: store.id,
        shopDomain: store.shopDomain,
      });
    } else {
      // Update access token
      store = await prisma.shop.update({
        where: { id: store.id },
        data: { accessToken },
        include: { settings: true },
      });

      logger.info('Store access token updated', {
        storeId: store.id,
        shopDomain: store.shopDomain,
      });
    }

    // Generate App JWT token
    const { token } = await generateAppToken(store.shopDomain);

    logger.info('OAuth flow completed', {
      shopDomain: store.shopDomain,
      storeId: store.id,
    });

    // Redirect to web app with token
    const webAppUrl = process.env.WEB_APP_URL || 'https://sendly-marketing-frontend.onrender.com';
    const redirectUrl = `${webAppUrl}/auth/callback?token=${token}`;

    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('OAuth callback error', {
      error: error.message,
      shop: req.query.shop,
    });

    // Redirect to web app with error
    const webAppUrl = process.env.WEB_APP_URL || 'https://sendly-marketing-frontend.onrender.com';
    res.redirect(`${webAppUrl}/login?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /auth/verify
 * Verify app JWT token validity
 */
r.get('/verify', async (req, res, _next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
        message: 'Please provide Bearer token in Authorization header',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyAppToken(token);

    // Get store info
    const store = await prisma.shop.findUnique({
      where: { id: decoded.storeId },
      include: { settings: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
        message: 'The store associated with this token no longer exists',
      });
    }

    return sendSuccess(res, {
      valid: true,
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        credits: store.credits,
        currency: store.settings?.currency || 'EUR',
      },
      token: {
        storeId: decoded.storeId,
        source: decoded.source,
        exp: decoded.exp,
      },
    });
  } catch (error) {
    logger.error('Token verification error', {
      error: error.message,
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: error.message,
    });
  }
});


/**
 * POST /auth/refresh
 * Refresh app JWT token (optional - for future use)
 */
r.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify existing token (even if expired)
    let decoded;
    try {
      decoded = verifyAppToken(token);
    } catch (error) {
      // If token is expired, we can still decode it to get storeId
      if (error.message === 'Token expired') {
        const jwt = await import('jsonwebtoken');
        decoded = jwt.decode(token);
      } else {
        throw error;
      }
    }

    if (!decoded || !decoded.storeId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Get store
    const store = await prisma.shop.findUnique({
      where: { id: decoded.storeId },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    // Generate new token
    const { token: newToken } = await generateAppToken(store.shopDomain);

    logger.info('Token refreshed', {
      storeId: store.id,
      shopDomain: store.shopDomain,
    });

    return sendSuccess(res, {
      token: newToken,
      expiresIn: '30d',
    }, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Token refresh error', {
      error: error.message,
    });
    next(error);
  }
});

export default r;

