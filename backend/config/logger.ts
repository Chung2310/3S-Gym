import pino from 'pino';

const redact = [
  'req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie',
  '*.password', '*.token', '*.refreshToken', '*.apiKey', '*.secret', '*.base64', '*.imageBase64', '*.sourceImage',
];

const isTest = process.env.NODE_ENV === 'test';
const defaultLevel = isTest ? 'silent' : 'error';
const isDev = process.env.NODE_ENV !== 'production' && !isTest;
const usePretty = isDev || process.env.LOG_PRETTY === 'true';

const logger = pino({
  level: process.env.LOG_LEVEL || defaultLevel,
  redact: { paths: redact, censor: '[ĐÃ ẨN]' },
  ...(usePretty ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
        errorLikeObjectKeys: ['err', 'error'],
      },
    },
  } : {}),
});

export { logger, redact };
