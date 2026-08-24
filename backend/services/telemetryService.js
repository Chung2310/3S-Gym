let sentry;

function initTelemetry() {
  if (!process.env.SENTRY_DSN) return false;
  sentry = require('@sentry/node');
  sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV, release: process.env.APP_RELEASE, sendDefaultPii: false });
  return true;
}

function captureError(error, req) {
  if (!sentry || (error.status < 500 && error.isOperational)) return;
  sentry.withScope((scope) => {
    scope.setTag('requestId', req.requestId);
    scope.setUser(req.user ? { id: req.user.id, role: req.user.role } : null);
    scope.setContext('request', { method: req.method, route: req.originalUrl });
    sentry.captureException(error.cause || error);
  });
}

async function flushTelemetry(timeout = 2000) { return sentry ? sentry.flush(timeout) : true; }

module.exports = { initTelemetry, captureError, flushTelemetry };
