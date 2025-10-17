import { Router } from 'express';
import { body } from 'express-validator';
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
r.get('/', rlTemplatesList,  ctrl.list);
r.get('/categories', rlTemplatesList,  ctrl.categories);
r.get('/triggers', rlTemplatesList,  ctrl.triggers);
r.get('/popular', rlTemplatesList,  ctrl.popular);
r.get('/stats', rlTemplatesStats,  ctrl.stats);
r.get('/:id', rlTemplatesGet,  ctrl.getOne);
r.post('/:id/use', rlTemplatesUse,  ctrl.useTemplate);
r.post(
  '/preview',
  rlTemplatesPrev,
  body('templateId').isString().isLength({ min: 1 }),
  body('sampleData').optional().isObject(),
  handleValidation,
  ctrl.preview
);
export default r;
