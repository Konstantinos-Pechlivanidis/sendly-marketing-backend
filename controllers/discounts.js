export async function list(req, res, next) {
  try {
    res.json({ success: true, data: { discounts: [] } });
  } catch (e) {
    next(e);
  }
}
export async function validate(req, res, next) {
  try {
    res.json({ success: true, data: { valid: false } });
  } catch (e) {
    next(e);
  }
}
export async function campaign(req, res, next) {
  try {
    res.json({ success: true, data: {} });
  } catch (e) {
    next(e);
  }
}
export async function applyUrl(req, res, next) {
  try {
    res.json({ success: true, data: { url: '' } });
  } catch (e) {
    next(e);
  }
}
export async function search(req, res, next) {
  try {
    res.json({ success: true, data: { results: [] } });
  } catch (e) {
    next(e);
  }
}
export async function conflicts(req, res, next) {
  try {
    res.json({ success: true, data: {} });
  } catch (e) {
    next(e);
  }
}
