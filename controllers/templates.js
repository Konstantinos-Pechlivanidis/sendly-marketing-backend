import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Get all public templates with optional category filter
 */
export async function getAllTemplates(req, res) {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    // Build where clause for filtering
    const where = {
      isPublic: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Get templates with pagination
    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        select: {
          id: true,
          title: true,
          category: true,
          content: true,
          previewImage: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.template.count({ where }),
    ]);

    // Get unique categories for filter options
    const categories = await prisma.template.findMany({
      where: { isPublic: true },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total,
        },
        categories: categories.map(c => c.category),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch templates', {
      error: error.message,
      query: req.query,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: error.message,
    });
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(req, res) {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        isPublic: true,
      },
      select: {
        id: true,
        title: true,
        category: true,
        content: true,
        previewImage: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: 'The requested template does not exist or is not public',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Failed to fetch template', {
      error: error.message,
      templateId: req.params.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
      message: error.message,
    });
  }
}

/**
 * Get template categories
 */
export async function getTemplateCategories(req, res) {
  try {
    const categories = await prisma.template.findMany({
      where: { isPublic: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    res.json({
      success: true,
      data: categories.map(c => c.category),
    });
  } catch (error) {
    logger.error('Failed to fetch template categories', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch template categories',
      message: error.message,
    });
  }
}

/**
 * Track template usage (for analytics)
 */
export async function trackTemplateUsage(req, res) {
  try {
    const { templateId } = req.params;
    const { shopId } = req.shop || {};

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Shop ID required',
        message: 'Shop context is required to track template usage',
      });
    }

    // Check if template exists and is public
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        isPublic: true,
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: 'The requested template does not exist or is not public',
      });
    }

    // Upsert template usage record
    await prisma.templateUsage.upsert({
      where: {
        shopId_templateId: {
          shopId,
          templateId,
        },
      },
      update: {
        usedCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
      create: {
        shopId,
        templateId,
        usedCount: 1,
        lastUsedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Template usage tracked',
    });
  } catch (error) {
    logger.error('Failed to track template usage', {
      error: error.message,
      templateId: req.params.templateId,
      shopId: req.shop?.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to track template usage',
      message: error.message,
    });
  }
}

export default {
  getAllTemplates,
  getTemplateById,
  getTemplateCategories,
  trackTemplateUsage,
};
