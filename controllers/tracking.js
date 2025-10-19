import prisma from '../services/prisma.js';
import { getMessageStatus } from '../services/mitto.js';
import { logger } from '../utils/logger.js';

/**
 * Get delivery status for a specific message
 * GET /api/tracking/mitto/:messageId
 */
export async function getMittoMessageStatus(req, res, next) {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required',
      });
    }

    // Get current status from database
    const messageLog = await prisma.messageLog.findFirst({
      where: { providerMsgId: messageId },
      select: {
        id: true,
        phoneE164: true,
        status: true,
        deliveryStatus: true,
        senderNumber: true,
        createdAt: true,
        updatedAt: true,
        campaignId: true,
        campaign: {
          select: {
            name: true,
            status: true,
          },
        },
      },
    });

    if (!messageLog) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    // Fetch latest status from Mitto API
    try {
      const mittoStatus = await getMessageStatus(messageId);

      // Update database with latest status if it changed
      if (mittoStatus.deliveryStatus !== messageLog.deliveryStatus) {
        await prisma.messageLog.update({
          where: { id: messageLog.id },
          data: {
            deliveryStatus: mittoStatus.deliveryStatus,
            updatedAt: new Date(),
          },
        });

        // Update campaign recipient if exists
        if (messageLog.campaignId) {
          await prisma.campaignRecipient.updateMany({
            where: {
              campaignId: messageLog.campaignId,
              mittoMessageId: messageId,
            },
            data: {
              deliveryStatus: mittoStatus.deliveryStatus,
              deliveredAt: mittoStatus.deliveryStatus === 'Delivered' ? new Date() : null,
            },
          });

          // Update campaign metrics
          if (mittoStatus.deliveryStatus === 'Delivered') {
            await prisma.campaignMetrics.update({
              where: { campaignId: messageLog.campaignId },
              data: { totalDelivered: { increment: 1 } },
            });
          } else if (mittoStatus.deliveryStatus === 'Failed') {
            await prisma.campaignMetrics.update({
              where: { campaignId: messageLog.campaignId },
              data: { totalFailed: { increment: 1 } },
            });
          }
        }
      }

      res.json({
        success: true,
        data: {
          messageId,
          phoneE164: messageLog.phoneE164,
          status: messageLog.status,
          deliveryStatus: mittoStatus.deliveryStatus,
          senderNumber: messageLog.senderNumber,
          createdAt: messageLog.createdAt,
          updatedAt: mittoStatus.updatedAt,
          campaign: messageLog.campaign,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch status from Mitto', {
        messageId,
        error: error.message,
      });

      // Return database status if Mitto API fails
      res.json({
        success: true,
        data: {
          messageId,
          phoneE164: messageLog.phoneE164,
          status: messageLog.status,
          deliveryStatus: messageLog.deliveryStatus,
          senderNumber: messageLog.senderNumber,
          createdAt: messageLog.createdAt,
          updatedAt: messageLog.updatedAt,
          campaign: messageLog.campaign,
          warning: 'Status may not be up-to-date due to API error',
        },
      });
    }
  } catch (error) {
    logger.error('Error in getMittoMessageStatus', {
      messageId: req.params.messageId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get delivery status for all messages in a campaign
 * GET /api/tracking/campaign/:campaignId
 */
export async function getCampaignDeliveryStatus(req, res, next) {
  try {
    const { campaignId } = req.params;
    const shopDomain = req.shop;

    // Verify campaign belongs to shop
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        shop: { shopDomain },
      },
      include: {
        metrics: true,
        recipients: {
          select: {
            id: true,
            phoneE164: true,
            status: true,
            deliveryStatus: true,
            senderNumber: true,
            sentAt: true,
            deliveredAt: true,
            error: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    // Get delivery statistics
    const stats = {
      total: campaign.recipients.length,
      sent: campaign.recipients.filter(r => r.status === 'sent').length,
      delivered: campaign.recipients.filter(r => r.deliveryStatus === 'Delivered').length,
      failed: campaign.recipients.filter(r => r.deliveryStatus === 'Failed').length,
      queued: campaign.recipients.filter(r => r.deliveryStatus === 'Queued').length,
      pending: campaign.recipients.filter(r => !r.deliveryStatus || r.deliveryStatus === 'Queued').length,
    };

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          createdAt: campaign.createdAt,
        },
        metrics: campaign.metrics,
        recipients: campaign.recipients,
        statistics: stats,
      },
    });
  } catch (error) {
    logger.error('Error in getCampaignDeliveryStatus', {
      campaignId: req.params.campaignId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Bulk update delivery status for multiple messages
 * POST /api/tracking/bulk-update
 */
export async function bulkUpdateDeliveryStatus(req, res, next) {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message IDs array is required',
      });
    }

    const results = [];

    for (const messageId of messageIds) {
      try {
        const mittoStatus = await getMessageStatus(messageId);

        // Update message log
        await prisma.messageLog.updateMany({
          where: { providerMsgId: messageId },
          data: {
            deliveryStatus: mittoStatus.deliveryStatus,
            updatedAt: new Date(),
          },
        });

        // Update campaign recipient
        const recipient = await prisma.campaignRecipient.findFirst({
          where: { mittoMessageId: messageId },
        });

        if (recipient) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              deliveryStatus: mittoStatus.deliveryStatus,
              deliveredAt: mittoStatus.deliveryStatus === 'Delivered' ? new Date() : null,
            },
          });
        }

        results.push({
          messageId,
          deliveryStatus: mittoStatus.deliveryStatus,
          success: true,
        });
      } catch (error) {
        logger.error('Failed to update message status', {
          messageId,
          error: error.message,
        });

        results.push({
          messageId,
          error: error.message,
          success: false,
        });
      }
    }

    res.json({
      success: true,
      data: {
        updated: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      },
    });
  } catch (error) {
    logger.error('Error in bulkUpdateDeliveryStatus', {
      error: error.message,
    });
    next(error);
  }
}
