import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Get predefined audiences for campaign targeting
 * GET /api/audiences
 */
export async function getAudiences(req, res, next) {
  try {
    const shopDomain = req.shop;

    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
      });
    }

    // Get contact counts for each audience type
    const [allCount, menCount, womenCount] = await Promise.all([
      // All SMS consented contacts
      prisma.contact.count({
        where: {
          shopId: shop.id,
          smsConsent: 'opted_in',
        },
      }),
      // Men with SMS consent
      prisma.contact.count({
        where: {
          shopId: shop.id,
          smsConsent: 'opted_in',
          gender: 'male',
        },
      }),
      // Women with SMS consent
      prisma.contact.count({
        where: {
          shopId: shop.id,
          smsConsent: 'opted_in',
          gender: 'female',
        },
      }),
    ]);

    // Get custom segments
    const segments = await prisma.segment.findMany({
      where: { shopId: shop.id },
      include: {
        _count: {
          select: {
            memberships: {
              where: {
                contact: {
                  smsConsent: 'opted_in',
                },
              },
            },
          },
        },
      },
    });

    // Build predefined audiences
    const audiences = [
      {
        id: 'all',
        name: 'All (SMS Consented)',
        description: 'All contacts who have opted in to receive SMS messages',
        type: 'predefined',
        contactCount: allCount,
        isAvailable: allCount > 0,
      },
      {
        id: 'men',
        name: 'Men',
        description: 'Male contacts who have opted in to receive SMS messages',
        type: 'predefined',
        contactCount: menCount,
        isAvailable: menCount > 0,
      },
      {
        id: 'women',
        name: 'Women',
        description: 'Female contacts who have opted in to receive SMS messages',
        type: 'predefined',
        contactCount: womenCount,
        isAvailable: womenCount > 0,
      },
    ];

    // Add custom segments
    const customAudiences = segments.map(segment => ({
      id: `segment:${segment.id}`,
      name: segment.name,
      description: `Custom segment: ${segment.name}`,
      type: 'segment',
      contactCount: segment._count.memberships,
      isAvailable: segment._count.memberships > 0,
      segmentId: segment.id,
    }));

    const allAudiences = [...audiences, ...customAudiences];

    logger.info('Audiences retrieved', {
      shopId: shop.id,
      totalAudiences: allAudiences.length,
      totalContacts: allCount,
    });

    res.json({
      success: true,
      data: {
        audiences: allAudiences,
        totalContacts: allCount,
        summary: {
          total: allCount,
          men: menCount,
          women: womenCount,
          segments: segments.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getAudiences', {
      shopDomain: req.shop,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get audience details including contact list (for preview)
 * GET /api/audiences/:audienceId/details
 */
export async function getAudienceDetails(req, res, next) {
  try {
    const { audienceId } = req.params;
    const shopDomain = req.shop;
    const { page = 1, limit = 50 } = req.query;

    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
      });
    }

    const whereClause = {
      shopId: shop.id,
      smsConsent: 'opted_in',
    };

    // Build audience-specific where clause
    if (audienceId === 'all') {
      // All SMS consented contacts (already set above)
    } else if (audienceId === 'men') {
      whereClause.gender = 'male';
    } else if (audienceId === 'women') {
      whereClause.gender = 'female';
    } else if (audienceId.startsWith('segment:')) {
      const segmentId = audienceId.split(':')[1];

      // Get segment members
      const memberships = await prisma.segmentMembership.findMany({
        where: {
          segmentId,
          contact: {
            smsConsent: 'opted_in',
          },
        },
        include: {
          contact: true,
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      });

      const contacts = memberships.map(m => m.contact);
      const totalCount = await prisma.segmentMembership.count({
        where: {
          segmentId,
          contact: {
            smsConsent: 'opted_in',
          },
        },
      });

      return res.json({
        success: true,
        data: {
          audienceId,
          contacts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
          },
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid audience ID',
      });
    }

    // Get contacts for predefined audiences
    const [contacts, totalCount] = await Promise.all([
      prisma.contact.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneE164: true,
          email: true,
          gender: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: {
        audienceId,
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error in getAudienceDetails', {
      audienceId: req.params.audienceId,
      shopDomain: req.shop,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Validate audience selection for campaign
 * POST /api/audiences/validate
 */
export async function validateAudience(req, res, next) {
  try {
    const { audienceId } = req.body;
    const shopDomain = req.shop;

    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found',
      });
    }

    let contactCount = 0;
    let isValid = false;
    let error = null;

    try {
      if (audienceId === 'all') {
        contactCount = await prisma.contact.count({
          where: {
            shopId: shop.id,
            smsConsent: 'opted_in',
          },
        });
        isValid = contactCount > 0;
      } else if (audienceId === 'men') {
        contactCount = await prisma.contact.count({
          where: {
            shopId: shop.id,
            smsConsent: 'opted_in',
            gender: 'male',
          },
        });
        isValid = contactCount > 0;
      } else if (audienceId === 'women') {
        contactCount = await prisma.contact.count({
          where: {
            shopId: shop.id,
            smsConsent: 'opted_in',
            gender: 'female',
          },
        });
        isValid = contactCount > 0;
      } else if (audienceId.startsWith('segment:')) {
        const segmentId = audienceId.split(':')[1];

        // Check if segment exists
        const segment = await prisma.segment.findFirst({
          where: {
            id: segmentId,
            shopId: shop.id,
          },
        });

        if (!segment) {
          error = 'Segment not found';
        } else {
          contactCount = await prisma.segmentMembership.count({
            where: {
              segmentId,
              contact: {
                smsConsent: 'opted_in',
              },
            },
          });
          isValid = contactCount > 0;
        }
      } else {
        error = 'Invalid audience ID';
      }
    } catch (err) {
      error = err.message;
    }

    res.json({
      success: true,
      data: {
        audienceId,
        isValid,
        contactCount,
        error,
      },
    });
  } catch (error) {
    logger.error('Error in validateAudience', {
      audienceId: req.body.audienceId,
      shopDomain: req.shop,
      error: error.message,
    });
    next(error);
  }
}
