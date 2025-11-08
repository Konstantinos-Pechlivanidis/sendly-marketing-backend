import { shopifyApi } from '@shopify/shopify-api';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { sessionStorage, getSessionByShop, needsRefresh, cleanupExpiredSessions } from './shopify-session.js';

dotenv.config();

let shopifyContext = null;
let initialized = false;

/**
 * Initialize Shopify API context with proper session storage
 */
export function initShopifyContext() {
  if (initialized) return shopifyContext;

  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST } = process.env;

  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !HOST) {
    logger.warn('[Shopify] Missing envs. Check SHOPIFY_API_KEY/SECRET/HOST');
  }

  try {
    shopifyContext = shopifyApi({
      apiKey: SHOPIFY_API_KEY,
      apiSecretKey: SHOPIFY_API_SECRET,
      scopes: SCOPES?.split(',') || [],
      hostName: HOST,
      apiVersion: '2024-04',
      isEmbeddedApp: true,
      sessionStorage, // Use database-based session storage
    });

    // Cleanup expired sessions periodically (every hour)
    setInterval(async () => {
      await cleanupExpiredSessions();
    }, 60 * 60 * 1000);

    // Initial cleanup
    cleanupExpiredSessions().catch(err => {
      logger.error('Error during initial session cleanup', { error: err.message });
    });

    logger.info('Shopify API initialized with database session storage');
    initialized = true;
  } catch (error) {
    logger.error('Failed to initialize Shopify context', {
      error: error.message,
    });
    throw error;
  }

  return shopifyContext;
}

/**
 * Get diagnostics
 */
export function diagnostics() {
  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST } = process.env;
  return {
    hasApiKey: !!SHOPIFY_API_KEY,
    hasApiSecret: !!SHOPIFY_API_SECRET,
    hasHost: !!HOST,
    scopesCount: (SCOPES || '').split(',').filter(Boolean).length,
    embedded: true,
    apiVersion: '2024-04',
    sessionStorage: 'database',
    initialized,
  };
}

/**
 * Get Shopify session for a shop
 * Uses database session storage with automatic refresh
 */
export async function getShopifySession(shopDomain, isOnline = false) {
  try {
    // Get session from database
    const session = await getSessionByShop(shopDomain, isOnline);

    if (!session) {
      logger.warn('Shopify session not found', {
        shopDomain,
        isOnline,
      });
      return null;
    }

    // Check if session needs refresh
    if (await needsRefresh(session.id)) {
      logger.info('Shopify session needs refresh', {
        sessionId: session.id,
        shopDomain,
      });

      // Try to refresh session (this would need OAuth flow)
      // For now, return existing session
      // In production, implement OAuth refresh flow
    }

    return session;
  } catch (error) {
    logger.error('Failed to get Shopify session', {
      shopDomain,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get authenticated GraphQL client for a shop
 */
export async function getGraphQLClient(shopDomain, isOnline = false) {
  try {
    const session = await getShopifySession(shopDomain, isOnline);

    if (!session) {
      throw new Error(`No session found for shop: ${shopDomain}`);
    }

    if (!shopifyContext) {
      initShopifyContext();
    }

    return new shopifyContext.clients.Graphql({ session });
  } catch (error) {
    logger.error('Failed to get GraphQL client', {
      shopDomain,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get authenticated REST client for a shop
 */
export async function getRestClient(shopDomain, isOnline = false) {
  try {
    const session = await getShopifySession(shopDomain, isOnline);

    if (!session) {
      throw new Error(`No session found for shop: ${shopDomain}`);
    }

    if (!shopifyContext) {
      initShopifyContext();
    }

    return new shopifyContext.clients.Rest({ session });
  } catch (error) {
    logger.error('Failed to get REST client', {
      shopDomain,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get discount codes for a shop (enhanced with proper session)
 */
export async function getDiscountCodes(shopDomain) {
  try {
    const client = await getGraphQLClient(shopDomain);

    const query = `
      query getDiscountCodes($first: Int!) {
        codeDiscountNodes(first: $first) {
          edges {
            node {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                  status
                  startsAt
                  endsAt
                  usageLimit
                  customerGets {
                    ... on DiscountPercentage {
                      percentage
                    }
                    ... on DiscountAmount {
                      amount {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
                ... on DiscountCodeBxgy {
                  title
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                  status
                  startsAt
                  endsAt
                  usageLimit
                }
                ... on DiscountCodeFreeShipping {
                  title
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                  status
                  startsAt
                  endsAt
                  usageLimit
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query,
        variables: { first: 50 },
      },
    });

    const discountCodes = response.body.data.codeDiscountNodes.edges.map(edge => {
      const node = edge.node;
      const discount = node.codeDiscount;

      return {
        id: node.id,
        title: discount.title,
        code: discount.codes.edges[0]?.node.code || 'N/A',
        status: discount.status,
        startsAt: discount.startsAt,
        endsAt: discount.endsAt,
        usageLimit: discount.usageLimit,
        type: discount.__typename,
        isActive: discount.status === 'ACTIVE',
        isExpired: discount.endsAt ? new Date(discount.endsAt) < new Date() : false,
      };
    });

    logger.info('Discount codes retrieved', {
      shopDomain,
      count: discountCodes.length,
    });

    return discountCodes;
  } catch (error) {
    logger.error('Failed to get discount codes', {
      shopDomain,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get a specific discount code by ID
 */
export async function getDiscountCode(shopDomain, discountId) {
  try {
    const client = await getGraphQLClient(shopDomain);

    const query = `
      query getDiscountCode($id: ID!) {
        codeDiscountNode(id: $id) {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
              status
              startsAt
              endsAt
              usageLimit
              customerGets {
                ... on DiscountPercentage {
                  percentage
                }
                ... on DiscountAmount {
                  amount {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query,
        variables: { id: discountId },
      },
    });

    const node = response.body.data.codeDiscountNode;
    if (!node) {
      throw new Error('Discount code not found');
    }

    const discount = node.codeDiscount;
    return {
      id: node.id,
      title: discount.title,
      code: discount.codes.edges[0]?.node.code || 'N/A',
      status: discount.status,
      startsAt: discount.startsAt,
      endsAt: discount.endsAt,
      usageLimit: discount.usageLimit,
      isActive: discount.status === 'ACTIVE',
    };
  } catch (error) {
    logger.error('Failed to get discount code', {
      shopDomain,
      discountId,
      error: error.message,
    });
    throw error;
  }
}

export default {
  initShopifyContext,
  diagnostics,
  getShopifySession,
  getGraphQLClient,
  getRestClient,
  getDiscountCodes,
  getDiscountCode,
};

