import express from 'express';
import * as ctrl from '../controllers/tracking.js';
import { setDevShop } from '../middlewares/dev-shop.js';

const r = express.Router();

// Apply dev shop middleware for all tracking routes
r.use(setDevShop);

// Get delivery status for a specific Mitto message
r.get('/mitto/:messageId', ctrl.getMittoMessageStatus);

// Get delivery status for all messages in a campaign
r.get('/campaign/:campaignId', ctrl.getCampaignDeliveryStatus);

// Bulk update delivery status for multiple messages
r.post('/bulk-update', ctrl.bulkUpdateDeliveryStatus);

export default r;
