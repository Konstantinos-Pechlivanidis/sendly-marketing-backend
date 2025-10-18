import prisma from './prisma.js';
import { logger } from '../utils/logger.js';
import { getCreditUsageStats } from './credit-validation.js';
import { getCachedReport, cacheReport } from './reports-cache.js';

/**
 * Reports Service
 *
 * Centralized service for generating analytics and reports
 * Provides real-time data aggregation with proper store scoping
 */

/**
 * Get campaign performance metrics
 * @param {string} storeId - Store ID
 * @param {Object} filters - Date range and other filters
 * @returns {Promise<Object>} Campaign performance data
 */
export async function getCampaignPerformance(storeId, filters = {}) {
  const { from, to, status, type } = filters;

  try {
    // Build where clause
    const whereClause = {
      shopId: storeId,
      ...(from && to && {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      }),
      ...(status && { status }),
      ...(type && { type }),
    };

    // Get campaign counts and basic stats
    const campaignStats = await prisma.campaign.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true },
    });

    // Get message logs for campaigns
    const messageStats = await prisma.messageLog.groupBy({
      by: ['status'],
      where: {
        shopId: storeId,
        campaignId: { not: null },
        ...(from && to && {
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
      },
      _count: { status: true },
    });

    const sent = messageStats.find(s => s.status === 'sent')?._count?.status || 0;
    const delivered = messageStats.find(s => s.status === 'delivered')?._count?.status || 0;
    const failed = messageStats.find(s => s.status === 'failed')?._count?.status || 0;
    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;

    // Get top performing campaigns
    const topCampaigns = await prisma.campaign.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            messages: {
              where: { status: 'delivered' },
            },
          },
        },
      },
      orderBy: {
        messages: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    // Get daily message trends
    const dailyTrends = await prisma.messageLog.groupBy({
      by: ['createdAt'],
      where: {
        shopId: storeId,
        campaignId: { not: null },
        ...(from && to && {
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
      },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return {
      summary: {
        totalCampaigns: campaignStats.reduce((sum, stat) => sum + stat._count.id, 0),
        totalMessages: sent,
        delivered,
        failed,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        creditsUsed: sent,
      },
      topPerformers: topCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        delivered: campaign._count.messages,
        createdAt: campaign.createdAt,
      })),
      trends: dailyTrends.map(trend => ({
        date: trend.createdAt.toISOString().split('T')[0],
        messages: trend._count.id,
      })),
      statusBreakdown: campaignStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
      })),
    };
  } catch (error) {
    logger.error('Failed to get campaign performance', { storeId, error: error.message });
    throw error;
  }
}

/**
 * Get automation insights and performance
 * @param {string} storeId - Store ID
 * @param {Object} filters - Date range and other filters
 * @returns {Promise<Object>} Automation insights data
 */
