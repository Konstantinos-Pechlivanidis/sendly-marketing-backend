export function notFound(req, res, next) {
  res.status(404).json({ error: 'not_found', path: req.originalUrl });
}
export function errorHandler(err, req, res, next) {
  console.error(err);
  const code = err.status || 500;
  res
    .status(code)
    .json({ error: err.code || 'server_error', message: err.message || 'Unexpected error' });
}
