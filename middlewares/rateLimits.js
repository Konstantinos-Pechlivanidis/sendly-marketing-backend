import rateLimit from 'express-rate-limit';

// Reports: overview 50 rpm, campaigns/automations/messaging/revenue 30 rpm, export 10 rpm (docs)
export const rlReportsOverview = rateLimit({ windowMs: 60 * 1000, max: 50 });
export const rlReportsGeneral = rateLimit({ windowMs: 60 * 1000, max: 30 });
export const rlReportsExport = rateLimit({ windowMs: 60 * 1000, max: 10 });
