import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const timeoutMs = 30_000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildSmokeEnvironment(sourceEnv = process.env) {
  const env = { ...sourceEnv };
  if (!sourceEnv.MONGODB_USER?.trim() && !sourceEnv.MONGODB_PASSWORD?.trim()) {
    env.MONGODB_USER = ' ';
    env.MONGODB_PASSWORD = ' ';
    env.MONGODB_AUTH_SOURCE = ' ';
  }
  return env;
}

async function waitForReady(baseUrl, deadline) {
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health/ready`);
      if (response.ok) return;
    } catch {
      // The compiled server may still be connecting to MongoDB.
    }
    await delay(150);
  }
  throw new Error('Production server did not become ready before the smoke timeout.');
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Smoke request failed (${response.status}): ${JSON.stringify(body)}`);
  return body;
}

async function runProductionSmoke(sourceEnv = process.env) {
  let memoryServer;
  const env = buildSmokeEnvironment(sourceEnv);
  if (!env.MONGODB_URI) {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    env.MONGODB_URI = memoryServer.getUri();
    env.MONGODB_USER = '';
    env.MONGODB_PASSWORD = '';
    env.MONGODB_AUTH_SOURCE = '';
  }
  env.MONGODB_USER ??= '';
  env.MONGODB_PASSWORD ??= '';
  env.MONGODB_AUTH_SOURCE ??= '';

  env.NODE_ENV ||= 'test';
  env.JWT_SECRET ||= `${randomUUID()}${randomUUID()}`;
  env.PORT ||= '5057';
  env.SUPER_ADMIN_USERNAME ||= `smoke-${randomUUID()}`;
  env.SUPER_ADMIN_PASSWORD ||= '123456';
  env.SUPER_ADMIN_FULL_NAME ||= 'Production Smoke Super Admin';

  const baseUrl = `http://127.0.0.1:${env.PORT}`;
  const child = spawn(process.execPath, ['dist/backend/bootstrap.js'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  let childExited = false;
  const exitPromise = new Promise((resolve) => child.once('exit', (code, signal) => {
    childExited = true;
    resolve({ code, signal });
  }));
  child.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stdout.write(`[server:stderr] ${chunk}`));

  const timer = setTimeout(() => {
    if (!childExited) child.kill('SIGKILL');
  }, timeoutMs);

  try {
    const deadline = Date.now() + timeoutMs;
    await waitForReady(baseUrl, deadline);
    const login = await requestJson(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: env.SUPER_ADMIN_USERNAME, password: env.SUPER_ADMIN_PASSWORD }),
    });
    const token = login?.data?.token;
    if (typeof token !== 'string' || !token) throw new Error('Smoke login did not return an access token.');
    await requestJson(`${baseUrl}/api/customers?page=1&limit=1`, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (child.connected) child.send({ type: 'shutdown' });
    else child.kill('SIGTERM');
    const result = await exitPromise;
    if (result.code !== 0) throw new Error(`Production server exited with code ${result.code ?? 'null'} (${result.signal || 'no signal'}).`);
    process.stdout.write('PRODUCTION_SMOKE_OK\n');
  } finally {
    clearTimeout(timer);
    if (!childExited) {
      child.kill('SIGKILL');
      await exitPromise;
    }
    if (memoryServer) await memoryServer.stop();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase()) {
  runProductionSmoke().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export { buildSmokeEnvironment, runProductionSmoke };
