import { shopifyApi, Session } from '@shopify/shopify-api';
import { logger } from '../utils/logger.js';
import prisma from './prisma.js';

let initialized = false;
let apiInstance = null;

export function initShopifyContext() {
  if (initialized) return apiInstance;
  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, HOST } = process.env;
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !HOST) {
    logger.warn('Shopify API configuration incomplete', {
      hasApiKey: !!SHOPIFY_API_KEY,
      hasApiSecret: !!SHOPIFY_API_SECRET,
      hasHost: !!HOST,
    });
  }

  // Initialize Shopify API instance
  try {
    apiInstance = shopifyApi({
      apiKey: SHOPIFY_API_KEY,
      apiSecretKey: SHOPIFY_API_SECRET,
      scopes: process.env.SCOPES?.split(',') || ['read_products'],
      hostName: HOST.replace(/^https?:\/\//, '').split('/')[0],
      apiVersion: '2024-04',
      isEmbeddedApp: true,
    });
    logger.info('Shopify API initialized', {
      hasApiKey: !!SHOPIFY_API_KEY,
      hasApiSecret: !!SHOPIFY_API_SECRET,
      hasHost: !!HOST,
    });
  } catch (error) {
    logger.error('Failed to initialize Shopify API', {
      error: error.message,
    });
  }

  initialized = true;
  return apiInstance;
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
 * Retrieves the access token from the database for the specific store
 * @param {string} shopDomain - Shop domain
 * @returns {Promise<Session>}
 */
export async function getShopifySession(shopDomain) {
  try {
    // Validate shopDomain before querying
    if (!shopDomain || typeof shopDomain !== 'string') {
      throw new Error(`Invalid shopDomain provided: ${shopDomain}`);
    }

    // ✅ Fetch store from database to get access token
    const store = await prisma.shop.findUnique({
      where: { shopDomain },
      select: { id: true, accessToken: true, shopDomain: true },
    });

    if (!store) {
      throw new Error(`Store not found for domain: ${shopDomain}`);
    }

    if (!store.accessToken || store.accessToken === 'pending') {
      logger.warn('Shopify access token not available', {
        shopDomain,
        storeId: store.id,
        accessTokenStatus: store.accessToken || 'missing',
      });
      throw new Error(
        `Shopify access token not available for store: ${shopDomain}. Please complete the app installation.`,
      );
    }

    // ✅ Create session with actual access token from database
    const session = new Session({
      id: `shopify_session_${shopDomain}`,
      shop: shopDomain,
      state: 'state',
      isOnline: false,
      accessToken: store.accessToken, // ✅ Use actual access token from database
    });

    logger.info('Shopify session created', {
      shopDomain,
      storeId: store.id,
      hasAccessToken: !!store.accessToken,
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
    const api = initShopifyContext();

    if (!api) {
      logger.error('Shopify API not initialized', {
        hasApi: !!api,
      });
      throw new Error('Shopify API not initialized. Please check API configuration.');
    }

    // Check for GraphQL client in different possible locations
    let GraphqlClient = null;
    if (api.clients && api.clients.Graphql) {
      GraphqlClient = api.clients.Graphql;
    } else if (api.clients && api.clients.graphql) {
      GraphqlClient = api.clients.graphql;
    } else if (api.Graphql) {
      GraphqlClient = api.Graphql;
    } else if (api.graphql) {
      GraphqlClient = api.graphql;
    }

    if (!GraphqlClient) {
      logger.error('Shopify API GraphQL client not available', {
        hasApi: !!api,
        hasClients: !!(api && api.clients),
        apiKeys: api ? Object.keys(api) : [],
        clientsKeys: api && api.clients ? Object.keys(api.clients) : [],
      });
      throw new Error('Shopify API GraphQL client not available. Please check API initialization.');
    }

    // Create a GraphQL client
    const client = new GraphqlClient({ session });

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
    const api = initShopifyContext();

    if (!api) {
      logger.error('Shopify API not initialized', {
        hasApi: !!api,
      });
      throw new Error('Shopify API not initialized. Please check API configuration.');
    }

    // Check for GraphQL client in different possible locations
    let GraphqlClient = null;
    if (api.clients && api.clients.Graphql) {
      GraphqlClient = api.clients.Graphql;
    } else if (api.clients && api.clients.graphql) {
      GraphqlClient = api.clients.graphql;
    } else if (api.Graphql) {
      GraphqlClient = api.Graphql;
    } else if (api.graphql) {
      GraphqlClient = api.graphql;
    }

    if (!GraphqlClient) {
      logger.error('Shopify API GraphQL client not available', {
        hasApi: !!api,
        hasClients: !!(api && api.clients),
        apiKeys: api ? Object.keys(api) : [],
        clientsKeys: api && api.clients ? Object.keys(api.clients) : [],
      });
      throw new Error('Shopify API GraphQL client not available. Please check API initialization.');
    }

    const client = new GraphqlClient({ session });

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
