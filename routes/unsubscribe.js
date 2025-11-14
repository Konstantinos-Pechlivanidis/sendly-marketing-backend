import express from 'express';
import * as ctrl from '../controllers/unsubscribe.js';

const r = express.Router();

// Unsubscribe routes (public, no authentication required)
// GET /unsubscribe/:token - Show unsubscribe page
r.get('/:token', ctrl.showUnsubscribePage);

// POST /unsubscribe/:token - Process unsubscribe request
r.post('/:token', ctrl.processUnsubscribe);

export default r;

