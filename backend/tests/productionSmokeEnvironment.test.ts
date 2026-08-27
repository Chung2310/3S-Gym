import { expect, it } from 'vitest';
import { buildSmokeEnvironment } from '../../scripts/production-smoke.mjs';

it('ngăn dotenv chèn credential thật khi smoke dùng MongoDB không xác thực', () => {
  const env = buildSmokeEnvironment({ MONGODB_URI: 'mongodb://127.0.0.1:27017/smoke' });

  expect(env.MONGODB_USER).toBe(' ');
  expect(env.MONGODB_PASSWORD).toBe(' ');
  expect(env.MONGODB_AUTH_SOURCE).toBe(' ');
});

it('giữ credential MongoDB được truyền rõ ràng cho smoke', () => {
  const env = buildSmokeEnvironment({ MONGODB_URI: 'mongodb://database/smoke', MONGODB_USER: 'smoke', MONGODB_PASSWORD: 'secret', MONGODB_AUTH_SOURCE: 'admin' });

  expect(env.MONGODB_USER).toBe('smoke');
  expect(env.MONGODB_PASSWORD).toBe('secret');
  expect(env.MONGODB_AUTH_SOURCE).toBe('admin');
});
