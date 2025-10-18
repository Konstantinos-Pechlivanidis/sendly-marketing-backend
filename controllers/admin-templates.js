import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new template (admin only)
 */
export async function createTemplate(req, res) {
  try {
    const { title, category, content, previewImage, tags = [] } = req.body;

    // Validate required fields
    if (!title || !category || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Title, category, and content are required',
      });
    }

    const template = await prisma.template.create({
      data: {
        title,
        category,
        content,
        previewImage,
        tags,
        isPublic: true, // Templates are public by default
      },
    });

    logger.info('Template created', {
      templateId: template.id,
      title: template.title,
      category: template.category,
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error) {
    logger.error('Failed to create template', {
      error: error.message,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error.message,
    });
  }
}

/**
 * Update a template (admin only)
 */
export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { title, category, content, previewImage, tags, isPublic } = req.body;

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: 'The requested template does not exist',
      });
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(category !== undefined && { category }),
        ...(content !== undefined && { content }),
        ...(previewImage !== undefined && { previewImage }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    logger.info('Template updated', {
      templateId: template.id,
      title: template.title,
      category: template.category,
    });

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update template', {
      error: error.message,
      templateId: req.params.id,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update template',
      message: error.message,
    });
  }
}

/**
 * Delete a template (admin only)
 */
export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: 'The requested template does not exist',
      });
    }

    // Delete template (cascade will handle related records)
    await prisma.template.delete({
      where: { id },
    });

    logger.info('Template deleted', {
      templateId: id,
      title: existingTemplate.title,
    });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete template', {
      error: error.message,
      templateId: req.params.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      message: error.message,
    });
  }
}

/**
 * Get all templates (including private ones) for admin management
 */
export async function getAllTemplatesAdmin(req, res) {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    // Build where clause for filtering
    const where = {};

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
        include: {
          usage: {
            select: {
              shopId: true,
              usedCount: true,
              lastUsedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.template.count({ where }),
    ]);

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
      },
    });
  } catch (error) {
    logger.error('Failed to fetch templates for admin', {
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
 * Get template usage statistics
 */
export async function getTemplateStats(req, res) {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        usage: {
          select: {
            usedCount: true,
            lastUsedAt: true,
            shop: {
              select: {
                shopDomain: true,
              },
            },
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: 'The requested template does not exist',
      });
    }

    const totalUsage = template.usage.reduce((sum, usage) => sum + usage.usedCount, 0);
    const uniqueShops = template.usage.length;

    res.json({
      success: true,
      data: {
        template: {
          id: template.id,
          title: template.title,
          category: template.category,
        },
        stats: {
          totalUsage,
          uniqueShops,
          usage: template.usage,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch template stats', {
      error: error.message,
      templateId: req.params.id,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch template statistics',
      message: error.message,
    });
  }
}

export default {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplatesAdmin,
  getTemplateStats,
};
