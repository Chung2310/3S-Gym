import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { getEnv } from '../config/env.js';
import { requestOpenRouter } from './openRouterRequest.js';
import { withAiBilling } from './aiBillingService.js';
import type { AiBillingContext, ProviderResult } from './creditTypes.js';

/**
 * Image Generation Provider — Google Gemini 3.1 Flash Image via OpenRouter
 *
 * Model chính: google/gemini-3.1-flash-image (Nano Banana 2)
 * URL:         https://openrouter.ai/google/gemini-3.1-flash-image
 * Đặc tính:    Tạo ảnh ẩm thực thuần Việt siêu chân thật, chuẩn xác từng món ăn đời thực
 *
 * Cascading Fallbacks:
 * 1. google/gemini-3.1-flash-image (Primary)
 * 2. bytedance-seed/seedream-4.5 (Secondary)
 * 3. black-forest-labs/flux.2-klein-4b (Tertiary)
 * 4. pollinations-flux (Free zero-credit emergency fallback)
 */

export const IMAGE_MODEL = 'google/gemini-3.1-flash-image';
export const FALLBACK_IMAGE_MODEL_SEEDREAM = 'bytedance-seed/seedream-4.5';
export const FALLBACK_IMAGE_MODEL_FLUX = 'black-forest-labs/flux.2-klein-4b';
export const FALLBACK_IMAGE_MODEL = FALLBACK_IMAGE_MODEL_SEEDREAM;

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
 * Gọi API OpenRouter với Google Gemini 3.1 Flash Image qua chat completions (modalities: ['image', 'text'])
 */
async function callOpenRouterGeminiImage(
  apiKey: string,
  options: GenerateImageOptions
): Promise<ProviderResult<GeneratedImage>> {
  const model = 'google/gemini-3.1-flash-image';
  const { data } = await requestOpenRouter<any>(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://3s.igentechsolutions.com',
        'X-Title': '3S Gym & Wellness Fitness',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: options.prompt }],
        modalities: ['image', 'text'],
        max_tokens: 1500,
      }),
    },
    getEnv().PROVIDER_TIMEOUT_MS,
  );

  const choice = data.choices?.[0];
  const imgObj = choice?.message?.images?.[0];
  if (!imgObj) {
    throw new Error('OpenRouter Gemini 3.1 Flash Image không trả về dữ liệu ảnh trong message.images.');
  }

  const url = typeof imgObj === 'string' ? imgObj : (imgObj.image_url?.url || imgObj.url || '');
  if (!url || !url.startsWith('data:image/')) {
    throw new Error('Dữ liệu ảnh từ Gemini 3.1 Flash Image không đúng định dạng base64.');
  }

  const mimeMatch = url.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
  const mediaType = mimeMatch ? mimeMatch[1] : 'image/png';
  const b64Json = url.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');

  const cost = Number(data.usage?.cost ?? 0.005);
  const value: GeneratedImage = {
    b64Json,
    mediaType,
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

/**
 * Gọi API OpenRouter Image với một model cụ thể (hỗ trợ ByteDance Seedream 4.5 và FLUX.2 Klein 4B)
 */
async function callOpenRouterImageModel(
  model: string,
  apiKey: string,
  options: GenerateImageOptions
): Promise<ProviderResult<GeneratedImage>> {
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

  if (model.includes('seedream')) {
    body.resolution = '2K';
  }

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
    throw new Error(`OpenRouter Image API (${model}) không trả về dữ liệu ảnh hợp lệ.`);
  }

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
 * Generate an image using 4-tier cascading fallback:
 * 1. Primary: Google Gemini 3.1 Flash Image (google/gemini-3.1-flash-image) - Real photorealistic Vietnamese food
 * 2. Secondary OpenRouter model: ByteDance Seedream 4.5 (bytedance-seed/seedream-4.5)
 * 3. Tertiary OpenRouter model: FLUX.2 Klein 4B (black-forest-labs/flux.2-klein-4b)
 * 4. Safety net fallback: Pollinations Flux (free, zero-credit dependency)
 */
async function generateImageRaw(options: GenerateImageOptions): Promise<ProviderResult<GeneratedImage>> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    // TIER 1: Model chính Google Gemini 3.1 Flash Image (đời thực, siêu chân thật, ẩm thực thuần Việt)
    try {
      return await callOpenRouterGeminiImage(apiKey, options);
    } catch (err: any) {
      console.warn(
        `[imageProvider] Model chính Google Gemini 3.1 Flash Image gặp sự cố hoặc hết credit, chuyển sang fallback Seedream 4.5:`,
        err?.message || err
      );
    }

    // TIER 2: Thử model fallback OpenRouter ByteDance Seedream 4.5
    try {
      return await callOpenRouterImageModel(FALLBACK_IMAGE_MODEL_SEEDREAM, apiKey, options);
    } catch (err: any) {
      console.warn(
        `[imageProvider] Model fallback OpenRouter (${FALLBACK_IMAGE_MODEL_SEEDREAM}) gặp sự cố, chuyển sang FLUX.2:`,
        err?.message || err
      );
    }

    // TIER 3: Thử model fallback OpenRouter FLUX.2 Klein 4B
    try {
      return await callOpenRouterImageModel(FALLBACK_IMAGE_MODEL_FLUX, apiKey, options);
    } catch (err: any) {
      console.warn(
        `[imageProvider] Model OpenRouter (${FALLBACK_IMAGE_MODEL_FLUX}) gặp sự cố hoặc hết credit, kích hoạt dự phòng an toàn Pollinations:`,
        err?.message || err
      );
    }
  }

  // TIER 4: Dự phòng miễn phí tốc độ cao (Pollinations) đảm bảo 100% không bao giờ gián đoạn hay lỗi 503
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
