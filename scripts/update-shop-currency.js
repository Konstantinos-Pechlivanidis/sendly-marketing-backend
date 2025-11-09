/* eslint-disable no-console */
/**
 * Update Shop Currency to EUR
 * Updates sms-blossom-dev.myshopify.com shop currency to EUR
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

const DEV_STORE_DOMAIN = 'sms-blossom-dev.myshopify.com';

async function updateShopCurrency() {
  try {
    console.log('🔄 Updating shop currency to EUR...');
    console.log(`📦 Store: ${DEV_STORE_DOMAIN}`);

    const store = await prisma.shop.update({
      where: { shopDomain: DEV_STORE_DOMAIN },
      data: {
        currency: 'EUR',
        settings: {
          update: {
            currency: 'EUR',
          },
        },
      },
      include: { settings: true },
    });

    console.log('✅ Shop currency updated to EUR');
    console.log(`   Domain: ${store.shopDomain}`);
    console.log(`   Currency: ${store.currency}`);
    console.log(`   Settings Currency: ${store.settings?.currency}`);

    logger.info('Shop currency updated', {
      shopDomain: store.shopDomain,
      currency: store.currency,
    });

    return store;
  } catch (error) {
    console.error('❌ Error updating shop currency:', error);
    logger.error('Failed to update shop currency', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
updateShopCurrency()
  .then(() => {
    console.log('\n🎉 Currency update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Currency update failed:', error);
    console.error(error.stack);
    process.exit(1);
  });

export default updateShopCurrency;

