const pino = require('pino');

const redact = [
  'req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie',
  '*.password', '*.token', '*.refreshToken', '*.apiKey', '*.secret', '*.base64',
];

const defaultLevel = process.env.NODE_ENV === 'test' ? 'silent' : process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const logger = pino({ level: process.env.LOG_LEVEL || defaultLevel, redact: { paths: redact, censor: '[ĐÃ ẨN]' } });

module.exports = { logger, redact };
