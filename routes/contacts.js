import { Router } from 'express';
import { body } from 'express-validator';
import { handleValidation } from '../middlewares/validate.js';
import * as ctrl from '../controllers/contacts.js';
const r = Router();
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);
r.post('/', ctrl.create);
r.put('/:id', ctrl.update);
r.delete('/:id', ctrl.remove);
r.post(
  '/import',
  // TODO: add file validation when implementing CSV import
  ctrl.importCsv
);
r.get('/stats/summary', ctrl.stats);
export default r;
