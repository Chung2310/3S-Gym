import { Readable } from 'node:stream';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { APP_POLICY } from '../config/env.js';
import { generateText } from '../services/aiProvider.js';
import { extractInBody } from '../services/ocrProvider.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

const billing = vi.hoisted(() => ({ last: undefined as unknown, withAiBilling: vi.fn(async (_context: unknown, invoke: () => Promise<unknown>) => {
  const result = await invoke() as { value: unknown }; billing.last = result; return result.value;
}) }));
vi.mock('../services/aiBillingService.js', () => ({ withAiBilling: billing.withAiBilling }));

const textContext = { userId: 'user', taskType: 'TEXT_GENERIC' as const, requestKey: 'provider-text' };
const ocrContext = { userId: 'user', taskType: 'OCR_INBODY' as const, requestKey: 'provider-ocr' };

beforeEach(() => { process.env.OPENROUTER_API_KEY = 'test-provider-key'; billing.withAiBilling.mockClear(); billing.last = undefined; });
afterEach(() => { vi.unstubAllGlobals(); delete process.env.OPENROUTER_API_KEY; delete process.env.AI_MODEL; delete process.env.OCR_MODEL; });

const file = (): Express.Multer.File => {
  const buffer = Buffer.from('image-bytes');
  return { fieldname: 'image', originalname: 'inbody.png', encoding: '7bit', mimetype: 'image/png', size: buffer.length, buffer, stream: Readable.from(buffer), destination: '', filename: '', path: '' };
};

it('parses a complete AI response', async () => {
  process.env.AI_MODEL = 'attacker/model';
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: 'Safe answer' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, cost: 0.00125 } }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(generateText(textContext, 'prompt')).resolves.toBe('Safe answer');
  expect(billing.last).toMatchObject({ provider: 'openrouter', usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15, providerCostMicrousd: 1_250 } });
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ model: APP_POLICY.AI_MODEL });
});

it('normalizes AI throttling and empty responses', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 429 })));
  await expect(generateText(textContext, 'prompt')).rejects.toMatchObject({ status: 503, code: ERROR_CODES.UNAVAILABLE });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [] }), { status: 200 })));
  await expect(generateText(textContext, 'prompt')).rejects.toMatchObject({ status: 502, code: ERROR_CODES.EXTERNAL });
});

it('parses OCR JSON and rejects malformed provider output', async () => {
  process.env.OCR_MODEL = 'attacker/model';
  const valid = { weight: 62.5, confidence: 0.9, warnings: [] };
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(valid) } }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120, cost: 0.002 } }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(extractInBody(ocrContext, file())).resolves.toMatchObject(valid);
  expect(billing.last).toMatchObject({ usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120, providerCostMicrousd: 2_000 } });
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ model: APP_POLICY.AI_MODEL });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ weight: 70, confidence: 95, warnings: [] }) } }] }), { status: 200 })));
  const normalized = await extractInBody(ocrContext, file());
  expect(normalized.confidence).toBe(0.95);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: 'not-json' } }] }), { status: 200 })));
  await expect(extractInBody(ocrContext, file())).rejects.toMatchObject({ status: 502, code: ERROR_CODES.EXTERNAL });
});
