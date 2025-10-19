import { Router } from 'express';
import * as ctrl from '../controllers/campaigns.js';
import { validateBody, validateQuery } from '../middlewares/validation.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  listCampaignsQuerySchema,
  scheduleCampaignSchema,
} from '../schemas/campaigns.schema.js';
import { campaignsRateLimit, campaignSendRateLimit } from '../middlewares/rateLimits.js';

const r = Router();

// Apply rate limiting to all routes
r.use(campaignsRateLimit);

// GET /campaigns - List campaigns with filtering
r.get('/', validateQuery(listCampaignsQuerySchema), ctrl.list);

// GET /campaigns/stats/summary - Get campaign statistics
r.get('/stats/summary', ctrl.stats);

// GET /campaigns/:id - Get single campaign
r.get('/:id', ctrl.getOne);

// POST /campaigns - Create new campaign
r.post('/', validateBody(createCampaignSchema), ctrl.create);

// PUT /campaigns/:id - Update campaign
r.put('/:id', validateBody(updateCampaignSchema), ctrl.update);

// DELETE /campaigns/:id - Delete campaign
r.delete('/:id', ctrl.remove);

// POST /campaigns/:id/prepare - Prepare campaign for sending
r.post('/:id/prepare', ctrl.prepare);

// POST /campaigns/:id/send - Send campaign immediately (stricter rate limit)
r.post('/:id/send', campaignSendRateLimit, ctrl.sendNow);

// PUT /campaigns/:id/schedule - Schedule campaign
r.put('/:id/schedule', validateBody(scheduleCampaignSchema), ctrl.schedule);

// GET /campaigns/:id/metrics - Get campaign metrics
r.get('/:id/metrics', ctrl.metrics);

export default r;
