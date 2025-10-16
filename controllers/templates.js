export async function list(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        templates: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        filters: {},
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        id: req.params.id,
        name: '',
        category: '',
        trigger: '',
        content: '',
        metrics: { usageCount: 0, lastUsed: null, performance: 0 },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function categories(req, res, next) {
  try {
    res.json({ success: true, data: { categories: [] } });
  } catch (e) {
    next(e);
  }
}

export async function triggers(req, res, next) {
  try {
    res.json({ success: true, data: { triggers: [] } });
  } catch (e) {
    next(e);
  }
}

export async function popular(req, res, next) {
  try {
    res.json({ success: true, data: { templates: [] } });
  } catch (e) {
    next(e);
  }
}

export async function stats(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        overview: { totalTemplates: 0, totalUsage: 0, avgPerformance: 0 },
        categoryStats: [],
        triggerStats: [],
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function useTemplate(req, res, next) {
  try {
    res.json({ success: true, message: 'Template usage recorded' });
  } catch (e) {
    next(e);
  }
}

export async function preview(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        renderedBody: '',
        sampleData: req.body?.sampleData || {},
      },
    });
  } catch (e) {
    next(e);
  }
}
