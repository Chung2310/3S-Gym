import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { APP_POLICY, getEnv } from '../config/env.js';
import { fetchWithTimeout } from './providerRequest.js';
export async function generateText(prompt: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'PT Assistant chưa được cấu hình.' });
  try {
    const model = process.env.OPENROUTER_MODEL || APP_POLICY.AI_MODEL;
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
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 16384,
          reasoning: { effort: 'low' },
        }),
      },
      getEnv().PROVIDER_TIMEOUT_MS
    );
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider không trả nội dung');
    return content;
  } catch (cause) {
    if (cause instanceof AppError) throw cause;
    throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'PT Assistant tạm thời không phản hồi. Vui lòng thử lại.', cause });
  }
}
