import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';
import { withStoreScope, validateStoreOwnership } from '../utils/store-scoping.js';
import { getStoreId } from '../middlewares/store-resolution.js';

/**
 * Enhanced Contacts Controller with Multi-Store Support
 *
 * Features:
 * - Full CRUD operations with store scoping
 * - Advanced filtering and search
 * - Pagination support
 * - Birthday automation support
 * - Gender filtering
 * - SMS consent management
 * - Data validation
 */

/**
 * List contacts with filtering, search, and pagination
 */
export async function list(req, res) {
  try {
    const storeId = getStoreId(req);
    const {
      page = 1,
      pageSize = 20,
      filter = 'all', // all, male, female, consented, nonconsented
      q: searchTerm,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      gender,
      smsConsent,
      hasBirthDate,
    } = req.query;

    // Create store-scoped query builder
    const contactsQuery = withStoreScope(storeId, prisma.contact);

    // Build where clause
    const where = {};

    // Gender filter
    if (gender && ['male', 'female', 'other'].includes(gender)) {
      where.gender = gender;
    }

    // SMS consent filter
    if (smsConsent && ['opted_in', 'opted_out', 'unknown'].includes(smsConsent)) {
      where.smsConsent = smsConsent;
    }

    // Birth date filter
    if (hasBirthDate === 'true') {
      where.birthDate = { not: null };
    } else if (hasBirthDate === 'false') {
      where.birthDate = null;
    }

    // Legacy filter support
    if (filter === 'male') {
      where.gender = 'male';
    } else if (filter === 'female') {
      where.gender = 'female';
    } else if (filter === 'consented') {
      where.smsConsent = 'opted_in';
    } else if (filter === 'nonconsented') {
      where.smsConsent = { in: ['opted_out', 'unknown'] };
    }

    // Search functionality
    if (searchTerm) {
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phoneE164: { contains: searchTerm } },
        { tags: { hasSome: [searchTerm] } },
      ];
    }

    // Validate sort parameters
    const validSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'birthDate'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Execute paginated query
    const [contacts, total] = await Promise.all([
      contactsQuery.findMany({
        where,
        orderBy: { [sortField]: sortDirection },
        take: parseInt(pageSize),
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneE164: true,
          email: true,
          gender: true,
          birthDate: true,
          smsConsent: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      contactsQuery.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / parseInt(pageSize));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    logger.info('Contacts listed', {
      storeId,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      filter,
      searchTerm,
      gender,
      smsConsent,
    });

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          applied: {
            filter,
            searchTerm,
            gender,
            smsConsent,
            hasBirthDate,
          },
          available: {
            genders: ['male', 'female', 'other'],
            smsConsent: ['opted_in', 'opted_out', 'unknown'],
            filters: ['all', 'male', 'female', 'consented', 'nonconsented'],
          },
        },
      },
    });
  } catch (error) {
    logger.error('Failed to list contacts', {
      error: error.message,
      storeId: req.ctx?.store?.id,
      query: req.query,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to list contacts',
      message: error.message,
    });
  }
}

/**
 * Get a single contact by ID (store-scoped)
 */
export async function getOne(req, res) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    // Validate ownership
    await validateStoreOwnership(storeId, prisma.contact, id, 'Contact');

    // Get contact with store scope
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    const contact = await contactsQuery.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            segment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
        message: 'Contact not found in your store',
      });
    }

    logger.info('Contact retrieved', {
      storeId,
      contactId: id,
    });

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    logger.error('Failed to get contact', {
      error: error.message,
      storeId: req.ctx?.store?.id,
      contactId: req.params.id,
    });

    if (error.message.includes('does not belong to the current store')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'This contact does not belong to your store',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get contact',
      message: error.message,
    });
  }
}

/**
 * Create a new contact (store-scoped)
 */
export async function create(req, res) {
  try {
    const storeId = getStoreId(req);
    const {
      firstName,
      lastName,
      phoneE164,
      email,
      gender,
      birthDate,
      smsConsent = 'unknown',
      tags = [],
    } = req.body;

    // Validate required fields
    if (!phoneE164) {
      return res.status(400).json({
        success: false,
        error: 'Phone number required',
        message: 'Phone number is required for contact creation',
      });
    }

    // Validate phone format (E.164)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phoneE164)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone format',
        message: 'Phone number must be in E.164 format (e.g., +1234567890)',
      });
    }

    // Validate gender
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gender',
        message: 'Gender must be one of: male, female, other',
      });
    }

    // Validate birth date
    let parsedBirthDate = null;
    if (birthDate) {
      parsedBirthDate = new Date(birthDate);
      if (isNaN(parsedBirthDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid birth date',
          message: 'Birth date must be a valid ISO date string',
        });
      }

      // Check if birth date is in the future
      if (parsedBirthDate > new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid birth date',
          message: 'Birth date cannot be in the future',
        });
      }
    }

    // Validate SMS consent
    if (!['opted_in', 'opted_out', 'unknown'].includes(smsConsent)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SMS consent',
        message: 'SMS consent must be one of: opted_in, opted_out, unknown',
      });
    }

    // Create contact with store scope
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    const contact = await contactsQuery.create({
      data: {
        firstName,
        lastName,
        phoneE164,
        email,
        gender,
        birthDate: parsedBirthDate,
        smsConsent,
        tags,
      },
    });

    logger.info('Contact created', {
      storeId,
      contactId: contact.id,
      phoneE164,
      hasBirthDate: !!parsedBirthDate,
      smsConsent,
    });

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact created successfully',
    });
  } catch (error) {
    logger.error('Failed to create contact', {
      error: error.message,
      storeId: req.ctx?.store?.id,
      body: req.body,
    });

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return res.status(409).json({
        success: false,
        error: 'Contact already exists',
        message: `A contact with this ${field} already exists in your store`,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create contact',
      message: error.message,
    });
  }
}

