import prisma from '../../services/prisma.js';

/**
 * Test Database Utilities
 * Database operations for testing
 */

/**
 * Clean database before tests
 */
export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await prisma.campaignRecipient.deleteMany({});
  await prisma.messageLog.deleteMany({});
  await prisma.campaignMetrics.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.segmentMembership.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.billingTransaction.deleteMany({});
  await prisma.automationLog.deleteMany({});
  await prisma.userAutomation.deleteMany({});
  await prisma.queueJob.deleteMany({});
  await prisma.shopifySession.deleteMany({});
  await prisma.rateLimitRecord.deleteMany({});
  await prisma.shopSettings.deleteMany({});
  await prisma.shop.deleteMany({});
  await prisma.templateUsage.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.automation.deleteMany({});
}

/**
 * Verify contact exists in database
 */
export async function verifyContactInDb(contactId, expectedData) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  expect(contact).toBeTruthy();

  if (expectedData) {
    Object.keys(expectedData).forEach(key => {
      expect(contact[key]).toEqual(expectedData[key]);
    });
  }

  return contact;
}

/**
 * Verify campaign exists in database
 */
export async function verifyCampaignInDb(campaignId, expectedData) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      metrics: true,
    },
  });

  expect(campaign).toBeTruthy();

  if (expectedData) {
    Object.keys(expectedData).forEach(key => {
      expect(campaign[key]).toEqual(expectedData[key]);
    });
  }

  return campaign;
}

/**
 * Verify wallet transaction exists
 */
export async function verifyWalletTransactionInDb(shopId, expectedData) {
  const transaction = await prisma.walletTransaction.findFirst({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
  });

  expect(transaction).toBeTruthy();

  if (expectedData) {
    Object.keys(expectedData).forEach(key => {
      expect(transaction[key]).toEqual(expectedData[key]);
    });
  }

  return transaction;
}

/**
 * Verify shop credits updated
 */
export async function verifyShopCredits(shopId, expectedCredits) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { credits: true },
  });

  expect(shop.credits).toBe(expectedCredits);
  return shop.credits;
}

/**
 * Verify billing transaction exists
 */
export async function verifyBillingTransactionInDb(shopId, expectedData) {
  const transaction = await prisma.billingTransaction.findFirst({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
  });

  expect(transaction).toBeTruthy();

  if (expectedData) {
    Object.keys(expectedData).forEach(key => {
      expect(transaction[key]).toEqual(expectedData[key]);
    });
  }

  return transaction;
}

/**
 * Count records in database
 */
export async function countRecords(model, where = {}) {
  return await prisma[model].count({ where });
}

export default {
  cleanDatabase,
  verifyContactInDb,
  verifyCampaignInDb,
  verifyWalletTransactionInDb,
  verifyBillingTransactionInDb,
  verifyShopCredits,
  countRecords,
};

