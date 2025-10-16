import prisma from '../server/services/prisma.js';
import { logger } from '../server/utils/logger.js';

const smsPackages = [
  {
    name: 'Starter Pack',
    credits: 100,
    priceCents: 990, // €9.90
    currency: 'EUR',
    description: 'Perfect for small businesses getting started',
    features: ['100 SMS credits', 'Basic analytics', 'Email support'],
    isPopular: false,
    isActive: true
  },
  {
    name: 'Growth Pack',
    credits: 500,
    priceCents: 3990, // €39.90
    currency: 'EUR',
    description: 'Ideal for growing businesses',
    features: ['500 SMS credits', 'Advanced analytics', 'Priority support'],
    isPopular: true,
    isActive: true
  },
  {
    name: 'Business Pack',
    credits: 1000,
    priceCents: 6990, // €69.90
    currency: 'EUR',
    description: 'For established businesses',
    features: ['1000 SMS credits', 'Full analytics', 'Phone support'],
    isPopular: false,
    isActive: true
  },
  {
    name: 'Enterprise Pack',
    credits: 2500,
    priceCents: 14990, // €149.90
    currency: 'EUR',
    description: 'For high-volume businesses',
    features: ['2500 SMS credits', 'Custom analytics', 'Dedicated support'],
    isPopular: false,
    isActive: true
  },
  {
    name: 'Mega Pack',
    credits: 5000,
    priceCents: 24990, // €249.90
    currency: 'EUR',
    description: 'Maximum value for power users',
    features: ['5000 SMS credits', 'White-label options', 'API access'],
    isPopular: false,
    isActive: true
  },
  {
    name: 'Trial Pack',
    credits: 10,
    priceCents: 0, // Free trial
    currency: 'EUR',
    description: 'Free trial to test our service',
    features: ['10 SMS credits', 'Basic features', '7-day trial'],
    isPopular: false,
    isActive: true
  }
];

async function seedPackages() {
  try {
    logger.info('Starting SMS packages seeding...');

    let totalCreated = 0;
    let totalUpdated = 0;

    for (const packageData of smsPackages) {
      try {
        // Check if package already exists
        const existing = await prisma.smsPackage.findFirst({
          where: {
            name: packageData.name
          }
        });

        if (existing) {
          // Update existing package
          await prisma.smsPackage.update({
            where: { id: existing.id },
            data: {
              credits: packageData.credits,
              priceCents: packageData.priceCents,
              currency: packageData.currency,
              description: packageData.description,
              features: packageData.features,
              isPopular: packageData.isPopular,
              isActive: packageData.isActive,
              updatedAt: new Date()
            }
          });
          totalUpdated++;
          logger.info(`Updated package: ${packageData.name}`);
        } else {
          // Create new package
          await prisma.smsPackage.create({
            data: {
              name: packageData.name,
              credits: packageData.credits,
              priceCents: packageData.priceCents,
              currency: packageData.currency,
              description: packageData.description,
              features: packageData.features,
              isPopular: packageData.isPopular,
              isActive: packageData.isActive,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          totalCreated++;
          logger.info(`Created package: ${packageData.name}`);
        }
      } catch (error) {
        logger.error(`Error processing package '${packageData.name}':`, error);
      }
    }

    logger.info(`Package seeding completed. Created ${totalCreated} new packages, updated ${totalUpdated} existing packages.`);
    
    return {
      success: true,
      message: `Created ${totalCreated} new packages, updated ${totalUpdated} existing packages`,
      totalCreated,
      totalUpdated
    };

  } catch (error) {
    logger.error('Error seeding packages:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPackages()
    .then((result) => {
      console.log('Package seeding result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Package seeding failed:', error);
      process.exit(1);
    });
}

export default seedPackages;
