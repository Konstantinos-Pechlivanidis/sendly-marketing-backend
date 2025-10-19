import Stripe from 'stripe';
import prisma from './prisma.js';
import { logger } from '../utils/logger.js';

// Initialize Stripe (only if API key is available)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  })
  : null;

/**
 * Create Stripe checkout session for credit purchase
 */
export async function createStripeCheckoutSession({
  packageId,
  _packageName, // Renamed to indicate unused
  credits,
  price,
  currency,
  stripePriceId,
  shopId,
  shopDomain,
}) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/settings?canceled=true`,
      metadata: {
        shopId,
        packageId,
        credits: credits.toString(),
        shopDomain,
      },
      customer_email: `${shopDomain}@sendly.com`, // Use shop domain as email
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI'],
      },
    });

    logger.info('Stripe checkout session created', {
      sessionId: session.id,
      shopId,
      packageId,
      credits,
      price,
      currency,
    });

    return session;
  } catch (error) {
    logger.error('Failed to create Stripe checkout session', {
      error: error.message,
      shopId,
      packageId,
    });
    throw error;
  }
}

/**
 * Retrieve Stripe checkout session
 */
export async function getCheckoutSession(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    logger.error('Failed to retrieve Stripe checkout session', {
      error: error.message,
      sessionId,
    });
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(payload, signature) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    return event;
  } catch (error) {
    logger.error('Failed to verify Stripe webhook signature', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Handle successful payment
 */
export async function handlePaymentSuccess(session) {
  try {
    const { shopId, packageId, credits } = session.metadata;

    if (!shopId || !packageId || !credits) {
      throw new Error('Missing required metadata in session');
    }

    const creditsToAdd = parseInt(credits);

    // Update shop credits
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        credits: {
          increment: creditsToAdd,
        },
      },
    });

    // Update billing transaction status
    await prisma.billingTransaction.updateMany({
      where: {
        shopId,
        stripeSessionId: session.id,
        status: 'pending',
      },
      data: {
        status: 'completed',
        stripePaymentId: session.payment_intent,
      },
    });

    logger.info('Payment processed successfully', {
      shopId,
      packageId,
      creditsAdded: creditsToAdd,
      newBalance: updatedShop.credits,
      sessionId: session.id,
    });

    return {
      success: true,
      creditsAdded: creditsToAdd,
      newBalance: updatedShop.credits,
    };
  } catch (error) {
    logger.error('Failed to handle payment success', {
      error: error.message,
      sessionId: session.id,
    });
    throw error;
  }
}

/**
 * Handle failed payment
 */
export async function handlePaymentFailure(session) {
  try {
    const { shopId } = session.metadata;

    if (!shopId) {
      throw new Error('Missing shopId in session metadata');
    }

    // Update billing transaction status
    await prisma.billingTransaction.updateMany({
      where: {
        shopId,
        stripeSessionId: session.id,
        status: 'pending',
      },
      data: {
        status: 'failed',
      },
    });

    logger.info('Payment failed', {
      shopId,
      sessionId: session.id,
    });

    return {
      success: true,
      message: 'Payment failure recorded',
    };
  } catch (error) {
    logger.error('Failed to handle payment failure', {
      error: error.message,
      sessionId: session.id,
    });
    throw error;
  }
}

/**
 * Get Stripe customer by email
 */
export async function getCustomerByEmail(email) {
  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    return customers.data[0] || null;
  } catch (error) {
    logger.error('Failed to get Stripe customer', {
      error: error.message,
      email,
    });
    throw error;
  }
}

/**
 * Create Stripe customer
 */
export async function createCustomer({ email, name, shopDomain }) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        shopDomain,
      },
    });

    logger.info('Stripe customer created', {
      customerId: customer.id,
      email,
      shopDomain,
    });

    return customer;
  } catch (error) {
    logger.error('Failed to create Stripe customer', {
      error: error.message,
      email,
      shopDomain,
    });
    throw error;
  }
}
export default {
  createStripeCheckoutSession,
  getCheckoutSession,
  verifyWebhookSignature,
  handlePaymentSuccess,
  handlePaymentFailure,
  getCustomerByEmail,
  createCustomer,
};

