import { z } from 'zod';

/**
 * Campaign Validation Schemas
 * Using Zod for type-safe input validation
 */

// Campaign status validation
const campaignStatusSchema = z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled']);

// Schedule type validation
const scheduleTypeSchema = z.enum(['immediate', 'scheduled', 'recurring']);

// Audience validation
const audienceSchema = z.string()
  .refine((val) => {
    return val === 'all' ||
           val === 'male' ||
           val === 'female' ||
           val === 'men' ||
           val === 'women' ||
           val.startsWith('segment:');
  }, {
    message: 'Audience must be "all", "male", "female", "men", "women", or "segment:<id>"',
  });

/**
 * Create Campaign Schema
 */
export const createCampaignSchema = z.object({
  name: z.string()
    .min(1, 'Campaign name is required')
    .max(200, 'Campaign name too long'),
  message: z.string()
    .min(1, 'Campaign message is required')
    .max(1600, 'Message is too long (max 1600 characters)'),
  audience: audienceSchema.default('all'),
  discountId: z.string().optional(),
  scheduleType: scheduleTypeSchema.default('immediate'),
  scheduleAt: z.string().datetime().optional(),
  recurringDays: z.number().int().positive().max(365).optional(),
}).refine((data) => {
  if (data.scheduleType === 'scheduled') {
    return !!data.scheduleAt;
  }
  return true;
}, {
  message: 'Schedule date is required for scheduled campaigns',
  path: ['scheduleAt'],
}).refine((data) => {
  if (data.scheduleType === 'recurring') {
    return !!data.recurringDays;
  }
  return true;
}, {
  message: 'Recurring days is required for recurring campaigns',
  path: ['recurringDays'],
}).refine((data) => {
  if (data.scheduleAt) {
    return new Date(data.scheduleAt) > new Date();
  }
  return true;
}, {
  message: 'Schedule date must be in the future',
  path: ['scheduleAt'],
});

/**
 * Update Campaign Schema
 */
export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(1600).optional(),
  audience: audienceSchema.optional(),
  discountId: z.string().optional().nullable(),
  scheduleType: scheduleTypeSchema.optional(),
  scheduleAt: z.string().datetime().optional().nullable(),
  recurringDays: z.number().int().positive().max(365).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

/**
 * List Campaigns Query Schema
 */
export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: campaignStatusSchema.optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'scheduleAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schedule Campaign Schema
 */
export const scheduleCampaignSchema = z.object({
  scheduleType: scheduleTypeSchema.default('scheduled'),
  scheduleAt: z.string().datetime('Schedule date must be a valid ISO date string'),
  recurringDays: z.number().int().positive().max(365).optional(),
}).refine((data) => {
  return new Date(data.scheduleAt) > new Date();
}, {
  message: 'Schedule date must be in the future',
  path: ['scheduleAt'],
});

export default {
  createCampaignSchema,
  updateCampaignSchema,
  listCampaignsQuerySchema,
  scheduleCampaignSchema,
};

