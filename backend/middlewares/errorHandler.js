const { normalizeError } = require('../errors/normalizeError');
const { captureError } = require('../services/telemetryService');

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const normalized = normalizeError(error);
  const log = req.log || console;
  const level = normalized.status >= 500 ? 'error' : 'warn';
  const logData = normalized.isOperational
    ? { errorName: error.name, code: normalized.code, requestId: req.requestId }
    : { err: error, code: normalized.code, requestId: req.requestId };
  log[level]?.(logData, 'Xử lý request thất bại');
  captureError(normalized, req);
  const body = { success: false, message: normalized.message, code: normalized.code, requestId: req.requestId || 'unknown' };
  if (normalized.errors?.length) body.errors = normalized.errors;
  if (process.env.ERROR_DEBUG === 'true' && process.env.NODE_ENV !== 'production') body.debug = { stack: error.stack };
  return res.status(normalized.status).json(body);
}

module.exports = { errorHandler };
