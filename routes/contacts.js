import { Router } from 'express';
import { body } from 'express-validator';
import { verifySessionToken } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validate.js';
import * as ctrl from '../controllers/contacts.js';
const r = Router();
r.get('/', verifySessionToken, ctrl.list);
r.get('/:id', verifySessionToken, ctrl.getOne);
r.post('/', verifySessionToken, ctrl.create);
r.put('/:id', verifySessionToken, ctrl.update);
r.delete('/:id', verifySessionToken, ctrl.remove);
r.post(
  '/import',
  verifySessionToken,
  // TODO: add file validation when implementing CSV import
  ctrl.importCsv
);
r.get('/stats/summary', verifySessionToken, ctrl.stats);
export default r;
