export async function list(req, res, next) {
  try {
    // TODO: query DB with pagination/filter from req.query
    res.json({ success: true, data: { contacts: [], total: 0, page: 1, limit: 20 } });
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
export async function create(req, res, next) {
  try {
    res.json({ success: true, data: {} });
  } catch (e) {
    next(e);
  }
}
export async function update(req, res, next) {
  try {
    res.json({ success: true, data: {} });
  } catch (e) {
    next(e);
  }
}
export async function remove(req, res, next) {
  try {
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
export async function importCsv(req, res, next) {
  try {
    res.json({ success: true, data: { imported: 0 } });
  } catch (e) {
    next(e);
  }
}
export async function stats(req, res, next) {
  try {
    res.json({ success: true, data: { total: 0, optedIn: 0, optedOut: 0 } });
  } catch (e) {
    next(e);
  }
}
