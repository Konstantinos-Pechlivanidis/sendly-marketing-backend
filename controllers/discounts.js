import { getDiscountCodes, getDiscountCode } from '../services/shopify.js';
import { logger } from '../utils/logger.js';

/**
 * Get available discount codes for a shop
 * GET /api/shopify/discounts
 */
export async function getShopifyDiscounts(req, res, next) {
  try {
    const shopDomain = req.shop;

    const discountCodes = await getDiscountCodes(shopDomain);

    // Filter only active and non-expired discounts
    const activeDiscounts = discountCodes.filter(discount =>
      discount.isActive && !discount.isExpired,
    );

    logger.info('Shopify discounts retrieved', {
      shopDomain,
      total: discountCodes.length,
      active: activeDiscounts.length,
    });

    res.json({
      success: true,
      data: {
        discounts: activeDiscounts,
        total: discountCodes.length,
        active: activeDiscounts.length,
      },
    });
  } catch (error) {
    logger.error('Error in getShopifyDiscounts', {
      shopDomain: req.shop,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get a specific discount code by ID
 * GET /api/shopify/discounts/:id
 */
export async function getShopifyDiscount(req, res, next) {
  try {
    const { id } = req.params;
    const shopDomain = req.shop;

    const discount = await getDiscountCode(shopDomain, id);

    logger.info('Shopify discount retrieved', {
      shopDomain,
      discountId: id,
      title: discount.title,
    });

    res.json({
      success: true,
      data: discount,
    });
  } catch (error) {
    logger.error('Error in getShopifyDiscount', {
      shopDomain: req.shop,
      discountId: req.params.id,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Validate discount code for campaign use
 * POST /api/shopify/discounts/validate
 */
export async function validateDiscount(req, res, next) {
  try {
    const { discountId } = req.body;
    const shopDomain = req.shop;

    if (!discountId) {
      return res.status(400).json({
        success: false,
        error: 'Discount ID is required',
      });
    }

    const discount = await getDiscountCode(shopDomain, discountId);

    // Check if discount is valid for campaign use
    const isValid = discount.isActive && !discount.isExpired;
    const canUse = isValid && discount.status === 'ACTIVE';

    logger.info('Discount validation', {
      shopDomain,
      discountId,
      isValid,
      canUse,
      status: discount.status,
    });

    res.json({
      success: true,
      data: {
        discount,
        isValid,
        canUse,
        reason: !isValid ? 'Discount is not active or has expired' :
          !canUse ? 'Discount is not available for use' : null,
      },
    });
  } catch (error) {
    logger.error('Error in validateDiscount', {
      shopDomain: req.shop,
      discountId: req.body.discountId,
      error: error.message,
    });
    next(error);
  }
}
