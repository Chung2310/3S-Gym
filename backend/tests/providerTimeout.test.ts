import { afterEach, expect, it, vi } from 'vitest';
import { fetchWithTimeout } from '../services/providerRequest.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

afterEach(() => vi.unstubAllGlobals());

it('normalizes provider timeout without exposing the provider response', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
  })));

  const pending = fetchWithTimeout('https://provider.test', {}, 10);
  const assertion = expect(pending).rejects.toMatchObject({ status: 502, code: ERROR_CODES.EXTERNAL });
  await vi.advanceTimersByTimeAsync(11);

  await assertion;
  vi.useRealTimers();
});

it('maps provider throttling to service unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
  await expect(fetchWithTimeout('https://provider.test', {}, 100)).rejects.toMatchObject({
    status: 503, code: ERROR_CODES.UNAVAILABLE,
  });
});

it('preserves caller cancellation', async () => {
  const caller = new AbortController();
  vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
  })));
  const pending = fetchWithTimeout('https://provider.test', { signal: caller.signal }, 1_000);
  caller.abort(new Error('caller cancelled'));
  await expect(pending).rejects.toMatchObject({ code: ERROR_CODES.EXTERNAL });
});
