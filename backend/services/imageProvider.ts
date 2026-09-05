import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { getEnv } from '../config/env.js';
import { fetchWithTimeout } from './providerRequest.js';
import { withAiBilling } from './aiBillingService.js';
import type { AiBillingContext, ProviderResult } from './creditTypes.js';

/**
 * Image Generation Provider — FLUX.2 Klein 4B via OpenRouter Image API
 *
 * Endpoint: POST https://openrouter.ai/api/v1/images
 * Model:    black-forest-labs/flux.2-klein-4b
 * Docs:     https://openrouter.ai/black-forest-labs/flux.2-klein-4b/llms.txt
 *
 * Returns base64-encoded image bytes (PNG or JPEG).
 */

export const IMAGE_MODEL = 'black-forest-labs/flux.2-klein-4b';

export type AspectRatio = '1:1' | '4:3' | '3:4' | '3:2' | '2:3' | '16:9' | '9:16' | '21:9' | 'auto';
export type OutputFormat = 'png' | 'jpeg';

export interface GenerateImageOptions {
  /** Text description of the desired image */
  prompt: string;
  /** Aspect ratio (default: '1:1') */
  aspectRatio?: AspectRatio;
  /** Output format (default: 'jpeg') */
  outputFormat?: OutputFormat;
  /** Deterministic seed (optional) */
  seed?: number;
}

export interface GeneratedImage {
  /** Base64-encoded image bytes */
  b64Json: string;
  /** MIME type (e.g. 'image/png' or 'image/jpeg') */
  mediaType: string;
  /** USD cost of the generation */
  cost: number;
  /** Number of image tokens consumed */
  completionTokens: number;
}

interface OpenRouterImageResponse {
  created: number;
  data: Array<{
    b64_json: string;
    media_type: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
  };
}

/**
 * Fallback tạo ảnh AI miễn phí (Pollinations Flux) khi OpenRouter hết credit (402) hoặc tạm thời gián đoạn
 */
async function generateImageFallback(options: GenerateImageOptions): Promise<ProviderResult<GeneratedImage>> {
  let width = 800;
  let height = 600;
  if (options.aspectRatio === '16:9') {
    width = 800;
    height = 450;
  } else if (options.aspectRatio === '1:1') {
    width = 600;
    height = 600;
  } else if (options.aspectRatio === '3:4') {
    width = 600;
    height = 800;
  }

  const cleanPrompt = options.prompt.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 300);
  const seed = options.seed || Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(`Fallback Image provider trả về HTTP ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength < 1000) {
    throw new Error('Fallback Image provider trả về dữ liệu ảnh không hợp lệ.');
  }

  const b64Json = Buffer.from(arrayBuffer).toString('base64');
  return {
    value: {
      b64Json,
      mediaType: 'image/jpeg',
      cost: 0,
      completionTokens: 0,
    },
    provider: 'pollinations',
    model: 'pollinations-flux',
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      providerCostMicrousd: 0,
    },
  };
}

/**
 * Generate an image using FLUX.2 Klein 4B via the OpenRouter Image API.
 * Tự động chuyển đổi sang Pollinations fallback nếu OpenRouter hết credit (402) hoặc gặp sự cố.
 */
async function generateImageRaw(options: GenerateImageOptions): Promise<ProviderResult<GeneratedImage>> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    const model = process.env.IMAGE_MODEL || IMAGE_MODEL;

    const body: Record<string, unknown> = {
      model,
      prompt: options.prompt,
      n: 1,
      output_format: options.outputFormat || 'jpeg',
    };

    if (options.aspectRatio) {
      body.aspect_ratio = options.aspectRatio;
    }

    if (options.seed !== undefined) {
      body.seed = options.seed;
    }

    try {
      const response = await fetchWithTimeout(
        'https://openrouter.ai/api/v1/images',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://3s.igentechsolutions.com',
            'X-Title': '3S Gym & Wellness Fitness',
          },
          body: JSON.stringify(body),
        },
        getEnv().PROVIDER_TIMEOUT_MS,
      );

      if (response.ok) {
        const data = (await response.json()) as OpenRouterImageResponse;

        if (data.data?.length && data.data[0].b64_json) {
          const cost = Number(data.usage?.cost ?? 0);
          const value = {
            b64Json: data.data[0].b64_json,
            mediaType: data.data[0].media_type || 'image/jpeg',
            cost: Number.isFinite(cost) && cost >= 0 ? cost : 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
          };
          return {
            value,
            provider: 'openrouter',
            model,
            usage: {
              inputTokens: data.usage?.prompt_tokens,
              outputTokens: data.usage?.completion_tokens,
              totalTokens: data.usage?.total_tokens,
              providerCostMicrousd: Math.round(cost * 1_000_000),
            },
          };
        }
      }
    } catch (err: any) {
      console.warn(
        '[imageProvider] OpenRouter image generation gặp sự cố hoặc hết credit (402), tự động kích hoạt fallback provider:',
        err?.message || err
      );
    }
  }

  // Tự động chuyển sang fallback provider khi OpenRouter hết credit hoặc lỗi
  try {
    return await generateImageFallback(options);
  } catch (cause) {
    if (cause instanceof AppError) throw cause;
    throw new AppError({
      status: 502,
      code: ERROR_CODES.EXTERNAL,
      message: 'Dịch vụ tạo ảnh AI tạm thời không phản hồi. Vui lòng thử lại sau.',
      cause,
    });
  }
}

export function generateImage(context: AiBillingContext, options: GenerateImageOptions): Promise<GeneratedImage>;
export function generateImage(options: GenerateImageOptions): Promise<GeneratedImage>;
export async function generateImage(context: AiBillingContext | GenerateImageOptions, options?: GenerateImageOptions): Promise<GeneratedImage> {
  if ('prompt' in context) return (await generateImageRaw(context)).value;
  return withAiBilling(context, () => generateImageRaw(options!));
}
