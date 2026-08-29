import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { APP_POLICY, getEnv } from '../config/env.js';
import { fetchWithTimeout } from './providerRequest.js';

interface AiCallOptions {
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
  jsonMode?: boolean;
}

/**
 * Hàm gọi API nền tảng OpenRouter với cơ chế retry tự động khi gặp 429
 */
async function callOpenRouter(prompt: string, options: AiCallOptions = {}): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new AppError({
      status: 503,
      code: ERROR_CODES.UNAVAILABLE,
      message: 'PT Assistant chưa được cấu hình.',
    });
  }

  const model = process.env.OPENROUTER_MODEL || APP_POLICY.AI_MODEL;
  const temperature = options.temperature ?? 0.1;
  const maxTokens = options.maxTokens ?? 8192;
  const reasoningEffort = (process.env.OPENROUTER_REASONING_EFFORT as any) || options.reasoningEffort || 'none';

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const bodyPayload: Record<string, any> = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      };

      if (reasoningEffort && reasoningEffort !== 'none') {
        bodyPayload.reasoning = { effort: reasoningEffort };
      } else {
        bodyPayload.reasoning = { effort: 'none' };
      }

      if (options.jsonMode) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const response = await fetchWithTimeout(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://3s.igentechsolutions.com',
            'X-Title': '3S Gym & Wellness Fitness',
          },
          body: JSON.stringify(bodyPayload),
        },
        getEnv().PROVIDER_TIMEOUT_MS
      );

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string; reasoning?: string } }>;
        error?: { message?: string; code?: number | string };
      };

      if (!response.ok || data.error) {
        const errMsg = data.error?.message || `AI Provider phản hồi mã lỗi HTTP ${response.status}`;
        throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: errMsg });
      }

      const choiceMsg = data.choices?.[0]?.message;
      let content = choiceMsg?.content;

      // Fallback nếu model trả toàn bộ văn bản trong khối reasoning
      if ((!content || !content.trim()) && choiceMsg?.reasoning) {
        content = choiceMsg.reasoning;
      }

      if (!content || !content.trim()) {
        throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI provider không trả nội dung' });
      }
      return content.trim();
    } catch (err: any) {
      const isRateLimit = err?.status === 503 || err?.code === ERROR_CODES.UNAVAILABLE;
      if (isRateLimit) {
        lastError = err;
        if (attempt < 2 && process.env.NODE_ENV !== 'test') {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
      } else {
        lastError = err;
      }
      break;
    }
  }

  if (lastError instanceof AppError) throw lastError;
  throw new AppError({
    status: 502,
    code: ERROR_CODES.EXTERNAL,
    message: 'PT Assistant tạm thời không phản hồi. Vui lòng thử lại.',
    cause: lastError,
  });
}

/**
 * 1. Tác vụ chuyên biệt: Sinh Thực Đơn Dinh Dưỡng Chi Tiết
 */
export async function generateNutritionDraft(prompt: string): Promise<string> {
  return callOpenRouter(prompt, {
    temperature: 0.1,
    maxTokens: 8192,
    reasoningEffort: 'none',
  });
}

/**
 * 2. Tác vụ chuyên biệt: Phân Tích Cơ Thể & Năng Lượng Chuyển Hóa
 */
export async function generateNutritionAnalysis(prompt: string): Promise<string> {
  return callOpenRouter(prompt, {
    temperature: 0.1,
    maxTokens: 4096,
    reasoningEffort: 'none',
  });
}

/**
 * 3. Tác vụ chuyên biệt: Thiết Kế Giáo Án Huấn Luyện (Workout Plan)
 */
export async function generateWorkoutDraft(prompt: string): Promise<string> {
  return callOpenRouter(prompt, {
    temperature: 0.1,
    maxTokens: 8192,
    reasoningEffort: 'none',
  });
}

/**
 * 4. Tác vụ chuyên biệt: Sinh Lộ Trình Huấn Luyện Dài Hạn (Roadmap)
 */
export async function generateRoadmapDraft(prompt: string): Promise<string> {
  return callOpenRouter(prompt, {
    temperature: 0.1,
    maxTokens: 8192,
    reasoningEffort: 'none',
  });
}

/**
 * 5. Tác vụ chuyên biệt: Trợ Lý PT & Trả Lời Câu Hỏi Nghiệp Vụ
 */
export async function generateAssistantAdvice(prompt: string): Promise<string> {
  return callOpenRouter(prompt, {
    temperature: 0.2,
    maxTokens: 4096,
    reasoningEffort: 'none',
  });
}

/**
 * Hàm chung sinh văn bản (Tương thích ngược)
 */
export async function generateText(prompt: string): Promise<string> {
  return callOpenRouter(prompt, {
    temperature: 0.1,
    maxTokens: 8192,
    reasoningEffort: 'none',
  });
}
