import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { APP_POLICY, loadEnv } from '../config/env.js';

describe('production environment', () => {
  it('fails fast with every missing production requirement', () => {
    expect(() => loadEnv({ NODE_ENV: 'production', MONGODB_URI: '', JWT_SECRET: '' })).toThrow(
      'Thiếu biến môi trường bắt buộc: MONGODB_URI, JWT_SECRET',
    );
  });

  it('uses explicit JWT policy and numeric port', () => {
    expect(loadEnv({
      NODE_ENV: 'production', MONGODB_URI: 'mongodb://database/3s', JWT_SECRET: 'x'.repeat(32), PORT: '3008',
    })).toMatchObject({
      JWT_ISSUER: '3s-gym', JWT_AUDIENCE: '3s-gym-api', JWT_ALGORITHM: 'HS256', PORT: 3008,
    });
  });

  it('rejects a short production JWT secret', () => {
    expect(() => loadEnv({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://database/3s', JWT_SECRET: 'short' }))
      .toThrow('JWT_SECRET phải có ít nhất 32 ký tự.');
  });

  it('does not allow removed environment keys to override application policy', () => {
    expect(loadEnv({
      NODE_ENV: 'production', MONGODB_URI: 'mongodb://database/3s', JWT_SECRET: 'x'.repeat(32),
      JWT_ISSUER: 'attacker', JWT_AUDIENCE: 'attacker', TRUST_PROXY: 'true', JSON_BODY_LIMIT: '99gb',
      PROVIDER_TIMEOUT_MS: '1', AUTH_RATE_LIMIT_PER_15M: '999', AI_RATE_LIMIT_PER_MINUTE: '999', OCR_MAX_FILE_BYTES: '1',
    })).toMatchObject({
      JWT_ISSUER: '3s-gym', JWT_AUDIENCE: '3s-gym-api', TRUST_PROXY: false, JSON_BODY_LIMIT: '1mb',
      PROVIDER_TIMEOUT_MS: APP_POLICY.PROVIDER_TIMEOUT_MS, AUTH_RATE_LIMIT_PER_15M: 20, AI_RATE_LIMIT_PER_MINUTE: 10, OCR_MAX_FILE_BYTES: 8_388_608,
    });
  });

  it('.env.example exposes only the approved deployment contract', () => {
    const content = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8');
    const assignments = content.split(/\r?\n/).filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line));
    expect(assignments.map((line) => line.split('=', 1)[0])).toEqual([
      'NODE_ENV', 'PORT', 'MONGODB_URI', 'MONGODB_USER', 'MONGODB_PASSWORD', 'MONGODB_AUTH_SOURCE',
      'JWT_SECRET', 'CORS_ORIGINS', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_FULL_NAME',
      'OPENROUTER_API_KEY', 'APP_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
    ]);
    for (const key of ['MONGODB_PASSWORD', 'JWT_SECRET', 'ADMIN_PASSWORD', 'OPENROUTER_API_KEY', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
      expect(assignments).toContain(`${key}=`);
    }
  });
});
