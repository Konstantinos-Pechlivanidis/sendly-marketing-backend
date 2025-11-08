import prisma from './prisma.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { createStripeCheckoutSession } from './stripe.js';

/**
 * Billing Service
 * Handles credit management, Stripe integration, and transaction history
 */

/**
 * Credit packages configuration
 */
const CREDIT_PACKAGES = [
  {
    id: 'package_1000',
    name: '1,000 SMS Credits',
    credits: 1000,
    price: 29.99,
    currency: 'EUR',
    stripePriceId: process.env.STRIPE_PRICE_ID_1000 || 'price_1000_credits',
    description: 'Perfect for small businesses getting started',
    popular: false,
    features: ['1,000 SMS messages', 'No expiration', 'Priority support'],
  },
  {
    id: 'package_5000',
    name: '5,000 SMS Credits',
    credits: 5000,
    price: 129.99,
    currency: 'EUR',
    stripePriceId: process.env.STRIPE_PRICE_ID_5000 || 'price_5000_credits',
    description: 'Great value for growing businesses',
    popular: true,
    features: ['5,000 SMS messages', 'No expiration', 'Priority support', '13% savings'],
  },
  {
    id: 'package_10000',
    name: '10,000 SMS Credits',
    credits: 10000,
    price: 229.99,
    currency: 'EUR',
    stripePriceId: process.env.STRIPE_PRICE_ID_10000 || 'price_10000_credits',
    description: 'Best value for high-volume senders',
    popular: false,
    features: ['10,000 SMS messages', 'No expiration', 'Priority support', '23% savings'],
  },
  {
    id: 'package_25000',
    name: '25,000 SMS Credits',
    credits: 25000,
    price: 499.99,
    currency: 'EUR',
    stripePriceId: process.env.STRIPE_PRICE_ID_25000 || 'price_25000_credits',
    description: 'Enterprise solution for maximum reach',
    popular: false,
    features: ['25,000 SMS messages', 'No expiration', 'Dedicated support', '33% savings'],
  },
];

/**
 * Get credit balance for store
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Balance information
 */
export async function getBalance(storeId) {
  logger.info('Getting balance', { storeId });

  const shop = await prisma.shop.findUnique({
    where: { id: storeId },
    select: { credits: true, currency: true },
  });

  if (!shop) {
    throw new NotFoundError('Shop');
  }

  logger.info('Balance retrieved', { storeId, credits: shop.credits });

  return {
    credits: shop.credits || 0,
    balance: shop.credits || 0, // Alias for consistency
    currency: shop.currency || 'EUR',
  };
}

/**
 * Get available credit packages
 * @returns {Array} Available packages
 */
export function getPackages() {
  logger.info('Getting credit packages');
  return CREDIT_PACKAGES;
}

/**
 * Get package by ID
 * @param {string} packageId - Package ID
 * @returns {Object} Package details
 */
export function getPackageById(packageId) {
  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);

  if (!pkg) {
    throw new NotFoundError('Package');
  }

  return pkg;
}

/**
 * Create Stripe checkout session for credit purchase
 * @param {string} storeId - Store ID
 * @param {string} packageId - Package ID
 * @param {Object} returnUrls - Success and cancel URLs
 * @returns {Promise<Object>} Checkout session
 */
export async function createPurchaseSession(storeId, packageId, returnUrls) {
  logger.info('Creating purchase session', { storeId, packageId });

  // Validate package
  const pkg = getPackageById(packageId);

  // Get shop details
  const shop = await prisma.shop.findUnique({
    where: { id: storeId },
    select: { id: true, shopDomain: true, shopName: true },
  });

  if (!shop) {
    throw new NotFoundError('Shop');
  }

  // Validate return URLs
  if (!returnUrls.successUrl || !returnUrls.cancelUrl) {
    throw new ValidationError('Success and cancel URLs are required');
  }

  // Create billing transaction record
  const transaction = await prisma.billingTransaction.create({
    data: {
      shopId: storeId,
      creditsAdded: pkg.credits,
      amount: Math.round(pkg.price * 100), // Convert to cents
      currency: pkg.currency,
      packageType: packageId,
      stripeSessionId: 'pending', // Will be updated after Stripe session creation
      status: 'pending',
    },
  });

  // Create Stripe checkout session
  const session = await createStripeCheckoutSession({
    priceId: pkg.stripePriceId,
    quantity: 1,
    successUrl: returnUrls.successUrl,
    cancelUrl: returnUrls.cancelUrl,
    metadata: {
      storeId,
      packageId,
      transactionId: transaction.id,
      credits: pkg.credits.toString(),
    },
  });

  // Update transaction with Stripe session ID
  await prisma.billingTransaction.update({
    where: { id: transaction.id },
    data: { stripeSessionId: session.id },
  });

  logger.info('Purchase session created', {
    storeId,
    packageId,
    sessionId: session.id,
    transactionId: transaction.id,
  });

  return {
    sessionId: session.id,
    sessionUrl: session.url,
    transactionId: transaction.id,
    package: pkg,
  };
}

/**
 * Handle successful Stripe payment
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} Processing result
 */
