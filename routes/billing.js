import express from 'express';
import * as ctrl from '../controllers/billing.js';

const r = express.Router();

// Billing routes (requires shop context)
r.get('/balance', ctrl.getBalance);
r.get('/packages', ctrl.getPackages);
r.get('/history', ctrl.getBillingHistory);
r.post('/purchase', ctrl.createPurchaseSession);

export default r;
