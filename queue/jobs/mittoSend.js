import prisma from '../../services/prisma.js';
import { sendSms } from '../../services/mitto.js';

export async function handleMittoSend(job) {
  const { campaignId, shopId, phoneE164, message, sender } = job.data;
  try {
    const res = await sendSms({ from: sender, to: phoneE164, text: message });
    const msgId = res?.message_id || res?.id || null;

    await prisma.campaignRecipient.create({
      data: {
        campaignId,
        contactId: null,
        phoneE164,
        status: 'sent',
        mittoMessageId: msgId,
        sentAt: new Date(),
      },
    });
    await prisma.messageLog.create({
      data: {
        shopId,
        phoneE164,
        direction: 'outbound',
        provider: 'mitto',
        providerMsgId: msgId,
        status: 'sent',
        campaignId,
      },
    });
    await prisma.campaignMetrics.update({
      where: { campaignId },
      data: { totalSent: { increment: 1 } },
    });
    return { ok: true, msgId };
  } catch (err) {
    await prisma.campaignRecipient.create({
      data: {
        campaignId,
        contactId: null,
        phoneE164,
        status: 'failed',
        error: String(err?.message || err),
      },
    });
    await prisma.messageLog.create({
      data: {
        shopId,
        phoneE164,
        direction: 'outbound',
        provider: 'mitto',
        status: 'failed',
        error: String(err?.message || err),
        campaignId,
      },
    });
    await prisma.campaignMetrics.update({
      where: { campaignId },
      data: { totalFailed: { increment: 1 } },
    });
    throw err;
  }
}

export default { handleMittoSend };
