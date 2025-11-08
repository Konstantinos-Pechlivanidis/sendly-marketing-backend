import prisma from './prisma.js';
import { logger } from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { validateAndConsumeCredits, InsufficientCreditsError } from './credit-validation.js';
import { smsQueue } from '../queue/index.js';

/**
 * Campaigns Service
 * Handles campaign management, scheduling, sending, and metrics
 */

/**
 * Normalize audience query to Prisma where clause
 * @param {string} audience - Audience filter
 * @returns {Object|null} Prisma where clause
 */
function normalizeAudienceQuery(audience) {
  if (!audience || audience === 'all') {
    return { smsConsent: 'opted_in' };
  }
  if (audience === 'men' || audience === 'male') {
    return { smsConsent: 'opted_in', gender: 'male' };
  }
  if (audience === 'women' || audience === 'female') {
    return { smsConsent: 'opted_in', gender: 'female' };
  }
  if (audience.startsWith('segment:')) {
    return null; // Handle separately
  }
  return { smsConsent: 'opted_in' };
}

/**
 * Resolve recipients based on audience
 * @param {string} shopId - Store ID
 * @param {string} audience - Audience filter
 * @returns {Promise<Array>} Array of recipients
 */
async function resolveRecipients(shopId, audience) {
  logger.info('Resolving recipients', { shopId, audience });

  const base = normalizeAudienceQuery(audience);

  if (base) {
    const contacts = await prisma.contact.findMany({
      where: { shopId, ...base },
      select: { id: true, phoneE164: true },
    });
    return contacts.map(c => ({ contactId: c.id, phoneE164: c.phoneE164 }));
  }

  // Handle segment-based audience
  if (audience.startsWith('segment:')) {
    const segmentId = audience.split(':')[1];
    const members = await prisma.segmentMembership.findMany({
      where: { segmentId },
      include: {
        contact: {
          select: { id: true, phoneE164: true, smsConsent: true, shopId: true },
        },
      },
    });

    return members
      .filter(m => m.contact?.shopId === shopId && m.contact?.smsConsent === 'opted_in')
      .map(m => ({ contactId: m.contactId, phoneE164: m.contact.phoneE164 }));
  }

  return [];
}

/**
 * Calculate recipient count without fetching all data
 * @param {string} shopId - Store ID
 * @param {string} audience - Audience filter
 * @returns {Promise<number>} Recipient count
 */
// Unused function - kept for potential future API use
// eslint-disable-next-line no-unused-vars
async function calculateRecipientCount(shopId, audience) {
  const base = normalizeAudienceQuery(audience);

  if (base) {
    return await prisma.contact.count({
      where: { shopId, ...base },
    });
  }

  if (audience.startsWith('segment:')) {
    const segmentId = audience.split(':')[1];
    const members = await prisma.segmentMembership.findMany({
      where: { segmentId },
      include: {
        contact: {
          select: { shopId: true, smsConsent: true },
        },
      },
    });

    return members.filter(
      m => m.contact?.shopId === shopId && m.contact?.smsConsent === 'opted_in',
    ).length;
  }

  return 0;
}

/**
 * Validate campaign data
 * @param {Object} campaignData - Campaign data to validate
 * @throws {ValidationError} If validation fails
 */
function validateCampaignData(campaignData) {
  if (!campaignData.name || campaignData.name.trim().length === 0) {
    throw new ValidationError('Campaign name is required');
  }

  if (!campaignData.message || campaignData.message.trim().length === 0) {
    throw new ValidationError('Campaign message is required');
  }

  if (campaignData.message.length > 1600) {
    throw new ValidationError('Message is too long (max 1600 characters)');
  }

  if (!['immediate', 'scheduled', 'recurring'].includes(campaignData.scheduleType)) {
    throw new ValidationError('Invalid schedule type');
  }

  if (campaignData.scheduleType === 'scheduled' && !campaignData.scheduleAt) {
    throw new ValidationError('Schedule date is required for scheduled campaigns');
  }

  if (campaignData.scheduleType === 'recurring' && !campaignData.recurringDays) {
    throw new ValidationError('Recurring days is required for recurring campaigns');
  }
}

/**
 * List campaigns with optional filtering and pagination
 * @param {string} storeId - Store ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Campaigns list
 */
export async function listCampaigns(storeId, filters = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  logger.info('Listing campaigns', { storeId, filters });

  const where = { shopId: storeId };

  if (status && ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'].includes(status)) {
    where.status = status;
  }

  const validSortFields = ['createdAt', 'updatedAt', 'name', 'scheduleAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy: { [sortField]: sortDirection },
      take: parseInt(pageSize),
      skip: (parseInt(page) - 1) * parseInt(pageSize),
      include: {
        metrics: true,
      },
    }),
    prisma.campaign.count({ where }),
  ]);

  const totalPages = Math.ceil(total / parseInt(pageSize));

  logger.info('Campaigns listed successfully', { storeId, total, returned: campaigns.length });

  return {
    campaigns,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
    },
  };
}

