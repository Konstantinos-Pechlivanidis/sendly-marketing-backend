import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';
import { createStripeCheckoutSession } from '../services/stripe.js';

/**
 * Get current credit balance
 */
export async function getBalance(req, res) {
  try {
    const { shopId } = req.shop || {};

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required',
        message: 'Shop context is required to fetch balance',
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { credits: true },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
        message: 'Shop not found in our system',
      });
    }

    res.json({
      success: true,
      data: {
        credits: shop.credits,
        balance: shop.credits, // Alias for consistency
      },
    });
  } catch (error) {
    logger.error('Failed to fetch balance', {
      error: error.message,
      shopId: req.shop?.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance',
      message: error.message,
    });
  }
}

/**
 * Get available credit packages
 */
export async function getPackages(req, res) {
  try {
    // Credit packages configuration
    const packages = [
      {
        id: 'package_1000',
        name: '1,000 SMS Credits',
        credits: 1000,
        price: 29.99,
        currency: 'EUR',
        stripePriceId: process.env.STRIPE_PRICE_ID_1000 || 'price_1000_credits',
        description: 'Perfect for small businesses getting started',
        popular: false,
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
      },
    ];

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    logger.error('Failed to fetch packages', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch packages',
      message: error.message,
    });
  }
}

/**
 * Create Stripe checkout session for credit purchase
 */
export async function createPurchaseSession(req, res) {
  try {
    const { packageId } = req.body;
    const { shopId } = req.shop || {};

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required',
        message: 'Shop context is required to create purchase session',
      });
    }

    if (!packageId) {
      return res.status(400).json({
        success: false,
        error: 'Package ID required',
        message: 'Package ID is required to create purchase session',
      });
    }

    // Get package details
    const packages = [
      {
        id: 'package_1000',
        name: '1,000 SMS Credits',
        credits: 1000,
        price: 29.99,
        currency: 'EUR',
        stripePriceId: process.env.STRIPE_PRICE_ID_1000 || 'price_1000_credits',
      },
      {
        id: 'package_5000',
        name: '5,000 SMS Credits',
        credits: 5000,
        price: 129.99,
        currency: 'EUR',
        stripePriceId: process.env.STRIPE_PRICE_ID_5000 || 'price_5000_credits',
      },
      {
        id: 'package_10000',
        name: '10,000 SMS Credits',
        credits: 10000,
        price: 229.99,
        currency: 'EUR',
        stripePriceId: process.env.STRIPE_PRICE_ID_10000 || 'price_10000_credits',
      },
    ];

    const selectedPackage = packages.find(pkg => pkg.id === packageId);

    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid package',
        message: 'Selected package not found',
      });
    }

    // Get shop information
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { shopDomain: true },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
        message: 'Shop not found in our system',
      });
    }

    // Create Stripe checkout session
    const session = await createStripeCheckoutSession({
      packageId,
      packageName: selectedPackage.name,
      credits: selectedPackage.credits,
      price: selectedPackage.price,
      currency: selectedPackage.currency,
      stripePriceId: selectedPackage.stripePriceId,
      shopId,
      shopDomain: shop.shopDomain,
    });

    // Create billing transaction record
    const transaction = await prisma.billingTransaction.create({
      data: {
        shopId,
        creditsAdded: selectedPackage.credits,
        amount: Math.round(selectedPackage.price * 100), // Convert to cents
        currency: selectedPackage.currency,
        packageType: selectedPackage.id,
        stripeSessionId: session.id,
        status: 'pending',
      },
    });

    logger.info('Purchase session created', {
      shopId,
      packageId,
      transactionId: transaction.id,
      sessionId: session.id,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        transactionId: transaction.id,
        package: selectedPackage,
      },
      message: 'Checkout session created successfully',
    });
  } catch (error) {
    logger.error('Failed to create purchase session', {
      error: error.message,
      shopId: req.shop?.id,
      packageId: req.body.packageId,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create purchase session',
      message: error.message,
    });
  }
}

/**
 * Get billing history
 */
export async function getBillingHistory(req, res) {
  try {
    const { shopId } = req.shop || {};
    const { limit = 20, offset = 0 } = req.query;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required',
        message: 'Shop context is required to fetch billing history',
      });
    }

    const [transactions, total] = await Promise.all([
      prisma.billingTransaction.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          creditsAdded: true,
          amount: true,
          currency: true,
          packageType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.billingTransaction.count({
        where: { shopId },
      }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch billing history', {
      error: error.message,
      shopId: req.shop?.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing history',
      message: error.message,
    });
  }
}

export default {
  getBalance,
  getPackages,
  createPurchaseSession,
  getBillingHistory,
};
