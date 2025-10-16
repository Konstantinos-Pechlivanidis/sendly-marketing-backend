export async function overview(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        overview: { totalCampaigns: 0, totalContacts: 0, totalSmsSent: 0, deliveryRate: 0 },
        campaignAttribution: { direct: 0, referral: 0, organic: 0 },
        automationAttribution: { welcome: 0, abandoned: 0, birthday: 0 },
        messagingTimeseries: [],
        walletStats: { balance: 0, totalUsed: 0, totalBought: 0 },
        recentCampaigns: [],
        topPerformingCampaigns: [],
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
          window: '30d',
        },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function campaigns(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        campaigns: [],
        totalCount: 0,
        campaignStats: { totalSent: 0, totalDelivered: 0, totalFailed: 0, avgDeliveryRate: 0 },
        revenueByCampaign: [],
        pagination: { limit: 20, offset: 0, total: 0, hasMore: false },
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function campaignById(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        campaign: {},
        analytics: { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 },
        recipientAnalytics: { total: 0, optedIn: 0, optedOut: 0 },
        timeseries: [],
        revenue: { total: 0, attributed: 0 },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function automations(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        automations: [],
        totalCount: 0,
        performance: { totalTriggered: 0, totalCompleted: 0, completionRate: 0 },
        timeseries: [],
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function messaging(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        totalMessages: 0,
        byDirection: { inbound: 0, outbound: 0 },
        byStatus: { sent: 0, delivered: 0, failed: 0 },
        timeseries: [],
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function revenue(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        totalRevenue: 0,
        bySource: { campaigns: 0, automations: 0 },
        timeseries: [],
        attribution: { direct: 0, referral: 0 },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function exportData(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        exportUrl: '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        format: 'csv',
        reportType: 'overview',
      },
    });
  } catch (e) {
    next(e);
  }
}
