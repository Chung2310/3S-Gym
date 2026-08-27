import { describe, expect, it } from 'vitest';
import { loadEnv } from '../config/env.js';

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
});
