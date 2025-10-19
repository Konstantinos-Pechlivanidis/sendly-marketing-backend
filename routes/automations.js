import express from 'express';
import * as ctrl from '../controllers/automations.js';

const r = express.Router();

// User automation routes (requires shop context)
r.get('/', ctrl.getUserAutomations);
r.get('/stats', ctrl.getAutomationStats);
r.put('/:id', ctrl.updateUserAutomation);

// Admin routes (system defaults)
r.get('/defaults', ctrl.getSystemDefaults);
r.post('/sync', ctrl.syncSystemDefaults);

export default r;
