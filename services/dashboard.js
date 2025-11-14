import prisma from './prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Dashboard Service
 * Handles all dashboard-related business logic and data aggregation
 */

/**
 * Get main dashboard data (simplified for dashboard page)
 * @param {string} storeId - The store ID
 * @returns {Promise<Object>} Dashboard data
 */
export async function getDashboard(storeId) {
  logger.info('Fetching dashboard data', { storeId });

  const shop = await prisma.shop.findUnique({
    where: { id: storeId },
    select: { id: true, credits: true, currency: true },
  });

  if (!shop) {
    logger.warn('Shop not found for dashboard', { storeId });
    return {
      credits: 0,
      totalCampaigns: 0,
      totalContacts: 0,
      totalMessagesSent: 0,
    };
  }

  // Fetch stats in parallel
  const [totalCampaigns, totalContacts, totalMessagesSent] = await Promise.all([
    prisma.campaign.count({
      where: { shopId: shop.id },
    }),
    prisma.contact.count({
      where: { shopId: shop.id },
    }),
    prisma.messageLog.count({
      where: { shopId: shop.id, direction: 'outbound' },
    }),
  ]);

  logger.info('Dashboard data fetched successfully', {
    storeId,
    credits: shop.credits,
    totalCampaigns,
    totalContacts,
    totalMessagesSent,
  });

  return {
    credits: shop.credits || 0,
    totalCampaigns,
    totalContacts,
    totalMessagesSent,
  };
}

/**
 * Get comprehensive dashboard overview
 * @param {string} storeId - The store ID
 * @returns {Promise<Object>} Dashboard overview data
 */
export async function getOverview(storeId) {
  logger.info('Fetching dashboard overview', { storeId });

  const shop = await prisma.shop.findUnique({
    where: { id: storeId },
    select: { id: true, credits: true, currency: true },
  });

  if (!shop) {
    logger.warn('Shop not found for overview', { storeId });
    return {
      sms: { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 },
      contacts: { total: 0, optedIn: 0, optedOut: 0 },
      wallet: { balance: 0, currency: 'EUR' },
      recentMessages: [],
      recentTransactions: [],
    };
  }

  // Fetch all data in parallel for better performance
  const [smsStats, contactStats, recentMessages, recentTransactions] = await Promise.all([
    getSmsStats(shop.id),
    getContactStats(shop.id),
    getRecentMessages(shop.id),
    getRecentTransactions(shop.id),
  ]);

  const wallet = { balance: shop.credits || 0, currency: shop.currency };

  logger.info('Dashboard overview fetched successfully', {
    storeId,
    smsStats,
    contactStats,
  });

  return {
    sms: smsStats,
    contacts: contactStats,
    wallet,
    recentMessages,
    recentTransactions,
  };
}

/**
 * Get quick stats for dashboard
 * @param {string} storeId - The store ID
 * @returns {Promise<Object>} Quick stats data
 */
export async function getQuickStats(storeId) {
  logger.info('Fetching quick stats', { storeId });

  const shop = await prisma.shop.findUnique({
    where: { id: storeId },
    select: { id: true, credits: true },
  });

  if (!shop) {
    logger.warn('Shop not found for quick stats', { storeId });
    return { smsSent: 0, walletBalance: 0 };
  }

  const smsSent = await prisma.messageLog.count({
    where: { shopId: shop.id, direction: 'outbound' },
  });

  logger.info('Quick stats fetched successfully', { storeId, smsSent, balance: shop.credits });

  return {
    smsSent,
    walletBalance: shop.credits || 0,
  };
}

/**
 * Get SMS statistics
 * @private
 * @param {string} shopId - The shop ID
 * @returns {Promise<Object>} SMS statistics
 */
async function getSmsStats(shopId) {
  const stats = await prisma.messageLog.groupBy({
    by: ['status'],
    where: { shopId, direction: 'outbound' },
    _count: { status: true },
  });

  const sent = stats.find(s => s.status === 'sent')?._count?.status || 0;
  const delivered = stats.find(s => s.status === 'delivered')?._count?.status || 0;
  const failed = stats.find(s => s.status === 'failed')?._count?.status || 0;
  const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;

  return {
    sent,
    delivered,
    failed,
    deliveryRate: Math.round(deliveryRate * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Get contact statistics
 * @private
 * @param {string} shopId - The shop ID
 * @returns {Promise<Object>} Contact statistics
 */
async function getContactStats(shopId) {
  const stats = await prisma.contact.groupBy({
    by: ['smsConsent'],
    where: { shopId },
    _count: { smsConsent: true },
  });

  const total = stats.reduce((sum, stat) => sum + stat._count.smsConsent, 0);
  const optedIn = stats.find(s => s.smsConsent === 'opted_in')?._count?.smsConsent || 0;
  const optedOut = stats.find(s => s.smsConsent === 'opted_out')?._count?.smsConsent || 0;

  return { total, optedIn, optedOut };
}

/**
 * Get recent messages
 * @private
 * @param {string} shopId - The shop ID
 * @param {number} limit - Number of messages to fetch
 * @returns {Promise<Array>} Recent messages
 */
async function getRecentMessages(shopId, limit = 5) {
  return prisma.messageLog.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      phoneE164: true,
      status: true,
      createdAt: true,
      payload: true,
    },
  });
}

/**
 * Get recent transactions
 * @private
 * @param {string} shopId - The shop ID
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<Array>} Recent transactions
 */
async function getRecentTransactions(shopId, limit = 5) {
  return prisma.walletTransaction.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      credits: true,
      createdAt: true,
      meta: true,
    },
  });
}

export default {
  getDashboard,
  getOverview,
  getQuickStats,
};

