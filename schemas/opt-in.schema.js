import { z } from 'zod';

/**
 * Opt-in Validation Schema
 * For public storefront opt-in submissions
 */
export const optInSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +306977123456)'),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Consent is required to subscribe to SMS marketing',
  }),
  shopDomain: z
    .string()
    .trim()
    .min(1, 'Shop domain is required')
    .regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/, 'Invalid shop domain format'),
  source: z.string().optional().default('theme-banner'),
});

export default {
  optInSchema,
};

