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
import { validateBody, validateQuery } from '../middlewares/validation.js';
import {
  createContactSchema,
  updateContactSchema,
  listContactsQuerySchema,
  importContactsSchema,
  birthdayContactsQuerySchema,
} from '../schemas/contacts.schema.js';
import { contactsRateLimit, importRateLimit } from '../middlewares/rateLimits.js';

const router = express.Router();

/**
 * Enhanced Contacts Routes with Multi-Store Support
 *
 * All routes are automatically scoped to the current store via middleware
 * All routes include input validation and rate limiting
 */

// Apply rate limiting to all routes
router.use(contactsRateLimit);

// GET /api/contacts - List contacts with filtering, search, and pagination
router.get('/', validateQuery(listContactsQuerySchema), list);

// GET /api/contacts/stats - Get contact statistics
router.get('/stats', stats);

// GET /api/contacts/birthdays - Get contacts with birthdays
router.get('/birthdays', validateQuery(birthdayContactsQuerySchema), getBirthdayContacts);

// GET /api/contacts/:id - Get single contact
router.get('/:id', getOne);

// POST /api/contacts - Create new contact
router.post('/', validateBody(createContactSchema), create);

// POST /api/contacts/import - Import contacts from CSV (stricter rate limit)
router.post('/import', importRateLimit, validateBody(importContactsSchema), importCsv);

// PUT /api/contacts/:id - Update contact
router.put('/:id', validateBody(updateContactSchema), update);

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', remove);

export default router;
