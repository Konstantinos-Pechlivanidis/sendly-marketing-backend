import prisma from '../services/prisma.js';
import { smsQueue } from '../queue/index.js';
import { getStoreId } from '../middlewares/store-resolution.js';
import { validateAndConsumeCredits, InsufficientCreditsError } from '../services/credit-validation.js';
import { logger } from '../utils/logger.js';

function normalizeAudienceQuery(audience) {
  // supports 'all' | 'men' | 'women' | 'segment:<id>'
  if (!audience || audience === 'all') return { smsConsent: 'opted_in' };
  if (audience === 'men') return { smsConsent: 'opted_in', gender: 'male' };
  if (audience === 'women') return { smsConsent: 'opted_in', gender: 'female' };
  if (audience.startsWith('segment:')) return null; // handle separately
  return { smsConsent: 'opted_in' };
}

async function resolveRecipients(shopId, audience) {
  const base = normalizeAudienceQuery(audience);
  if (base) {
    const contacts = await prisma.contact.findMany({ where: { shopId, ...base } });
    return contacts.map((c) => ({ contactId: c.id, phoneE164: c.phoneE164 }));
  }
  // segment:<id>
  const segId = audience.split(':')[1];
  const members = await prisma.segmentMembership.findMany({
    where: { segmentId: segId },
    include: { contact: true },
  });
  return members
    .filter((m) => m.contact?.smsConsent === 'opted_in')
    .map((m) => ({ contactId: m.contactId, phoneE164: m.contact.phoneE164 }));
}

export async function list(req, res, next) {
  try {
    const shopDomain = req.shop;
    const shop = await prisma.shop.findUnique({ where: { shopDomain } });
    const rows = await prisma.campaign.findMany({
      where: { shopId: shop?.id || '' },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { campaigns: rows, total: rows.length } });
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const row = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { recipients: true, metrics: true },
    });
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const shopDomain = req.shop;
    const shop =
      (await prisma.shop.findUnique({ where: { shopDomain } })) ||
      (await prisma.shop.create({ data: { shopDomain } }));
    const payload = req.body || {};
    const row = await prisma.campaign.create({
      data: {
        shopId: shop.id,
        name: payload.name || 'Untitled',
        message: payload.message || '',
        audience: payload.audience || 'all',
        discountId: payload.discountId || null,
        scheduleType: payload.scheduleType || 'immediate',
        scheduleAt: payload.scheduleAt ? new Date(payload.scheduleAt) : null,
        recurringDays: payload.recurringDays || null,
        status: 'draft',
      },
    });
    await prisma.campaignMetrics.create({ data: { campaignId: row.id } });
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const payload = req.body || {};
    const row = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        name: payload.name,
        message: payload.message,
        audience: payload.audience,
        discountId: payload.discountId || null,
        scheduleType: payload.scheduleType,
        scheduleAt: payload.scheduleAt ? new Date(payload.scheduleAt) : null,
        recurringDays: payload.recurringDays || null,
      },
    });
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

export async function prepare(req, res, next) {
  try {
    res.json({ success: true, data: { prepared: true } });
  } catch (e) {
    next(e);
  }
}

export async function sendNow(req, res, next) {
  try {
    // const shopDomain = req.shop; // Not used in current implementation
    const campaignId = req.params.id;
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('campaign_not_found');
    if (!campaign.message) throw new Error('missing_message');

    const recipients = await resolveRecipients(campaign.shopId, campaign.audience);
    if (recipients.length === 0) {
      return res.json({ success: true, data: { queued: false, reason: 'no_contacts' } });
    }

    // Validate and consume credits
    const storeId = getStoreId(req);
    try {
      const creditResult = await validateAndConsumeCredits(storeId, recipients.length);
      logger.info('Credits validated and consumed for campaign', {
        campaignId,
        storeId,
        creditsConsumed: creditResult.creditsConsumed,
        creditsRemaining: creditResult.creditsRemaining,
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient credits',
          message: error.message,
          missingCredits: error.missingCredits,
        });
      }
      throw error;
    }

    // status -> sending
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'sending' } });

    const sender = process.env.MITTO_SENDER_NAME || 'Sendly';

    // enqueue jobs
    for (const r of recipients) {
      await prisma.campaignRecipient.create({
        data: {
          campaignId,
          contactId: r.contactId,
          phoneE164: r.phoneE164,
          status: 'queued',
        },
      });
      await smsQueue.add('mittoSend', {
        campaignId,
        shopId: campaign.shopId,
        phoneE164: r.phoneE164,
        message: campaign.message,
        sender,
      });
    }

    res.json({ success: true, data: { queued: true, recipients: recipients.length } });
  } catch (e) {
    next(e);
  }
}

export async function schedule(req, res, next) {
  try {
    const payload = req.body || {};
    const row = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        scheduleType: payload.scheduleType || 'scheduled',
        scheduleAt: payload.scheduleAt ? new Date(payload.scheduleAt) : null,
        status: 'scheduled',
      },
    });
    res.json({ success: true, data: { scheduled: true, campaign: row } });
  } catch (e) {
    next(e);
  }
}

export async function metrics(req, res, next) {
  try {
    const m = await prisma.campaignMetrics.findUnique({ where: { campaignId: req.params.id } });
    res.json({ success: true, data: m || {} });
  } catch (e) {
    next(e);
  }
}

export async function stats(req, res, next) {
  try {
    const shopDomain = req.shop;
    const shop = await prisma.shop.findUnique({ where: { shopDomain } });
    const count = await prisma.campaign.count({ where: { shopId: shop?.id || '' } });
    res.json({ success: true, data: { count } });
  } catch (e) {
    next(e);
  }
}
