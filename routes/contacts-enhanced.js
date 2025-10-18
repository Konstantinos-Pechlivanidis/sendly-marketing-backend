import express from 'express';
import {
  list,
  getOne,
  create,
  update,
  remove,
  stats,
  getBirthdayContacts,
  importCsv,
} from '../controllers/contacts-enhanced.js';

const router = express.Router();

/**
 * Enhanced Contacts Routes with Multi-Store Support
 *
 * All routes are automatically scoped to the current store via middleware
 */

// GET /api/contacts - List contacts with filtering, search, and pagination
router.get('/', list);

// GET /api/contacts/stats - Get contact statistics
router.get('/stats', stats);

// GET /api/contacts/birthdays - Get contacts with birthdays today (for automation)
router.get('/birthdays', getBirthdayContacts);

// GET /api/contacts/:id - Get single contact
router.get('/:id', getOne);

// POST /api/contacts - Create new contact
router.post('/', create);

// POST /api/contacts/import - Import contacts from CSV
router.post('/import', importCsv);

// PUT /api/contacts/:id - Update contact
router.put('/:id', update);

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', remove);

export default router;
