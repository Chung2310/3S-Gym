import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { APP_POLICY, getEnv } from '../config/env.js';
import { fetchWithTimeout } from './providerRequest.js';

export interface InBodyExtraction {
  weight: number;
  bmi?: number | null;
  bodyFatPercentage?: number | null;
  bodyFatMass?: number | null;
  muscleMass?: number | null;
  bmr?: number | null;
  visceralFatLevel?: number | null;
  inbodyScore?: number | null;
  confidence: number;
  warnings: string[];
}

function extractContent(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('choices' in payload) || !Array.isArray(payload.choices)) return null;
  const choice = payload.choices[0];
  if (!choice || typeof choice !== 'object' || !('message' in choice)) return null;
  const message = choice.message;
  return message && typeof message === 'object' && 'content' in message && typeof message.content === 'string' ? message.content : null;
}

async function extractInBody(file: Express.Multer.File): Promise<InBodyExtraction> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Dịch vụ OCR InBody chưa được cấu hình.' });
  try {
    const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: APP_POLICY.AI_MODEL, temperature: 0,
        messages: [{ role: 'user', content: [
          { type: 'text', text: 'Trích xuất phiếu InBody thành JSON gồm weight, bmi, bodyFatPercentage, bodyFatMass, muscleMass, bmr, visceralFatLevel, inbodyScore, confidence và warnings. Chỉ trả JSON.' },
          { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` } },
        ] }],
      }),
    }, getEnv().PROVIDER_TIMEOUT_MS);
    const content = extractContent(await response.json());
    const match = content?.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('OCR provider không trả JSON hợp lệ');
    const parsed = JSON.parse(match[0]) as InBodyExtraction;
    if (!Number.isFinite(parsed.weight) || parsed.weight <= 0) throw new Error('OCR không đọc được cân nặng hợp lệ');
    return { ...parsed, confidence: Number(parsed.confidence || 0), warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [] };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'Không thể đọc phiếu InBody. Vui lòng nhập thủ công hoặc thử lại.', cause: error });
  }
}

export { extractInBody };
