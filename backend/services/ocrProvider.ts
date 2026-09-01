import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { APP_POLICY, getEnv } from '../config/env.js';
import { fetchWithTimeout } from './providerRequest.js';
import { withAiBilling } from './aiBillingService.js';
import type { AiBillingContext, ProviderResult, ProviderUsage } from './creditTypes.js';

export interface InBodyExtraction {
  weight: number;
  bmi?: number | null;
  bodyFatPercentage?: number | null;
  bodyFatMass?: number | null;
  muscleMass?: number | null;
  bmr?: number | null;
  visceralFatLevel?: number | null;
  inbodyScore?: number | null;
  bodyWater?: number | null;
  boneMineral?: number | null;
  waistHipRatio?: number | null;
  segmentalMuscle?: {
    rightArm?: number | null;
    leftArm?: number | null;
    trunk?: number | null;
    rightLeg?: number | null;
    leftLeg?: number | null;
  } | null;
  segmentalFat?: {
    rightArm?: number | null;
    leftArm?: number | null;
    trunk?: number | null;
    rightLeg?: number | null;
    leftLeg?: number | null;
  } | null;
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

function normalizedUsage(usage: { prompt_tokens?: unknown; completion_tokens?: unknown; total_tokens?: unknown; cost?: unknown } | undefined): ProviderUsage {
  const integer = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : undefined;
  const result: ProviderUsage = { inputTokens: integer(usage?.prompt_tokens), outputTokens: integer(usage?.completion_tokens), totalTokens: integer(usage?.total_tokens) };
  if (usage?.cost !== undefined) {
    const cost = Number(usage.cost);
    if (!Number.isFinite(cost) || cost < 0) throw new Error('OCR provider trả về chi phí không hợp lệ.');
    result.providerCostMicrousd = Math.round(cost * 1_000_000);
  }
  return result;
}

function normalizeInBodyWarning(warning: string): string {
  const w = warning.trim();
  const lower = w.toLowerCase();
  if (lower.includes('segmental fat') && lower.includes('estimated')) {
    return 'Chỉ số phân bố mỡ từng phần (tay, chân, thân) là giá trị ước tính từ thuật toán máy đo.';
  }
  if ((lower.includes('segmental lean') || lower.includes('segmental muscle')) && lower.includes('estimated')) {
    return 'Chỉ số phân bố cơ từng phần (tay, chân, thân) là giá trị ước tính từ thuật toán máy đo.';
  }
  if (lower.includes('ecw') && lower.includes('estimated')) {
    return 'Tỉ lệ nước ngoại bào (ECW/TBW) là số liệu ước tính từ điện trở kháng.';
  }
  if (lower.includes('body composition') && lower.includes('estimated')) {
    return 'Thành phần cơ thể là số liệu ước tính từ dòng điện sinh học BIA.';
  }
  if (lower.includes('impedance')) {
    return 'Dữ liệu trở kháng điện sinh học đo được từ các điện cực tiếp xúc.';
  }
  if (lower.includes('blurry') || lower.includes('blur') || lower.includes('unclear')) {
    return 'Ảnh chụp phiếu đo có vùng hơi mờ, PT vui lòng đối chiếu kỹ lại số đo trên phiếu gốc.';
  }
  if (lower.includes('confidence') && (lower.includes('low') || lower.includes('thấp'))) {
    return 'Độ nét của ảnh phiếu đo chưa cao, vui lòng rà soát lại các số liệu.';
  }
  return w;
}

async function extractInBodyRaw(file: Express.Multer.File): Promise<ProviderResult<InBodyExtraction>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Dịch vụ OCR InBody chưa được cấu hình.' });
  const ocrModel = process.env.OPENROUTER_OCR_MODEL || process.env.OCR_MODEL || APP_POLICY.OCR_MODEL;
  try {
    const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ocrModel, temperature: 0,
        messages: [{ role: 'user', content: [
          { type: 'text', text: 'Trích xuất phiếu InBody thành JSON gồm: weight, bmi, bodyFatPercentage, bodyFatMass, muscleMass, bmr, visceralFatLevel, inbodyScore, bodyWater, boneMineral, waistHipRatio, segmentalMuscle (rightArm, leftArm, trunk, rightLeg, leftLeg), segmentalFat (rightArm, leftArm, trunk, rightLeg, leftLeg), confidence (số thực từ 0.0 đến 1.0) và warnings (mảng chuỗi cảnh báo bằng tiếng Việt dễ hiểu nếu có, ví dụ: "Chỉ số mỡ từng phần là ước tính của máy đo", tuyệt đối không dùng tiếng Anh kỹ thuật như "Segmental fat is estimated"). Chỉ trả JSON thuần túy.' },
          { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` } },
        ] }],
      }),
    }, getEnv().PROVIDER_TIMEOUT_MS);
    const payload = await response.json() as { usage?: { prompt_tokens?: unknown; completion_tokens?: unknown; total_tokens?: unknown; cost?: unknown } };
    const content = extractContent(payload);
    const match = content?.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('OCR provider không trả JSON hợp lệ');
    const parsed = JSON.parse(match[0]) as InBodyExtraction;
    if (!Number.isFinite(parsed.weight) || parsed.weight <= 0) throw new Error('OCR không đọc được cân nặng hợp lệ');

    // Parse and sanitize confidence into [0, 1] range
    let rawConf = typeof parsed.confidence === 'number' ? parsed.confidence : parseFloat(String(parsed.confidence || '0.85'));
    if (!Number.isFinite(rawConf)) rawConf = 0.85;
    if (rawConf > 1 && rawConf <= 100) rawConf = rawConf / 100;
    const confidence = Math.min(Math.max(rawConf, 0), 1);

    const numOrNull = (val: unknown, min = 0, max = Infinity): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const n = Number(val);
      if (!Number.isFinite(n) || n < min || n > max) return null;
      return n;
    };

    const sanitizeSegment = (seg: unknown) => {
      if (!seg || typeof seg !== 'object') return null;
      const s = seg as Record<string, unknown>;
      return {
        rightArm: numOrNull(s.rightArm),
        leftArm: numOrNull(s.leftArm),
        trunk: numOrNull(s.trunk),
        rightLeg: numOrNull(s.rightLeg),
        leftLeg: numOrNull(s.leftLeg),
      };
    };

    const value: InBodyExtraction = {
      weight: Number(parsed.weight),
      bmi: numOrNull(parsed.bmi),
      bodyFatPercentage: numOrNull(parsed.bodyFatPercentage, 0, 100),
      bodyFatMass: numOrNull(parsed.bodyFatMass),
      muscleMass: numOrNull(parsed.muscleMass),
      bmr: numOrNull(parsed.bmr),
      visceralFatLevel: numOrNull(parsed.visceralFatLevel),
      inbodyScore: numOrNull(parsed.inbodyScore, 0, 100),
      bodyWater: numOrNull(parsed.bodyWater),
      boneMineral: numOrNull(parsed.boneMineral),
      waistHipRatio: numOrNull(parsed.waistHipRatio),
      segmentalMuscle: sanitizeSegment(parsed.segmentalMuscle),
      segmentalFat: sanitizeSegment(parsed.segmentalFat),
      confidence,
      warnings: Array.isArray(parsed.warnings)
        ? parsed.warnings.filter((w): w is string => typeof w === 'string').map(normalizeInBodyWarning)
        : [],
    };
    return { value, provider: 'openrouter', model: ocrModel, usage: normalizedUsage(payload.usage) };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'Không thể đọc phiếu InBody. Vui lòng nhập thủ công hoặc thử lại.', cause: error });
  }
}

export function extractInBody(context: AiBillingContext, file: Express.Multer.File): Promise<InBodyExtraction>;
export function extractInBody(file: Express.Multer.File): Promise<InBodyExtraction>;
export async function extractInBody(context: AiBillingContext | Express.Multer.File, file?: Express.Multer.File): Promise<InBodyExtraction> {
  if ('buffer' in context) return (await extractInBodyRaw(context)).value;
  return withAiBilling(context, () => extractInBodyRaw(file!));
}
