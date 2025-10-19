import { shopifyApi, Session } from '@shopify/shopify-api';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

let initialized = false;

export function initShopifyContext() {
  if (initialized) return;
  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, HOST } = process.env;
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

/**
 * Get Shopify session for a shop
 * @param {string} shopDomain - Shop domain
 * @returns {Promise<Session>}
 */
export async function getShopifySession(shopDomain) {
  try {
    // In a real implementation, you would fetch this from your database
    // For now, we'll create a basic session
    const session = new Session({
      id: `shopify_session_${shopDomain}`,
      shop: shopDomain,
      state: 'state',
      isOnline: false,
    });

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
 * Get discount codes for a shop
 * @param {string} shopDomain - Shop domain
 * @returns {Promise<Array>}
 */
export async function getDiscountCodes(shopDomain) {
  try {
    const session = await getShopifySession(shopDomain);

    // Create a GraphQL client
    const client = new shopifyApi.clients.Graphql({ session });

    // GraphQL query to get discount codes
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
                  customerSelection {
                    ... on DiscountCustomerAll {
                      allCustomers
                    }
                    ... on DiscountCustomerSegments {
                      segments {
                        id
                        title
                      }
                    }
                  }
                  minimumRequirement {
                    ... on DiscountMinimumQuantity {
                      greaterThanOrEqualToQuantity
                    }
                    ... on DiscountMinimumSubtotal {
                      greaterThanOrEqualToSubtotal {
                        amount
                        currencyCode
                      }
                    }
                  }
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
 * @param {string} shopDomain - Shop domain
 * @param {string} discountId - Discount ID
 * @returns {Promise<Object>}
 */
export async function getDiscountCode(shopDomain, discountId) {
  try {
    const session = await getShopifySession(shopDomain);
    const client = new shopifyApi.clients.Graphql({ session });

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
  getDiscountCodes,
  getDiscountCode,
};
