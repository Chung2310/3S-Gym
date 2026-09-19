import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const startupTimeoutMs = 90_000;
const shutdownTimeoutMs = 15_000;
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

async function waitForReady(baseUrl, deadline, getExitResult = () => undefined) {
  while (Date.now() < deadline) {
    const exited = getExitResult();
    if (exited) throw new Error(`Production server exited before readiness (code ${exited.code ?? 'null'}, signal ${exited.signal || 'none'}). Check the server startup logs.`);
    try {
      const response = await fetch(`${baseUrl}/api/health/ready`, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // The compiled server may still be connecting to MongoDB.
    }
    await delay(150);
  }
  throw new Error('Production server did not become ready before the smoke timeout.');
}

async function requestJson(url, init) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Smoke request failed (${response.status}): ${JSON.stringify(body)}`);
  return body;
}

async function waitForShutdown(exitPromise, isExited, kill) {
  let timer;
  try {
    return await Promise.race([
      exitPromise,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          if (!isExited()) kill();
          reject(new Error('Production server did not stop after the shutdown request.'));
        }, shutdownTimeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
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
  env.SUPER_ADMIN_PASSWORD ||= 'Smoke@' + randomUUID();
  env.SUPER_ADMIN_FULL_NAME ||= 'Production Smoke Super Admin';

  const baseUrl = `http://127.0.0.1:${env.PORT}`;
  const child = spawn(process.execPath, ['dist/backend/bootstrap.js'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  let childExited = false;
  let exitResult;
  const exitPromise = new Promise((resolve) => child.once('exit', (code, signal) => {
    childExited = true;
    exitResult = { code, signal };
    resolve(exitResult);
  }));
  child.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stdout.write(`[server:stderr] ${chunk}`));

  try {
    const deadline = Date.now() + startupTimeoutMs;
    await waitForReady(baseUrl, deadline, () => exitResult);
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

    if (child.connected) {
      child.send({ type: 'shutdown' }, (error) => {
        if (error) child.kill('SIGTERM');
        else if (child.connected) child.disconnect();
      });
    } else child.kill('SIGTERM');
    const result = await waitForShutdown(exitPromise, () => childExited, () => child.kill('SIGKILL'));
    if (result.code !== 0) throw new Error(`Production server exited with code ${result.code ?? 'null'} (${result.signal || 'no signal'}).`);
    process.stdout.write('PRODUCTION_SMOKE_OK\n');
  } finally {
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

export { buildSmokeEnvironment, runProductionSmoke, waitForReady };
