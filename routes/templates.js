import { Router } from 'express';
import { body } from 'express-validator';
import { verifySessionToken } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validate.js';
import {
  rlTemplatesList,
  rlTemplatesGet,
  rlTemplatesStats,
  rlTemplatesUse,
  rlTemplatesPrev,
} from '../middlewares/rateLimits.js';
import * as ctrl from '../controllers/templates.js';
const r = Router();
r.get('/', rlTemplatesList, verifySessionToken, ctrl.list);
r.get('/categories', rlTemplatesList, verifySessionToken, ctrl.categories);
r.get('/triggers', rlTemplatesList, verifySessionToken, ctrl.triggers);
r.get('/popular', rlTemplatesList, verifySessionToken, ctrl.popular);
r.get('/stats', rlTemplatesStats, verifySessionToken, ctrl.stats);
r.get('/:id', rlTemplatesGet, verifySessionToken, ctrl.getOne);
r.post('/:id/use', rlTemplatesUse, verifySessionToken, ctrl.useTemplate);
r.post(
  '/preview',
  rlTemplatesPrev,
  verifySessionToken,
  body('templateId').isString().isLength({ min: 1 }),
  body('sampleData').optional().isObject(),
  handleValidation,
  ctrl.preview
);
export default r;
