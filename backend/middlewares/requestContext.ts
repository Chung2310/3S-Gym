import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';
const isSafeRequestId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9._-]{8,100}$/.test(value);

const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const requestId = isSafeRequestId(req.headers['x-request-id']) ? req.headers['x-request-id'] : randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  customProps(req) {
    const expressRequest = req as Request;
    return { requestId: req.id, userId: expressRequest.user?.id, role: expressRequest.user?.role };
  },
  customLogLevel(_req, res, error) { if (error || res.statusCode >= 500) return 'error'; if (res.statusCode >= 400) return 'warn'; return 'info'; },
  serializers: { req(req) { return { id: req.id, method: req.method, url: req.url }; }, res(res) { return { statusCode: res.statusCode }; } },
});

function requestContext(req: Request, res: Response, next: NextFunction) {
  requestLogger(req, res, () => { req.requestId = String(req.id); next(); });
}

export { requestContext, isSafeRequestId };
