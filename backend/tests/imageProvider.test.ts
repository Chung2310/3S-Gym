// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateImage } from '../services/imageProvider.js';

const billing = vi.hoisted(() => ({ last: undefined as unknown, withAiBilling: vi.fn(async (_context: unknown, invoke: () => Promise<unknown>) => {
  const result = await invoke() as { value: unknown }; billing.last = result; return result.value;
}) }));
vi.mock('../services/aiBillingService.js', () => ({ withAiBilling: billing.withAiBilling }));
const imageContext = { userId: 'user', taskType: 'IMAGE_GENERATION' as const, requestKey: 'provider-image' };

// Stub fetch
const mockFetchResponse = {
  ok: true,
  status: 200,
  json: vi.fn(),
};
vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse));

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'test-image-key';
  vi.mocked(fetch).mockClear();
  mockFetchResponse.json.mockReset();
  mockFetchResponse.ok = true;
  billing.last = undefined;
});
afterEach(() => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.IMAGE_MODEL;
});

describe('imageProvider — FLUX.2 Klein 4B', () => {
  it('gọi đúng OpenRouter Image API endpoint và model FLUX.2 Klein 4B', async () => {
    mockFetchResponse.json.mockResolvedValueOnce({
      created: 1700000000,
      data: [{ b64_json: 'dGVzdC1pbWFnZS1kYXRh', media_type: 'image/jpeg' }],
      usage: { prompt_tokens: 0, completion_tokens: 1048576, total_tokens: 1048576, cost: 0.014 },
    });

    const result = await generateImage(imageContext, {
      prompt: 'A grilled chicken plate with brown rice',
      aspectRatio: '4:3',
      outputFormat: 'jpeg',
    });

    // Verify correct endpoint
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toBe('https://openrouter.ai/api/v1/images');

    // Verify request body
    const body = JSON.parse(fetchCall[1]!.body as string);
    expect(body.model).toBe('black-forest-labs/flux.2-klein-4b');
    expect(body.prompt).toBe('A grilled chicken plate with brown rice');
    expect(body.aspect_ratio).toBe('4:3');
    expect(body.output_format).toBe('jpeg');
    expect(body.n).toBe(1);

    // Verify response mapping
    expect(result.b64Json).toBe('dGVzdC1pbWFnZS1kYXRh');
    expect(result.mediaType).toBe('image/jpeg');
    expect(result.cost).toBe(0.014);
    expect(billing.last).toMatchObject({ provider: 'openrouter', usage: { outputTokens: 1048576, providerCostMicrousd: 14_000 } });
  });

  it('ném AppError 503 khi thiếu OPENROUTER_API_KEY', async () => {
    delete process.env.OPENROUTER_API_KEY;

    await expect(generateImage(imageContext, { prompt: 'test' })).rejects.toMatchObject({
      status: 503,
    });
  });
});
