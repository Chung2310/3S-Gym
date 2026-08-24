const { randomUUID } = require('crypto');
const pinoHttp = require('pino-http');
const { logger } = require('../config/logger');

const isSafeRequestId = (value) => typeof value === 'string' && /^[A-Za-z0-9._-]{8,100}$/.test(value);

const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const requestId = isSafeRequestId(req.headers['x-request-id']) ? req.headers['x-request-id'] : randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  customProps(req) { return { requestId: req.id, userId: req.user?.id, role: req.user?.role }; },
  customLogLevel(_req, res, error) { if (error || res.statusCode >= 500) return 'error'; if (res.statusCode >= 400) return 'warn'; return 'info'; },
  serializers: { req(req) { return { id: req.id, method: req.method, url: req.url }; }, res(res) { return { statusCode: res.statusCode }; } },
});

function requestContext(req, res, next) {
  requestLogger(req, res, () => { req.requestId = req.id; next(); });
}

module.exports = { requestContext, isSafeRequestId };
