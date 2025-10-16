import { Router } from 'express';
import { body } from 'express-validator';
import { verifySessionToken } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validate.js';
import * as ctrl from '../controllers/campaigns.js';
const r = Router();
r.get('/', verifySessionToken, ctrl.list);
r.get('/:id', verifySessionToken, ctrl.getOne);
r.post(
  '/',
  verifySessionToken,
  body('name').isString().isLength({ min: 1 }),
  body('message').isString().isLength({ min: 1 }),
  handleValidation,
  ctrl.create
);
r.put(
  '/:id',
  verifySessionToken,
  body('name').optional().isString().isLength({ min: 1 }),
  body('message').optional().isString().isLength({ min: 1 }),
  handleValidation,
  ctrl.update
);
r.delete('/:id', verifySessionToken, ctrl.remove);
r.post('/:id/prepare', verifySessionToken, ctrl.prepare);
r.post('/:id/send', verifySessionToken, ctrl.sendNow);
r.put(
  '/:id/schedule',
  verifySessionToken,
  body('scheduleType').optional().isIn(['scheduled', 'recurring']),
  body('scheduleAt').optional().isISO8601(),
  handleValidation,
  ctrl.schedule
);
r.get('/:id/metrics', verifySessionToken, ctrl.metrics);
r.get('/stats/summary', verifySessionToken, ctrl.stats);
export default r;
