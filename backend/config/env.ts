export type NodeEnvironment = 'development' | 'test' | 'production';

export const APP_POLICY = Object.freeze({
  JWT_ISSUER: '3s-gym',
  JWT_AUDIENCE: '3s-gym-api',
  JWT_ALGORITHM: 'HS256' as const,
  TRUST_PROXY: false as const,
  JSON_BODY_LIMIT: '1mb',
  PROVIDER_TIMEOUT_MS: 180_000,
  AUTH_RATE_LIMIT_PER_15M: 20,
  AI_RATE_LIMIT_PER_MINUTE: 10,
  OCR_MAX_FILE_BYTES: 8_388_608,
  SHUTDOWN_TIMEOUT_MS: 10_000,
  AI_MODEL: 'qwen/qwen3.8-flash',
  VECTOR_SEARCH_INDEX: 'knowledge-vector',
  LOG_MAX_DEPTH: 4,
  LOG_MAX_COLLECTION_ITEMS: 25,
  LOG_MAX_STRING_LENGTH: 2_000,
  ERROR_DEBUG: false as const,
});

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
  APP_URL?: string;
  VNPAY_TMN_CODE?: string;
  VNPAY_HASH_SECRET?: string;
  VNPAY_PAYMENT_URL?: string;
  VNPAY_RETURN_URL?: string;
  VNPAY_IPN_URL?: string;
  MOMO_PARTNER_CODE?: string;
  MOMO_ACCESS_KEY?: string;
  MOMO_SECRET_KEY?: string;
  MOMO_API_URL?: string;
  MOMO_REDIRECT_URL?: string;
  MOMO_IPN_URL?: string;
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

  const optional = (key: string) => source[key]?.trim() || undefined;
  currentEnvironment = {
    NODE_ENV: nodeEnvironment,
    MONGODB_URI: source.MONGODB_URI?.trim() || 'mongodb://127.0.0.1:27017/3s-gym-test',
    JWT_SECRET: jwtSecret,
    JWT_ISSUER: APP_POLICY.JWT_ISSUER,
    JWT_AUDIENCE: APP_POLICY.JWT_AUDIENCE,
    JWT_ALGORITHM: APP_POLICY.JWT_ALGORITHM,
    PORT: port,
    CORS_ORIGINS: (source.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
    TRUST_PROXY: APP_POLICY.TRUST_PROXY,
    JSON_BODY_LIMIT: APP_POLICY.JSON_BODY_LIMIT,
    PROVIDER_TIMEOUT_MS: APP_POLICY.PROVIDER_TIMEOUT_MS,
    AUTH_RATE_LIMIT_PER_15M: APP_POLICY.AUTH_RATE_LIMIT_PER_15M,
    AI_RATE_LIMIT_PER_MINUTE: APP_POLICY.AI_RATE_LIMIT_PER_MINUTE,
    OCR_MAX_FILE_BYTES: APP_POLICY.OCR_MAX_FILE_BYTES,
    APP_URL: optional('APP_URL'),
    VNPAY_TMN_CODE: optional('VNPAY_TMN_CODE'),
    VNPAY_HASH_SECRET: optional('VNPAY_HASH_SECRET'),
    VNPAY_PAYMENT_URL: optional('VNPAY_PAYMENT_URL'),
    VNPAY_RETURN_URL: optional('VNPAY_RETURN_URL'),
    VNPAY_IPN_URL: optional('VNPAY_IPN_URL'),
    MOMO_PARTNER_CODE: optional('MOMO_PARTNER_CODE'),
    MOMO_ACCESS_KEY: optional('MOMO_ACCESS_KEY'),
    MOMO_SECRET_KEY: optional('MOMO_SECRET_KEY'),
    MOMO_API_URL: optional('MOMO_API_URL'),
    MOMO_REDIRECT_URL: optional('MOMO_REDIRECT_URL'),
    MOMO_IPN_URL: optional('MOMO_IPN_URL'),
  };
  return currentEnvironment;
}

export function getEnv(): AppEnv {
  if (!currentEnvironment) return loadEnv(process.env);
  return currentEnvironment;
}
