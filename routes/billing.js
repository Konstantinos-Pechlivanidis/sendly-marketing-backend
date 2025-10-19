import express from 'express';
import * as ctrl from '../controllers/billing.js';
import { validateBody, validateQuery } from '../middlewares/validation.js';
import {
  createPurchaseSchema,
  transactionHistoryQuerySchema,
  billingHistoryQuerySchema,
} from '../schemas/billing.schema.js';
import { billingRateLimit } from '../middlewares/rateLimits.js';

const r = express.Router();

// Apply rate limiting to all routes
r.use(billingRateLimit);

// GET /billing/balance - Get credit balance
r.get('/balance', ctrl.getBalance);

// GET /billing/packages - Get available credit packages
r.get('/packages', ctrl.getPackages);

// GET /billing/history - Get transaction history
r.get('/history', validateQuery(transactionHistoryQuerySchema), ctrl.getHistory);

// GET /billing/billing-history - Get billing history (Stripe transactions)
r.get('/billing-history', validateQuery(billingHistoryQuerySchema), ctrl.getBillingHistory);

// POST /billing/purchase - Create Stripe checkout session
r.post('/purchase', validateBody(createPurchaseSchema), ctrl.createPurchase);

export default r;
