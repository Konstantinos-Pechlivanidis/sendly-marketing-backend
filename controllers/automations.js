export async function list(req, res, next) {
  try {
    res.json({ success: true, data: { automations: [] } });
  } catch (e) {
    next(e);
  }
}
export async function getOne(req, res, next) {
  try {
    res.json({ success: true, data: {} });
  } catch (e) {
    next(e);
  }
}
export async function update(req, res, next) {
  try {
    res.json({ success: true, data: { updated: true } });
  } catch (e) {
    next(e);
  }
}
export async function reset(req, res, next) {
  try {
    res.json({ success: true, data: { reset: true } });
  } catch (e) {
    next(e);
  }
}
export async function stats(req, res, next) {
  try {
    res.json({ success: true, data: {} });
  } catch (e) {
    next(e);
  }
}
export async function preview(req, res, next) {
  try {
    res.json({ success: true, data: { renderedBody: '', sampleData: req.body?.sampleData || {} } });
  } catch (e) {
    next(e);
  }
}
