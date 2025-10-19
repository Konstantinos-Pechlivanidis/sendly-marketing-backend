import { z } from 'zod';

/**
 * Billing Validation Schemas
 * Using Zod for type-safe input validation
 */

// Package IDs
const packageIdSchema = z.enum(['package_1000', 'package_5000', 'package_10000', 'package_25000'], {
  errorMap: () => ({ message: 'Invalid package ID' }),
});

// Transaction type
const transactionTypeSchema = z.enum(['purchase', 'debit', 'credit', 'refund', 'adjustment']);

// Transaction status
const transactionStatusSchema = z.enum(['pending', 'completed', 'failed']);

/**
 * Create Purchase Session Schema
 */
export const createPurchaseSchema = z.object({
  packageId: packageIdSchema,
  successUrl: z.string().url('Success URL must be a valid URL'),
  cancelUrl: z.string().url('Cancel URL must be a valid URL'),
});

/**
 * Transaction History Query Schema
 */
export const transactionHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  type: transactionTypeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['startDate'],
});

/**
 * Billing History Query Schema
 */
export const billingHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: transactionStatusSchema.optional(),
});

export default {
  createPurchaseSchema,
  transactionHistoryQuerySchema,
  billingHistoryQuerySchema,
};

