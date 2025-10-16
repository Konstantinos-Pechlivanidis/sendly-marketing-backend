export function ok(res, data = {}, extra = {}) {
  return res.json({ success: true, data, ...extra });
}
export function bad(res, code = 'bad_request', message = 'Bad request', status = 400) {
  return res.status(status).json({ error: code, message });
}