/**
 * Get campaign by ID
 * @param {string} storeId - Store ID
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Campaign data
 */
export async function getCampaignById(storeId, campaignId) {
  logger.info('Getting campaign by ID', { storeId, campaignId });

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      shopId: storeId,
    },
    include: {
      metrics: true,
      recipients: {
        take: 100, // Limit recipients for performance
      },
    },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  logger.info('Campaign retrieved successfully', { storeId, campaignId });

  return campaign;
}

/**
 * Create new campaign
 * @param {string} storeId - Store ID
 * @param {Object} campaignData - Campaign data
 * @returns {Promise<Object>} Created campaign
 */
export async function createCampaign(storeId, campaignData) {
  logger.info('Creating campaign', { storeId, name: campaignData.name });

  // Validate campaign data
  validateCampaignData(campaignData);

  // Create campaign
  const campaign = await prisma.campaign.create({
    data: {
      shopId: storeId,
      name: campaignData.name.trim(),
      message: campaignData.message.trim(),
      audience: campaignData.audience || 'all',
      discountId: campaignData.discountId || null,
      scheduleType: campaignData.scheduleType || 'immediate',
      scheduleAt: campaignData.scheduleAt ? new Date(campaignData.scheduleAt) : null,
      recurringDays: campaignData.recurringDays || null,
      status: 'draft',
    },
  });

  // Create metrics record
  await prisma.campaignMetrics.create({
    data: { campaignId: campaign.id },
  });

  logger.info('Campaign created successfully', { storeId, campaignId: campaign.id });

  return campaign;
}

/**
 * Update campaign
 * @param {string} storeId - Store ID
 * @param {string} campaignId - Campaign ID
 * @param {Object} campaignData - Updated campaign data
 * @returns {Promise<Object>} Updated campaign
 */
export async function updateCampaign(storeId, campaignId, campaignData) {
  logger.info('Updating campaign', { storeId, campaignId });

  // Check if campaign exists and belongs to store
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, shopId: storeId },
  });

  if (!existing) {
    throw new NotFoundError('Campaign');
  }

  // Can't update sent campaigns
  if (existing.status === 'sent') {
    throw new ValidationError('Cannot update a campaign that has already been sent');
  }

  // Prepare update data
  const updateData = {};

  if (campaignData.name !== undefined) {
    if (!campaignData.name || campaignData.name.trim().length === 0) {
      throw new ValidationError('Campaign name is required');
    }
    updateData.name = campaignData.name.trim();
  }

  if (campaignData.message !== undefined) {
    if (!campaignData.message || campaignData.message.trim().length === 0) {
      throw new ValidationError('Campaign message is required');
    }
    if (campaignData.message.length > 1600) {
      throw new ValidationError('Message is too long (max 1600 characters)');
    }
    updateData.message = campaignData.message.trim();
  }

  if (campaignData.audience !== undefined) updateData.audience = campaignData.audience;
  if (campaignData.discountId !== undefined) updateData.discountId = campaignData.discountId;
  if (campaignData.scheduleType !== undefined) updateData.scheduleType = campaignData.scheduleType;
  if (campaignData.scheduleAt !== undefined) {
    updateData.scheduleAt = campaignData.scheduleAt ? new Date(campaignData.scheduleAt) : null;
  }
  if (campaignData.recurringDays !== undefined) updateData.recurringDays = campaignData.recurringDays;

  // Update campaign
  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: updateData,
  });

  logger.info('Campaign updated successfully', { storeId, campaignId });

  return campaign;
}

/**
 * Delete campaign
 * @param {string} storeId - Store ID
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<void>}
 */
export async function deleteCampaign(storeId, campaignId) {
  logger.info('Deleting campaign', { storeId, campaignId });

  // Check if campaign exists and belongs to store
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, shopId: storeId },
  });

  if (!existing) {
    throw new NotFoundError('Campaign');
  }

  // Can't delete sent campaigns
  if (existing.status === 'sent' || existing.status === 'sending') {
    throw new ValidationError('Cannot delete a campaign that is sent or currently sending');
  }

  // Delete campaign (metrics and recipients will cascade)
  await prisma.campaign.delete({
    where: { id: campaignId },
  });

  logger.info('Campaign deleted successfully', { storeId, campaignId });
}

/**
 * Prepare campaign for sending (calculate recipients and validate credits)
 * @param {string} storeId - Store ID
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Preparation result
 */