export async function handleStripeWebhook(stripeEvent) {
  logger.info('Handling Stripe webhook', {
    type: stripeEvent.type,
    eventId: stripeEvent.id,
  });

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const { storeId, transactionId, credits } = session.metadata;

    logger.info('Processing completed checkout', {
      storeId,
      transactionId,
      sessionId: session.id,
    });

    // Find transaction
    const transaction = await prisma.billingTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      logger.error('Transaction not found', { transactionId });
      throw new NotFoundError('Transaction');
    }

    if (transaction.status === 'completed') {
      logger.warn('Transaction already completed', { transactionId });
      return { status: 'already_processed' };
    }

    // Update transaction status
    await prisma.billingTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'completed',
        stripePaymentId: session.payment_intent,
      },
    });

    // Add credits to shop
    await addCredits(storeId, parseInt(credits), `stripe:${session.id}`, {
      transactionId,
      sessionId: session.id,
      paymentIntent: session.payment_intent,
    });

    logger.info('Purchase completed successfully', {
      storeId,
      transactionId,
      creditsAdded: credits,
    });

    return {
      status: 'success',
      storeId,
      creditsAdded: parseInt(credits),
    };
  }

  return { status: 'ignored', type: stripeEvent.type };
}

/**
 * Add credits to store balance
 * @param {string} storeId - Store ID
 * @param {number} credits - Credits to add
 * @param {string} ref - Reference (e.g., 'stripe:session_id')
 * @param {Object} meta - Additional metadata
 * @returns {Promise<Object>} Updated balance
 */
export async function addCredits(storeId, credits, ref, meta = {}) {
  logger.info('Adding credits', { storeId, credits, ref });

  if (credits <= 0) {
    throw new ValidationError('Credits must be positive');
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update shop credits
    const shop = await tx.shop.update({
      where: { id: storeId },
      data: {
        credits: { increment: credits },
      },
      select: { credits: true },
    });

    // Create wallet transaction record
    await tx.walletTransaction.create({
      data: {
        shopId: storeId,
        type: 'purchase',
        credits,
        ref,
        meta,
      },
    });

    return shop;
  });

  logger.info('Credits added successfully', {
    storeId,
    creditsAdded: credits,
    newBalance: result.credits,
  });

  return {
    credits: result.credits,
    added: credits,
  };
}

/**
 * Deduct credits from store balance
 * @param {string} storeId - Store ID
 * @param {number} credits - Credits to deduct
 * @param {string} ref - Reference (e.g., 'campaign:campaign_id')
 * @param {Object} meta - Additional metadata
 * @returns {Promise<Object>} Updated balance
 */
export async function deductCredits(storeId, credits, ref, meta = {}) {
  logger.info('Deducting credits', { storeId, credits, ref });

  if (credits <= 0) {
    throw new ValidationError('Credits must be positive');
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Check current balance
    const shop = await tx.shop.findUnique({
      where: { id: storeId },
      select: { credits: true },
    });

    if (!shop) {
      throw new NotFoundError('Shop');
    }

    if (shop.credits < credits) {
      throw new ValidationError(`Insufficient credits. Available: ${shop.credits}, Required: ${credits}`);
    }

    // Update shop credits
    const updatedShop = await tx.shop.update({
      where: { id: storeId },
      data: {
        credits: { decrement: credits },
      },
      select: { credits: true },
    });

    // Create wallet transaction record
    await tx.walletTransaction.create({
      data: {
        shopId: storeId,
        type: 'debit',
        credits: -credits, // Negative for debit
        ref,
        meta,
      },
    });

    return updatedShop;
  });

  logger.info('Credits deducted successfully', {
    storeId,
    creditsDeducted: credits,
    newBalance: result.credits,
  });

  return {
    credits: result.credits,
    deducted: credits,
  };
}

/**
 * Get transaction history
 * @param {string} storeId - Store ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Transaction history
 */
export async function getTransactionHistory(storeId, filters = {}) {
  const {
    page = 1,
    pageSize = 20,
    type,
    startDate,
    endDate,
  } = filters;

  logger.info('Getting transaction history', { storeId, filters });

  const where = { shopId: storeId };

  if (type && ['purchase', 'debit', 'credit', 'refund', 'adjustment'].includes(type)) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(pageSize),
      skip: (parseInt(page) - 1) * parseInt(pageSize),
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / parseInt(pageSize));

  logger.info('Transaction history retrieved', { storeId, total, returned: transactions.length });

  return {
    transactions,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    },
  };
}

/**
 * Get billing history (Stripe transactions)
 * @param {string} storeId - Store ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Billing history
 */
export async function getBillingHistory(storeId, filters = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
  } = filters;

  logger.info('Getting billing history', { storeId, filters });

  const where = { shopId: storeId };

  if (status && ['pending', 'completed', 'failed'].includes(status)) {
    where.status = status;
  }

  const [transactions, total] = await Promise.all([
    prisma.billingTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(pageSize),
      skip: (parseInt(page) - 1) * parseInt(pageSize),
    }),
    prisma.billingTransaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / parseInt(pageSize));

  logger.info('Billing history retrieved', { storeId, total, returned: transactions.length });

  return {
    transactions,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    },
  };
}

export default {
  getBalance,
  getPackages,
  getPackageById,
  createPurchaseSession,
  handleStripeWebhook,
  addCredits,
  deductCredits,
  getTransactionHistory,
  getBillingHistory,
};

