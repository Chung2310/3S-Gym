import type { Request } from 'express';
import * as Sentry from '@sentry/node';

let sentry: typeof Sentry | undefined;

interface TelemetryError extends Error {
  status: number;
  isOperational: boolean;
  cause?: unknown;
}

function initTelemetry() {
  if (!process.env.SENTRY_DSN) return false;
  const sdk = Sentry;
  sentry = sdk;
  sdk.init({ dsn: process.env.SENTRY_DSN, environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV, release: process.env.APP_RELEASE, sendDefaultPii: false });
  return true;
}

function captureError(error: TelemetryError, req: Request) {
  const sdk = sentry;
  if (!sdk || (error.status < 500 && error.isOperational)) return;
  sdk.withScope((scope) => {
    scope.setTag('requestId', req.requestId);
    scope.setUser(req.user ? { id: req.user.id, role: req.user.role } : null);
    scope.setContext('request', { method: req.method, route: req.originalUrl });
    sdk.captureException(error.cause || error);
  });
}

async function flushTelemetry(timeout = 2000) { return sentry ? sentry.flush(timeout) : true; }

export { initTelemetry, captureError, flushTelemetry };
