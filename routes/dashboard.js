import { Router } from 'express';
import { verifySessionToken } from '../middlewares/auth.js';
import * as ctrl from '../controllers/dashboard.js';
const r = Router();
r.get('/overview', verifySessionToken, ctrl.overview);
r.get('/quick-stats', verifySessionToken, ctrl.quickStats);
export default r;