/**
 * Update a contact (store-scoped)
 */
export async function update(req, res) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phoneE164,
      email,
      gender,
      birthDate,
      smsConsent,
      tags,
    } = req.body;

    // Validate ownership
    await validateStoreOwnership(storeId, prisma.contact, id, 'Contact');

    // Validate phone format if provided
    if (phoneE164) {
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(phoneE164)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone format',
          message: 'Phone number must be in E.164 format (e.g., +1234567890)',
        });
      }
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gender',
        message: 'Gender must be one of: male, female, other',
      });
    }

    // Validate birth date if provided
    let parsedBirthDate = undefined;
    if (birthDate !== undefined) {
      if (birthDate === null) {
        parsedBirthDate = null;
      } else {
        parsedBirthDate = new Date(birthDate);
        if (isNaN(parsedBirthDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid birth date',
            message: 'Birth date must be a valid ISO date string',
          });
        }

        if (parsedBirthDate > new Date()) {
          return res.status(400).json({
            success: false,
            error: 'Invalid birth date',
            message: 'Birth date cannot be in the future',
          });
        }
      }
    }

    // Validate SMS consent if provided
    if (smsConsent && !['opted_in', 'opted_out', 'unknown'].includes(smsConsent)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SMS consent',
        message: 'SMS consent must be one of: opted_in, opted_out, unknown',
      });
    }

    // Update contact with store scope
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    const contact = await contactsQuery.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phoneE164 !== undefined && { phoneE164 }),
        ...(email !== undefined && { email }),
        ...(gender !== undefined && { gender }),
        ...(birthDate !== undefined && { birthDate: parsedBirthDate }),
        ...(smsConsent !== undefined && { smsConsent }),
        ...(tags !== undefined && { tags }),
      },
    });

    logger.info('Contact updated', {
      storeId,
      contactId: id,
      updatedFields: Object.keys(req.body),
    });

    res.json({
      success: true,
      data: contact,
      message: 'Contact updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update contact', {
      error: error.message,
      storeId: req.ctx?.store?.id,
      contactId: req.params.id,
    });

    if (error.message.includes('does not belong to the current store')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'This contact does not belong to your store',
      });
    }

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: `A contact with this ${field} already exists in your store`,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update contact',
      message: error.message,
    });
  }
}

/**
 * Delete a contact (store-scoped)
 */
export async function remove(req, res) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    // Validate ownership
    await validateStoreOwnership(storeId, prisma.contact, id, 'Contact');

    // Delete contact with store scope
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    await contactsQuery.delete({
      where: { id },
    });

    logger.info('Contact deleted', {
      storeId,
      contactId: id,
    });

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete contact', {
      error: error.message,
      storeId: req.ctx?.store?.id,
      contactId: req.params.id,
    });

    if (error.message.includes('does not belong to the current store')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'This contact does not belong to your store',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete contact',
      message: error.message,
    });
  }
}

/**
 * Get contact statistics (store-scoped)
 */
