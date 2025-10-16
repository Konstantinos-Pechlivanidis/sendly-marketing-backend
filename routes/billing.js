import { Router } from 'express';
import { verifySessionToken } from '../middlewares/auth.js';
import * as ctrl from '../controllers/billing.js';
const r = Router();
r.get('/packages', verifySessionToken, ctrl.listPackages);
r.post('/packages/seed', verifySessionToken, ctrl.seedPackages); // dev-only seed
r.post('/purchase/:packageId', verifySessionToken, ctrl.purchasePackage);
r.get('/balance', verifySessionToken, ctrl.balance);
r.get('/transactions', verifySessionToken, ctrl.transactions);
export default r;