export async function getAutomationInsights(storeId, filters = {}) {
  const { from, to } = filters;

  try {
    // Get automation logs
    const automationLogs = await prisma.automationLog.findMany({
      where: {
        storeId,
        ...(from && to && {
          triggeredAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
      },
    });

    // Get user automations
    const userAutomations = await prisma.userAutomation.findMany({
      where: { shopId: storeId },
      include: {
        automation: {
          select: {
            title: true,
            triggerEvent: true,
          },
        },
      },
    });

    // Group by status
    const statusBreakdown = automationLogs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    // Group by automation type (we'll use automationId as a proxy for now)
    const typeBreakdown = automationLogs.reduce((acc, log) => {
      const type = log.automationId || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Get daily trends
    const dailyTrends = automationLogs.reduce((acc, log) => {
      const date = log.triggeredAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalTriggered: automationLogs.length,
        totalActive: userAutomations.filter(ua => ua.isActive).length,
        totalInactive: userAutomations.filter(ua => !ua.isActive).length,
        completionRate: automationLogs.length > 0
          ? Math.round((statusBreakdown.sent || 0) / automationLogs.length * 100)
          : 0,
      },
      statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({
        status,
        count,
      })),
      typeBreakdown: Object.entries(typeBreakdown).map(([type, count]) => ({
        type,
        count,
      })),
      trends: Object.entries(dailyTrends).map(([date, count]) => ({
        date,
        triggered: count,
      })),
      activeAutomations: userAutomations.map(ua => ({
        id: ua.id,
        title: ua.automation.title,
        triggerEvent: ua.automation.triggerEvent,
        isActive: ua.isActive,
        userMessage: ua.userMessage,
      })),
    };
  } catch (error) {
    logger.error('Failed to get automation insights', { storeId, error: error.message });
    throw error;
  }
}

/**
 * Get credit usage analytics
 * @param {string} storeId - Store ID
 * @param {Object} filters - Date range and other filters
 * @returns {Promise<Object>} Credit usage data
 */
export async function getCreditUsage(storeId, filters = {}) {
  const { from, to, usageType } = filters;

  try {
    // Get credit usage stats
    const creditStats = await getCreditUsageStats(storeId);

    // Get billing transactions
    const billingTransactions = await prisma.billingTransaction.findMany({
      where: {
        shopId: storeId,
        ...(from && to && {
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get message logs for credit usage breakdown
    const messageLogs = await prisma.messageLog.findMany({
      where: {
        shopId: storeId,
        ...(from && to && {
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
        ...(usageType && usageType !== 'all' && {
          ...(usageType === 'campaign' && { campaignId: { not: null } }),
          ...(usageType === 'manual' && { campaignId: null }),
        }),
      },
      select: {
        id: true,
        createdAt: true,
        campaignId: true,
        status: true,
      },
    });

    // Group by usage type
    const usageBreakdown = messageLogs.reduce((acc, log) => {
      let type = 'manual';
      if (log.campaignId) type = 'campaign';

      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Get daily usage trends
    const dailyUsage = messageLogs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Calculate average usage
    const totalDays = from && to
      ? Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24))
      : 30;
    const avgDailyUsage = totalDays > 0 ? Math.round(messageLogs.length / totalDays) : 0;

    return {
      summary: {
        totalCredits: creditStats.totalCredits,
        usedCredits: creditStats.usedCredits,
        remainingCredits: creditStats.remainingCredits,
        avgDailyUsage,
        totalPurchases: billingTransactions.length,
      },
      usageBreakdown: Object.entries(usageBreakdown).map(([type, count]) => ({
        type,
        count,
        percentage: messageLogs.length > 0 ? Math.round((count / messageLogs.length) * 100) : 0,
      })),
      trends: Object.entries(dailyUsage).map(([date, count]) => ({
        date,
        creditsUsed: count,
      })),
      recentPurchases: billingTransactions.slice(0, 5).map(transaction => ({
        id: transaction.id,
        creditsAdded: transaction.creditsAdded,
        amount: transaction.amount,
        currency: transaction.currency,
        packageType: transaction.packageType,
        createdAt: transaction.createdAt,
      })),
    };
  } catch (error) {
    logger.error('Failed to get credit usage', { storeId, error: error.message });
    throw error;
  }
}

/**
 * Get contact and audience insights
 * @param {string} storeId - Store ID
 * @param {Object} filters - Date range and other filters
 * @returns {Promise<Object>} Contact insights data
 */
export async function getContactInsights(storeId, filters = {}) {
  const { from, to } = filters;

  try {
    // Get contact stats
    const contactStats = await prisma.contact.groupBy({
      by: ['smsConsent', 'gender'],
      where: {
        shopId: storeId,
        ...(from && to && {
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
      },
      _count: { id: true },
    });

    // Get total contacts
    const totalContacts = await prisma.contact.count({
      where: { shopId: storeId },
    });

    // Get opted-in contacts
    const optedInContacts = await prisma.contact.count({
      where: {
        shopId: storeId,
        smsConsent: 'opted_in',
      },
    });

    // Get gender distribution
    const genderStats = await prisma.contact.groupBy({
      by: ['gender'],
      where: {
        shopId: storeId,
        gender: { not: null },
      },
      _count: { gender: true },
    });

    // Get contacts with birthdays (for automation insights)
    const birthdayContacts = await prisma.contact.count({
      where: {
        shopId: storeId,
        birthDate: { not: null },
      },
    });

    // Get recent contacts (last 30 days)
    const recentContacts = await prisma.contact.count({
      where: {
        shopId: storeId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Get engagement data (contacts who received messages)
    // Since Contact doesn't have direct relation to MessageLog, we'll use a different approach
    const messageLogs = await prisma.messageLog.findMany({
      where: {
        shopId: storeId,
        status: 'delivered',
        direction: 'outbound',
      },
      select: {
        phoneE164: true,
      },
    });

    const engagedContacts = new Set(messageLogs.map(log => log.phoneE164)).size;

    return {
      summary: {
        totalContacts,
        optedInContacts,
        optedOutContacts: totalContacts - optedInContacts,
        consentRate: totalContacts > 0 ? Math.round((optedInContacts / totalContacts) * 100) : 0,
        birthdayContacts,
        recentContacts,
        engagedContacts,
        engagementRate: totalContacts > 0 ? Math.round((engagedContacts / totalContacts) * 100) : 0,
      },
      genderDistribution: genderStats.map(stat => ({
        gender: stat.gender || 'unknown',
        count: stat._count.gender,
        percentage: totalContacts > 0 ? Math.round((stat._count.gender / totalContacts) * 100) : 0,
      })),
      consentBreakdown: contactStats
        .filter(stat => stat.smsConsent)
        .reduce((acc, stat) => {
          acc[stat.smsConsent] = (acc[stat.smsConsent] || 0) + stat._count.id;
          return acc;
        }, {}),
    };
  } catch (error) {
    logger.error('Failed to get contact insights', { storeId, error: error.message });
    throw error;
  }
}

/**
 * Get KPIs dashboard data
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} KPIs data
 */
export async function getKPIs(storeId) {
  try {
    // Check cache first
    const cached = await getCachedReport(storeId, 'kpis');
    if (cached) {
      return cached;
    }

    // Get basic counts
    const [campaigns, contacts, automations, creditStats] = await Promise.all([
      prisma.campaign.count({ where: { shopId: storeId } }),
      prisma.contact.count({ where: { shopId: storeId } }),
      prisma.userAutomation.count({ where: { shopId: storeId, isActive: true } }),
      getCreditUsageStats(storeId),
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentCampaigns, recentMessages, recentAutomations] = await Promise.all([
      prisma.campaign.count({
        where: {
          shopId: storeId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.messageLog.count({
        where: {
          shopId: storeId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.automationLog.count({
        where: {
          storeId,
          triggeredAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    const result = {
      overview: {
        totalCampaigns: campaigns,
        totalContacts: contacts,
        activeAutomations: automations,
        creditsRemaining: creditStats.remainingCredits,
      },
      recentActivity: {
        campaigns: recentCampaigns,
        messages: recentMessages,
        automations: recentAutomations,
      },
      health: {
        creditStatus: creditStats.remainingCredits > 100 ? 'healthy' : 'low',
        contactGrowth: recentCampaigns > 0 ? 'active' : 'inactive',
        automationHealth: recentAutomations > 0 ? 'active' : 'inactive',
      },
    };

    // Cache the result
    await cacheReport(storeId, 'kpis', {}, result);

    return result;
  } catch (error) {
    logger.error('Failed to get KPIs', { storeId, error: error.message });
    throw error;
  }
}

export default {
  getCampaignPerformance,
  getAutomationInsights,
  getCreditUsage,
  getContactInsights,
  getKPIs,
};
