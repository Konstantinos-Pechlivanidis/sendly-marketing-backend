import { logger } from '../utils/logger.js';
import {
  verifyWebhookSignature,
  handlePaymentSuccess,
  handlePaymentFailure,
} from '../services/stripe.js';

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.rawBody || JSON.stringify(req.body);

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing Stripe signature',
        message: 'Stripe signature header is required',
      });
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(payload, signature);

    logger.info('Stripe webhook received', {
      eventType: event.type,
      eventId: event.id,
    });

    // Handle different event types
    switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    case 'checkout.session.expired':
      await handleCheckoutSessionExpired(event.data.object);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;

    default:
      logger.info('Unhandled Stripe event type', {
        eventType: event.type,
        eventId: event.id,
      });
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('Stripe webhook processing failed', {
      error: error.message,
      headers: req.headers,
    });

    res.status(400).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
    });
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    logger.info('Checkout session completed', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    });

    if (session.payment_status === 'paid') {
      await handlePaymentSuccess(session);
    } else {
      logger.warn('Checkout session completed but not paid', {
        sessionId: session.id,
        paymentStatus: session.payment_status,
      });
    }
  } catch (error) {
    logger.error('Failed to handle checkout session completed', {
      error: error.message,
      sessionId: session.id,
    });
    throw error;
  }
}

/**
 * Handle checkout session expired
 */
async function handleCheckoutSessionExpired(session) {
  try {
    logger.info('Checkout session expired', {
      sessionId: session.id,
      metadata: session.metadata,
    });

    await handlePaymentFailure(session);
  } catch (error) {
    logger.error('Failed to handle checkout session expired', {
      error: error.message,
      sessionId: session.id,
    });
    throw error;
  }
}

/**
 * Handle payment intent succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    logger.info('Payment intent succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    // Additional processing if needed
    // The main logic is handled in checkout.session.completed
  } catch (error) {
    logger.error('Failed to handle payment intent succeeded', {
      error: error.message,
      paymentIntentId: paymentIntent.id,
    });
    throw error;
  }
}

/**
 * Handle payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    logger.info('Payment intent failed', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      failureCode: paymentIntent.last_payment_error?.code,
      failureMessage: paymentIntent.last_payment_error?.message,
    });

    // Update any pending transactions
    // The main logic is handled in checkout.session.completed
  } catch (error) {
    logger.error('Failed to handle payment intent failed', {
      error: error.message,
      paymentIntentId: paymentIntent.id,
    });
    throw error;
  }
}

export default {
  handleStripeWebhook,
};