export async function prepareCampaign(storeId, campaignId) {
  logger.info('Preparing campaign', { storeId, campaignId });

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, shopId: storeId },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  if (campaign.status !== 'draft') {
    throw new ValidationError('Only draft campaigns can be prepared');
  }

  // Calculate recipients
  const recipients = await resolveRecipients(storeId, campaign.audience);
  const recipientCount = recipients.length;

  if (recipientCount === 0) {
    throw new ValidationError('No recipients found for this campaign');
  }

  // Check credits (without consuming)
  const shop = await prisma.shop.findUnique({
    where: { id: storeId },
    select: { credits: true },
  });

  if (shop.credits < recipientCount) {
    throw new InsufficientCreditsError(recipientCount, shop.credits);
  }

  logger.info('Campaign prepared successfully', {
    storeId,
    campaignId,
    recipientCount,
    creditsAvailable: shop.credits,
  });

  return {
    recipientCount,
    creditsRequired: recipientCount,
    creditsAvailable: shop.credits,
    canSend: shop.credits >= recipientCount,
  };
}

/**
 * Send campaign immediately
 * @param {string} storeId - Store ID
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Send result
 */
export async function sendCampaign(storeId, campaignId) {
  logger.info('Sending campaign', { storeId, campaignId });

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, shopId: storeId },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  if (campaign.status !== 'draft') {
    throw new ValidationError('Only draft campaigns can be sent');
  }

  // Get recipients
  const recipients = await resolveRecipients(storeId, campaign.audience);
  const recipientCount = recipients.length;

  if (recipientCount === 0) {
    throw new ValidationError('No recipients found for this campaign');
  }

  // Validate and consume credits
  await validateAndConsumeCredits(storeId, recipientCount, `campaign:${campaignId}`);

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'sending' },
  });

  // Create recipient records
  await prisma.campaignRecipient.createMany({
    data: recipients.map(r => ({
      campaignId,
      contactId: r.contactId,
      phoneE164: r.phoneE164,
      status: 'pending',
    })),
  });

  // Queue campaign for sending
  await smsQueue.add('send-campaign', {
    campaignId,
    storeId,
    recipientCount,
  });

  logger.info('Campaign queued for sending', { storeId, campaignId, recipientCount });

  return {
    campaignId,
    recipientCount,
    status: 'sending',
    queuedAt: new Date(),
  };
}

/**
 * Schedule campaign for later
 * @param {string} storeId - Store ID
 * @param {string} campaignId - Campaign ID
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<Object>} Updated campaign
 */
export async function scheduleCampaign(storeId, campaignId, scheduleData) {
  logger.info('Scheduling campaign', { storeId, campaignId, scheduleData });

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, shopId: storeId },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  if (!scheduleData.scheduleAt) {
    throw new ValidationError('Schedule date is required');
  }

  const scheduleAt = new Date(scheduleData.scheduleAt);

  if (scheduleAt <= new Date()) {
    throw new ValidationError('Schedule date must be in the future');
  }

  // Update campaign
  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      scheduleType: scheduleData.scheduleType || 'scheduled',
      scheduleAt,
      status: 'scheduled',
    },
  });

  logger.info('Campaign scheduled successfully', { storeId, campaignId, scheduleAt });

  return updated;
}

/**
 * Get campaign metrics
 * @param {string} storeId - Store ID
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>} Campaign metrics
 */
export async function getCampaignMetrics(storeId, campaignId) {
  logger.info('Getting campaign metrics', { storeId, campaignId });

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, shopId: storeId },
    include: { metrics: true },
  });

  if (!campaign) {
    throw new NotFoundError('Campaign');
  }

  logger.info('Campaign metrics retrieved', { storeId, campaignId });

  return campaign.metrics || {
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalClicked: 0,
  };
}

/**
 * Get campaign statistics for store
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Campaign statistics
 */
export async function getCampaignStats(storeId) {
  logger.info('Getting campaign stats', { storeId });

  const [total, statusStats, recentCampaigns] = await Promise.all([
    prisma.campaign.count({ where: { shopId: storeId } }),
    prisma.campaign.groupBy({
      by: ['status'],
      where: { shopId: storeId },
      _count: { status: true },
    }),
    prisma.campaign.findMany({
      where: { shopId: storeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { metrics: true },
    }),
  ]);

  const stats = {
    total,
    byStatus: {
      draft: statusStats.find(s => s.status === 'draft')?._count?.status || 0,
      scheduled: statusStats.find(s => s.status === 'scheduled')?._count?.status || 0,
      sending: statusStats.find(s => s.status === 'sending')?._count?.status || 0,
      sent: statusStats.find(s => s.status === 'sent')?._count?.status || 0,
      failed: statusStats.find(s => s.status === 'failed')?._count?.status || 0,
      cancelled: statusStats.find(s => s.status === 'cancelled')?._count?.status || 0,
    },
    recent: recentCampaigns,
  };

  logger.info('Campaign stats retrieved', { storeId, stats });

  return stats;
}

export default {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  prepareCampaign,
  sendCampaign,
  scheduleCampaign,
  getCampaignMetrics,
  getCampaignStats,
};

