export type NodeEnvironment = 'development' | 'test' | 'production';

export interface AppEnv {
  NODE_ENV: NodeEnvironment;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  JWT_ALGORITHM: 'HS256';
  PORT: number;
  CORS_ORIGINS: string[];
  TRUST_PROXY: boolean | number | string;
  JSON_BODY_LIMIT: string;
  PROVIDER_TIMEOUT_MS: number;
  AUTH_RATE_LIMIT_PER_15M: number;
  AI_RATE_LIMIT_PER_MINUTE: number;
  OCR_MAX_FILE_BYTES: number;
}

let currentEnvironment: AppEnv | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const nodeEnvironment: NodeEnvironment = source.NODE_ENV === 'production'
    ? 'production'
    : source.NODE_ENV === 'test' ? 'test' : 'development';
  const missing = nodeEnvironment === 'production'
    ? ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !source[key]?.trim())
    : [];
  if (missing.length) throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);

  const jwtSecret = source.JWT_SECRET?.trim()
    || (nodeEnvironment === 'test' ? 'secret_key' : '');
  if (nodeEnvironment === 'production' && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET phải có ít nhất 32 ký tự.');
  }

  const port = Number(source.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('PORT không hợp lệ.');

  currentEnvironment = {
    NODE_ENV: nodeEnvironment,
    MONGODB_URI: source.MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/3s-gym-test',
    JWT_SECRET: jwtSecret,
    JWT_ISSUER: source.JWT_ISSUER?.trim() || '3s-gym',
    JWT_AUDIENCE: source.JWT_AUDIENCE?.trim() || '3s-gym-api',
    JWT_ALGORITHM: 'HS256',
    PORT: port,
    CORS_ORIGINS: (source.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
    TRUST_PROXY: source.TRUST_PROXY === 'true' ? true : source.TRUST_PROXY === 'false' || !source.TRUST_PROXY ? false : source.TRUST_PROXY,
    JSON_BODY_LIMIT: source.JSON_BODY_LIMIT?.trim() || '1mb',
    PROVIDER_TIMEOUT_MS: Number(source.PROVIDER_TIMEOUT_MS || 15_000),
    AUTH_RATE_LIMIT_PER_15M: Number(source.AUTH_RATE_LIMIT_PER_15M || 20),
    AI_RATE_LIMIT_PER_MINUTE: Number(source.AI_RATE_LIMIT_PER_MINUTE || 10),
    OCR_MAX_FILE_BYTES: Number(source.OCR_MAX_FILE_BYTES || 8_388_608),
  };
  return currentEnvironment;
}

export function getEnv(): AppEnv {
  if (!currentEnvironment) return loadEnv(process.env);
  return currentEnvironment;
}
