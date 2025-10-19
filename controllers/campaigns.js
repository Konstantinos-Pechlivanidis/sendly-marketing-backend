import { getStoreId } from '../middlewares/store-resolution.js';
import { logger } from '../utils/logger.js';
import campaignsService from '../services/campaigns.js';

/**
 * Campaigns Controller
 * Uses service layer for all campaign management logic
 */

/**
 * List campaigns with optional filtering
 * @route GET /campaigns
 */
export async function list(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const filters = {
      page: req.query.page,
      pageSize: req.query.pageSize,
      status: req.query.status,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const result = await campaignsService.listCampaigns(storeId, filters);

    return res.json({
      success: true,
      data: {
        campaigns: result.campaigns,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error('List campaigns error', {
      error: error.message,
      storeId: getStoreId(req),
      query: req.query,
    });
    next(error);
  }
}

/**
 * Get a single campaign by ID
 * @route GET /campaigns/:id
 */
export async function getOne(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    const campaign = await campaignsService.getCampaignById(storeId, id);

    return res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error('Get campaign error', {
      error: error.message,
      storeId: getStoreId(req),
      campaignId: req.params.id,
    });
    next(error);
  }
}

/**
 * Create a new campaign
 * @route POST /campaigns
 */
export async function create(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const campaignData = req.body;

    const campaign = await campaignsService.createCampaign(storeId, campaignData);

    return res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    });
  } catch (error) {
    logger.error('Create campaign error', {
      error: error.message,
      storeId: getStoreId(req),
      body: req.body,
    });
    next(error);
  }
}

/**
 * Update a campaign
 * @route PUT /campaigns/:id
 */
export async function update(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;
    const campaignData = req.body;

    const campaign = await campaignsService.updateCampaign(storeId, id, campaignData);

    return res.json({
      success: true,
      data: campaign,
      message: 'Campaign updated successfully',
    });
  } catch (error) {
    logger.error('Update campaign error', {
      error: error.message,
      storeId: getStoreId(req),
      campaignId: req.params.id,
    });
    next(error);
  }
}

/**
 * Delete a campaign
 * @route DELETE /campaigns/:id
 */
export async function remove(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    await campaignsService.deleteCampaign(storeId, id);

    return res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    logger.error('Delete campaign error', {
      error: error.message,
      storeId: getStoreId(req),
      campaignId: req.params.id,
    });
    next(error);
  }
}

/**
 * Prepare campaign for sending (validate recipients and credits)
 * @route POST /campaigns/:id/prepare
 */
export async function prepare(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    const result = await campaignsService.prepareCampaign(storeId, id);

    return res.json({
      success: true,
      data: result,
      message: 'Campaign prepared successfully',
    });
  } catch (error) {
    logger.error('Prepare campaign error', {
      error: error.message,
      storeId: getStoreId(req),
      campaignId: req.params.id,
    });
    next(error);
  }
}

/**
 * Send campaign immediately
 * @route POST /campaigns/:id/send
 */
export async function sendNow(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    const result = await campaignsService.sendCampaign(storeId, id);

    return res.json({
      success: true,
      data: result,
      message: 'Campaign queued for sending',
    });
  } catch (error) {
    logger.error('Send campaign error', {
      error: error.message,
      storeId: getStoreId(req),
      campaignId: req.params.id,
    });
    next(error);
  }
}

/**
 * Schedule campaign for later
 * @route PUT /campaigns/:id/schedule
 */
export async function schedule(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;
    const scheduleData = req.body;

    const campaign = await campaignsService.scheduleCampaign(storeId, id, scheduleData);

    return res.json({
      success: true,
      data: {
        scheduled: true,
        campaign,
      },
      message: 'Campaign scheduled successfully',
    });
  } catch (error) {
    logger.error('Schedule campaign error', {
      error: error.message,
      storeId: getStoreId(req),
      campaignId: req.params.id,
    });
    next(error);
  }
}

/**
 * Get campaign metrics
 * @route GET /campaigns/:id/metrics
 */
export async function metrics(req, res, next) {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;

    const metrics = await campaignsService.getCampaignMetrics(storeId, id);

    return res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Get campaign metrics error', {
      error: error.message,
      storeId: getStoreId(req),
      campaignId: req.params.id,
    });
    next(error);
  }
}

/**
 * Get campaign statistics
 * @route GET /campaigns/stats
 */
export async function stats(req, res, next) {
  try {
    const storeId = getStoreId(req);

    const stats = await campaignsService.getCampaignStats(storeId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get campaign stats error', {
      error: error.message,
      storeId: getStoreId(req),
    });
    next(error);
  }
}

export default {
  list,
  getOne,
  create,
  update,
  remove,
  prepare,
  sendNow,
  schedule,
  metrics,
  stats,
};
