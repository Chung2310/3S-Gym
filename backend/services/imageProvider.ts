import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { getEnv } from '../config/env.js';
import { requestOpenRouter } from './openRouterRequest.js';
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
 * Generate an image using FLUX.2 Klein 4B via the OpenRouter Image API.
 *
 * @throws AppError 503 if OPENROUTER_API_KEY is not configured
 * @throws AppError 502 if the upstream provider fails
 */
async function generateImageRaw(options: GenerateImageOptions): Promise<ProviderResult<GeneratedImage>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AppError({
      status: 503,
      code: ERROR_CODES.UNAVAILABLE,
      message: 'Dịch vụ tạo ảnh AI chưa được cấu hình (thiếu OPENROUTER_API_KEY).',
    });
  }

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
    const { data } = await requestOpenRouter<OpenRouterImageResponse>(
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

    if (!data.data?.length || !data.data[0].b64_json) {
      throw new Error('OpenRouter Image API không trả về ảnh.');
    }

    const cost = Number(data.usage?.cost ?? 0);
    if (!Number.isFinite(cost) || cost < 0) throw new Error('OpenRouter Image API trả về chi phí không hợp lệ.');
    const value = {
      b64Json: data.data[0].b64_json,
      mediaType: data.data[0].media_type || 'image/jpeg',
      cost,
      completionTokens: data.usage?.completion_tokens ?? 0,
    };
    return {
      value, provider: 'openrouter', model,
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
        providerCostMicrousd: Math.round(cost * 1_000_000),
      },
    };
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
