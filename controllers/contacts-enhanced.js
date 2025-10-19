import { getStoreId } from '../middlewares/store-resolution.js';
import { logger } from '../utils/logger.js';
import contactsService from '../services/contacts.js';

/**
 * Enhanced Contacts Controller
 * Uses service layer for all business logic
 */

/**
 * List contacts with filtering, search, and pagination
 * @route GET /contacts
 */
export async function list(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const filters = {
      page: req.query.page,
      pageSize: req.query.pageSize,
      filter: req.query.filter,
      q: req.query.q,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      gender: req.query.gender,
      smsConsent: req.query.smsConsent,
      hasBirthDate: req.query.hasBirthDate,
    };

    const result = await contactsService.listContacts(storeId, filters);

    return res.json({
      success: true,
      data: {
        contacts: result.contacts,
        pagination: result.pagination,
        filters: {
          applied: filters,
          available: {
            genders: ['male', 'female', 'other'],
            smsConsent: ['opted_in', 'opted_out', 'unknown'],
            filters: ['all', 'male', 'female', 'consented', 'nonconsented'],
          },
        },
      },
    });
  } catch (error) {
    logger.error('List contacts error', {
      error: error.message,
      storeId: getStoreId(req),
      query: req.query,
    });
    next(error);
  }
}

/**
 * Get a single contact by ID
 * @route GET /contacts/:id
 */
export async function getOne(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    const contact = await contactsService.getContactById(storeId, id);

    return res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    logger.error('Get contact error', {
      error: error.message,
      storeId: getStoreId(req),
      contactId: req.params.id,
    });
    next(error);
  }
}

/**
 * Create a new contact
 * @route POST /contacts
 */
export async function create(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const contactData = req.body;

    const contact = await contactsService.createContact(storeId, contactData);

    return res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact created successfully',
    });
  } catch (error) {
    logger.error('Create contact error', {
      error: error.message,
      storeId: getStoreId(req),
      body: req.body,
    });
    next(error);
  }
}

/**
 * Update a contact
 * @route PUT /contacts/:id
 */
export async function update(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;
    const contactData = req.body;

    const contact = await contactsService.updateContact(storeId, id, contactData);

    return res.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully',
    });
  } catch (error) {
    logger.error('Update contact error', {
      error: error.message,
      storeId: getStoreId(req),
      contactId: req.params.id,
    });
    next(error);
  }
}

/**
 * Delete a contact
 * @route DELETE /contacts/:id
 */
export async function remove(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    await contactsService.deleteContact(storeId, id);

    return res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    logger.error('Delete contact error', {
      error: error.message,
      storeId: getStoreId(req),
      contactId: req.params.id,
    });
    next(error);
  }
}

/**
 * Get contact statistics
 * @route GET /contacts/stats
 */
export async function stats(req, res, next) {
  try {
    const storeId = getStoreId(req);

    const stats = await contactsService.getContactStats(storeId);

    return res.json({
      success: true,
      data: {
        total: stats.total,
        smsConsent: {
          optedIn: stats.byConsent.opted_in,
          optedOut: stats.byConsent.opted_out,
          unknown: stats.byConsent.unknown,
          consentRate: stats.total > 0 
            ? Math.round((stats.byConsent.opted_in / stats.total) * 100) 
            : 0,
        },
        gender: {
          male: stats.byGender.male,
          female: stats.byGender.female,
          other: stats.byGender.other,
          unspecified: stats.byGender.unknown,
        },
        birthDate: {
          withBirthDate: stats.withBirthday,
          withoutBirthDate: stats.total - stats.withBirthday,
          birthDateRate: stats.total > 0 
            ? Math.round((stats.withBirthday / stats.total) * 100) 
            : 0,
        },
        automation: {
          birthdayEligible: stats.withBirthday,
          smsEligible: stats.byConsent.opted_in,
        },
      },
    });
  } catch (error) {
    logger.error('Get contact stats error', {
      error: error.message,
      storeId: getStoreId(req),
    });
    next(error);
  }
}

/**
 * Get contacts with birthdays
 * @route GET /contacts/birthdays
 */
export async function getBirthdayContacts(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const daysAhead = parseInt(req.query.daysAhead) || 7;

    const contacts = await contactsService.getBirthdayContacts(storeId, daysAhead);

    return res.json({
      success: true,
      data: {
        daysAhead,
        total: contacts.length,
        contacts,
      },
    });
  } catch (error) {
    logger.error('Get birthday contacts error', {
      error: error.message,
      storeId: getStoreId(req),
    });
    next(error);
  }
}

/**
 * Import contacts from CSV
 * @route POST /contacts/import
 */
export async function importCsv(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contacts data',
        message: 'Contacts must be provided as a non-empty array',
      });
    }

    const result = await contactsService.importContacts(storeId, contacts);

    return res.json({
      success: true,
      data: result,
      message: `Successfully imported ${result.created} contacts, updated ${result.updated}, skipped ${result.skipped}`,
    });
  } catch (error) {
    logger.error('Import contacts error', {
      error: error.message,
      storeId: getStoreId(req),
    });
    next(error);
  }
}

export default {
  list,
  getOne,
  create,
  update,
  remove,
  stats,
  getBirthdayContacts,
  importCsv,
};
