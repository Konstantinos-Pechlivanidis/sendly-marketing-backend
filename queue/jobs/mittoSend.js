import prisma from '../../services/prisma.js';
import { sendSms, MittoApiError, ValidationError } from '../../services/mitto.js';
import { logger } from '../../utils/logger.js';

export async function handleMittoSend(job) {
  const { campaignId, shopId, phoneE164, message, sender } = job.data;

  try {
    // Use new SMS service with updated API
    const res = await sendSms({
      to: phoneE164,
      text: message,
      senderOverride: sender,
      shopId,
    });

    const msgId = res?.messageId || null;

    // Create campaign recipient record with sender info
    await prisma.campaignRecipient.create({
      data: {
        campaignId,
        contactId: null,
        phoneE164,
        status: 'sent',
        mittoMessageId: msgId,
        sentAt: new Date(),
        senderNumber: sender,
        deliveryStatus: 'Queued', // Initial status from Mitto
      },
    });

    // Create message log with sender info
    await prisma.messageLog.create({
      data: {
        shopId,
        phoneE164,
        direction: 'outbound',
        provider: 'mitto',
        providerMsgId: msgId,
        status: 'sent',
        campaignId,
        senderNumber: sender,
        deliveryStatus: 'Queued',
      },
    });

    // Update campaign metrics
    await prisma.campaignMetrics.update({
      where: { campaignId },
      data: { totalSent: { increment: 1 } },
    });

    logger.info('SMS sent successfully via queue', {
      campaignId,
      phoneE164,
      msgId,
    });

    return { ok: true, msgId };
  } catch (err) {
    const errorMessage = err?.message || String(err);
    const errorType = err instanceof ValidationError ? 'validation' :
      err instanceof MittoApiError ? 'api' : 'unknown';

    logger.error('SMS send failed via queue', {
      campaignId,
      phoneE164,
      error: errorMessage,
      errorType,
    });

    // Create failed campaign recipient record
    await prisma.campaignRecipient.create({
      data: {
        campaignId,
        contactId: null,
        phoneE164,
        status: 'failed',
        error: errorMessage,
      },
    });

    // Create failed message log
    await prisma.messageLog.create({
      data: {
        shopId,
        phoneE164,
        direction: 'outbound',
        provider: 'mitto',
        status: 'failed',
        error: errorMessage,
        campaignId,
      },
    });

    // Update campaign metrics
    await prisma.campaignMetrics.update({
      where: { campaignId },
      data: { totalFailed: { increment: 1 } },
    });

    throw err;
  }
}

export default { handleMittoSend };
