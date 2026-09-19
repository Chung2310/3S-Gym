import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { requestShutdown, waitForReady } from './production-smoke.mjs';

test('fails immediately when the server exits before readiness', async () => {
  await assert.rejects(waitForReady('http://127.0.0.1:1', Date.now() + 30_000, () => ({ code: 1, signal: null })), /exited before readiness \(code 1/);
});

test('polls until healthy and bounds each request', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    calls++;
    return { ok: calls === 2 };
  });
  await waitForReady('http://127.0.0.1:1', Date.now() + 5000);
  assert.equal(calls, 2);
});

test('reports timeout for a server that never becomes ready', async () => {
  await assert.rejects(waitForReady('http://127.0.0.1:1', Date.now() - 1), /smoke timeout/);
});

test('keeps IPC open until the server confirms shutdown', async () => {
  const child = new EventEmitter();
  child.connected = true;
  child.send = (message, callback) => {
    assert.deepEqual(message, { type: 'shutdown' });
    callback(null);
  };
  child.disconnect = () => { child.connected = false; };

  const completed = requestShutdown(child);
  assert.equal(child.connected, true);
  child.emit('message', { type: 'unrelated' });
  assert.equal(child.connected, true);
  child.emit('message', { type: 'shutdown-complete', exitCode: 0 });
  await completed;
  assert.equal(child.connected, false);
});
