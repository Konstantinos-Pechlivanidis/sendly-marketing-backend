import rateLimit from 'express-rate-limit';

// Templates: List/Search 100 rpm, Get 200 rpm, Stats 50 rpm, Use/Preview 20 rpm (docs)
export const rlTemplatesList = rateLimit({ windowMs: 60 * 1000, max: 100 });
export const rlTemplatesGet = rateLimit({ windowMs: 60 * 1000, max: 200 });
export const rlTemplatesStats = rateLimit({ windowMs: 60 * 1000, max: 50 });
export const rlTemplatesUse = rateLimit({ windowMs: 60 * 1000, max: 20 });
export const rlTemplatesPrev = rateLimit({ windowMs: 60 * 1000, max: 20 });

// Reports: overview 50 rpm, campaigns/automations/messaging/revenue 30 rpm, export 10 rpm (docs)
export const rlReportsOverview = rateLimit({ windowMs: 60 * 1000, max: 50 });
export const rlReportsGeneral = rateLimit({ windowMs: 60 * 1000, max: 30 });
export const rlReportsExport = rateLimit({ windowMs: 60 * 1000, max: 10 });

// Reasonable defaults for others
export const rlDefault30 = rateLimit({ windowMs: 60 * 1000, max: 30 });
export const rlDefault60 = rateLimit({ windowMs: 60 * 1000, max: 60 });
