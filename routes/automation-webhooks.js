import express from 'express';
import * as ctrl from '../controllers/automation-webhooks.js';

const r = express.Router();

// Shopify webhook routes (no authentication required)
r.post('/shopify/orders/create', ctrl.handleOrderCreated);
r.post('/shopify/cart/abandoned', ctrl.handleCartAbandoned);

// Manual trigger route (for testing)
r.post('/trigger', ctrl.triggerAutomationManually);

export default r;
