import { Router } from 'express';
import { body } from 'express-validator';
import { handleValidation } from '../middlewares/validate.js';
import * as ctrl from '../controllers/campaigns.js';
const r = Router();
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);
r.post(
  '/',
  body('name').isString().isLength({ min: 1 }),
  body('message').isString().isLength({ min: 1 }),
  handleValidation,
  ctrl.create,
);
r.put(
  '/:id',
  body('name').optional().isString().isLength({ min: 1 }),
  body('message').optional().isString().isLength({ min: 1 }),
  handleValidation,
  ctrl.update,
);
r.delete('/:id', ctrl.remove);
r.post('/:id/prepare', ctrl.prepare);
r.post('/:id/send', ctrl.sendNow);
r.put(
  '/:id/schedule',
  body('scheduleType').optional().isIn(['scheduled', 'recurring']),
  body('scheduleAt').optional().isISO8601(),
  handleValidation,
  ctrl.schedule,
);
r.get('/:id/metrics', ctrl.metrics);
r.get('/stats/summary', ctrl.stats);
export default r;