export async function stats(req, res) {
  try {
    const storeId = getStoreId(req);

    // Get statistics with store scope
    const contactsQuery = withStoreScope(storeId, prisma.contact);

    const [
      total,
      optedIn,
      optedOut,
      unknown,
      male,
      female,
      other,
      withBirthDate,
      withoutBirthDate,
    ] = await Promise.all([
      contactsQuery.count(),
      contactsQuery.count({ where: { smsConsent: 'opted_in' } }),
      contactsQuery.count({ where: { smsConsent: 'opted_out' } }),
      contactsQuery.count({ where: { smsConsent: 'unknown' } }),
      contactsQuery.count({ where: { gender: 'male' } }),
      contactsQuery.count({ where: { gender: 'female' } }),
      contactsQuery.count({ where: { gender: 'other' } }),
      contactsQuery.count({ where: { birthDate: { not: null } } }),
      contactsQuery.count({ where: { birthDate: null } }),
    ]);

    const consentRate = total > 0 ? Math.round((optedIn / total) * 100) : 0;
    const birthDateRate = total > 0 ? Math.round((withBirthDate / total) * 100) : 0;

    logger.info('Contact statistics retrieved', {
      storeId,
      total,
      optedIn,
      optedOut,
      unknown,
      consentRate,
      birthDateRate,
    });

    res.json({
      success: true,
      data: {
        total,
        smsConsent: {
          optedIn,
          optedOut,
          unknown,
          consentRate,
        },
        gender: {
          male,
          female,
          other,
          unspecified: total - male - female - other,
        },
        birthDate: {
          withBirthDate,
          withoutBirthDate,
          birthDateRate,
        },
        automation: {
          birthdayEligible: withBirthDate,
          smsEligible: optedIn,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get contact statistics', {
      error: error.message,
      storeId: req.ctx?.store?.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get contact statistics',
      message: error.message,
    });
  }
}

/**
 * Get contacts with birthdays today (for automation)
 */
export async function getBirthdayContacts(req, res) {
  try {
    const storeId = getStoreId(req);
    const { date } = req.query;

    // Use provided date or today
    const targetDate = date ? new Date(date) : new Date();
    const month = targetDate.getMonth() + 1; // 1-based month
    const day = targetDate.getDate();

    // Get contacts with birthdays today
    const contactsQuery = withStoreScope(storeId, prisma.contact);
    const birthdayContacts = await contactsQuery.findMany({
      where: {
        birthDate: {
          not: null,
        },
        smsConsent: 'opted_in', // Only SMS-consented contacts
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneE164: true,
        birthDate: true,
        gender: true,
      },
    });

    // Filter by actual birthday (month and day)
    const todayBirthdays = birthdayContacts.filter(contact => {
      const contactBirthDate = new Date(contact.birthDate);
      return contactBirthDate.getMonth() + 1 === month &&
             contactBirthDate.getDate() === day;
    });

    logger.info('Birthday contacts retrieved', {
      storeId,
      targetDate: targetDate.toISOString(),
      total: birthdayContacts.length,
      todayBirthdays: todayBirthdays.length,
    });

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString(),
        total: todayBirthdays.length,
        contacts: todayBirthdays,
      },
    });
  } catch (error) {
    logger.error('Failed to get birthday contacts', {
      error: error.message,
      storeId: req.ctx?.store?.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get birthday contacts',
      message: error.message,
    });
  }
}

/**
 * Import contacts from CSV (store-scoped)
 */
export async function importCsv(req, res) {
  try {
    const storeId = getStoreId(req);
    const { contacts } = req.body; // Array of contact objects

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contacts data',
        message: 'Contacts must be provided as a non-empty array',
      });
    }

    // Validate and prepare contacts
    const validContacts = [];
    const errors = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      if (!contact.phoneE164) {
        errors.push(`Row ${i + 1}: Phone number is required`);
        continue;
      }

      // Validate phone format
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(contact.phoneE164)) {
        errors.push(`Row ${i + 1}: Invalid phone format`);
        continue;
      }

      // Validate gender if provided
      if (contact.gender && !['male', 'female', 'other'].includes(contact.gender)) {
        errors.push(`Row ${i + 1}: Invalid gender`);
        continue;
      }

      // Validate birth date if provided
      let parsedBirthDate = null;
      if (contact.birthDate) {
        parsedBirthDate = new Date(contact.birthDate);
        if (isNaN(parsedBirthDate.getTime()) || parsedBirthDate > new Date()) {
          errors.push(`Row ${i + 1}: Invalid birth date`);
          continue;
        }
      }

      validContacts.push({
        firstName: contact.firstName || null,
        lastName: contact.lastName || null,
        phoneE164: contact.phoneE164,
        email: contact.email || null,
        gender: contact.gender || null,
        birthDate: parsedBirthDate,
        smsConsent: contact.smsConsent || 'unknown',
        tags: contact.tags || [],
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
        message: 'Some contacts have validation errors',
        details: errors,
      });
    }

    // Import contacts with store scope
    const contactsQuery = withStoreScope(storeId, prisma.contact);

    // Use upsert to handle duplicates
    const importedContacts = [];
    const skippedContacts = [];

    for (const contact of validContacts) {
      try {
        const result = await contactsQuery.create({
          data: contact,
        });
        importedContacts.push(result);
      } catch (error) {
        if (error.code === 'P2002') {
          // Skip duplicates
          skippedContacts.push(contact.phoneE164);
          continue;
        }
        throw error;
      }
    }

    logger.info('Contacts imported', {
      storeId,
      total: validContacts.length,
      imported: importedContacts.length,
      skipped: skippedContacts.length,
    });

    res.json({
      success: true,
      data: {
        total: validContacts.length,
        imported: importedContacts.length,
        skipped: skippedContacts.length,
        skippedContacts,
      },
      message: `Successfully imported ${importedContacts.length} contacts`,
    });
  } catch (error) {
    logger.error('Failed to import contacts', {
      error: error.message,
      storeId: req.ctx?.store?.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to import contacts',
      message: error.message,
    });
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
