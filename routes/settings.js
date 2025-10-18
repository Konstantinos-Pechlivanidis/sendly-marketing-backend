import express from 'express';
import * as ctrl from '../controllers/settings.js';

const r = express.Router();

// Settings routes (requires shop context)
r.get('/', ctrl.getSettings);
r.get('/account', ctrl.getAccountInfo);
r.put('/sender', ctrl.updateSenderNumber);

export default r;
