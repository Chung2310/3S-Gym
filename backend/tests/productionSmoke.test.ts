import { execFile } from 'node:child_process';
import { createServer } from 'node:net';
import { promisify } from 'node:util';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
let mongo: MongoMemoryServer;

async function availablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('Không lấy được cổng smoke test.'));
      server.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await execFileAsync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.backend.build.json'], {
    cwd: path.resolve('.'),
    timeout: 60_000,
  });
}, 70_000);

afterAll(async () => {
  await mongo.stop();
});

it('boots the compiled server, authenticates, calls a protected endpoint, and shuts down cleanly', async () => {
  const port = await availablePort();
  const result = await execFileAsync(process.execPath, ['scripts/production-smoke.mjs'], {
    cwd: path.resolve('.'),
    timeout: 45_000,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      MONGODB_URI: mongo.getUri(),
      JWT_SECRET: 'production-smoke-secret-at-least-32-characters',
      PORT: String(port),
      ADMIN_USERNAME: 'smoke-admin',
      ADMIN_PASSWORD: 'Smoke-password-123!',
      ADMIN_FULL_NAME: 'Smoke Admin',
    },
  });

  expect(result.stderr).toBe('');
  expect(result.stdout).toContain('PRODUCTION_SMOKE_OK');
}, 55_000);
