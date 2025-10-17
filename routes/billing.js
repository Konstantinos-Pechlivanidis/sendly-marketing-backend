import { Router } from 'express';
import * as ctrl from '../controllers/billing.js';
const r = Router();
r.get('/packages',  ctrl.listPackages);
r.post('/packages/seed',  ctrl.seedPackages); // dev-only seed
r.post('/purchase/:packageId',  ctrl.purchasePackage);
r.get('/balance',  ctrl.balance);
r.get('/transactions',  ctrl.transactions);
export default r;
