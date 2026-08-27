import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
export async function generateText(prompt: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'PT Assistant chưa được cấu hình.' });
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.AI_MODEL || 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }], temperature: 0.2 }) });
    if (!response.ok) throw new Error(`AI provider trả HTTP ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider không trả nội dung');
    return content;
  } catch (cause) {
    if (cause instanceof AppError) throw cause;
    throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'PT Assistant tạm thời không phản hồi. Vui lòng thử lại.', cause });
  }
}
