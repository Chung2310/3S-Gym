import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
import { generateText } from './aiProvider.js';

export type ExerciseGenerationMode = 'SINGLE' | 'BATCH';
export type ExerciseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ClassifiedTrackingType = 'STRENGTH' | 'BODYWEIGHT' | 'CARDIO' | 'INTERVAL' | 'MOBILITY';

export interface ExerciseGenerationInput {
  mode: ExerciseGenerationMode;
  muscleGroup: string;
  level: ExerciseLevel;
  defaultTrackingType: ClassifiedTrackingType;
  equipment: string[];
  quantity: number;
  additionalRequest: string;
}

export interface AiExerciseDraft {
  name: string;
  muscleGroup: string;
  level: ExerciseLevel;
  defaultTrackingType: ClassifiedTrackingType;
  equipment: string[];
  description: string;
  technique: string;
  commonMistakes: string[];
  contraindications: string[];
  variants: string[];
}

const levels = new Set<ExerciseLevel>(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
const trackingTypes = new Set<ClassifiedTrackingType>(['STRENGTH', 'BODYWEIGHT', 'CARDIO', 'INTERVAL', 'MOBILITY']);

function invalidOutput(): AppError {
  return new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về bài tập hợp lệ.' });
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try { return JSON.parse(trimmed); } catch {}
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  const objectStart = trimmed.indexOf('{');
  const objectEnd = trimmed.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    try { return JSON.parse(trimmed.slice(objectStart, objectEnd + 1)); } catch {}
  }
  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    try { return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1)); } catch {}
  }
  throw invalidOutput();
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(cleanString).filter(Boolean) : [];
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

function sanitizeCandidate(value: unknown): AiExerciseDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const name = cleanString(candidate.name);
  const muscleGroup = cleanString(candidate.muscleGroup);
  const level = cleanString(candidate.level) as ExerciseLevel;
  const defaultTrackingType = cleanString(candidate.defaultTrackingType) as ClassifiedTrackingType;
  if (!name || !muscleGroup || !levels.has(level) || !trackingTypes.has(defaultTrackingType)) return null;
  return {
    name,
    muscleGroup,
    level,
    defaultTrackingType,
    equipment: cleanArray(candidate.equipment),
    description: cleanString(candidate.description),
    technique: cleanString(candidate.technique),
    commonMistakes: cleanArray(candidate.commonMistakes),
    contraindications: cleanArray(candidate.contraindications),
    variants: cleanArray(candidate.variants),
  };
}

function buildPrompt(input: ExerciseGenerationInput): string {
  return `Trả về duy nhất JSON có dạng {"exercises": [...]} gồm đúng ${input.quantity} bài tập thể hình bằng tiếng Việt. Mỗi bài chỉ gồm name, muscleGroup, level, defaultTrackingType, equipment, description, technique, commonMistakes, contraindications, variants. Không trả về ID, scope, owner, video hoặc URL. Không lặp tên. Nhóm cơ: ${input.muscleGroup}. Cấp độ: ${input.level}. Cách ghi nhận: ${input.defaultTrackingType}. Thiết bị: ${input.equipment.join(', ') || 'không yêu cầu'}. Yêu cầu thêm: ${input.additionalRequest || 'không có'}. defaultTrackingType chỉ được là STRENGTH, BODYWEIGHT, CARDIO, INTERVAL hoặc MOBILITY. Nội dung phải an toàn, mô tả kỹ thuật rõ ràng và không chẩn đoán y khoa.`;
}

export async function generateExerciseDrafts(
  user: AuthenticatedUser,
  input: ExerciseGenerationInput,
  requestKey: string,
): Promise<{ drafts: AiExerciseDraft[]; discardedCount: number }> {
  const raw = await generateText(
    { userId: user.id, taskType: 'TEXT_WORKOUT', requestKey: `${requestKey}:text-exercise-generation` },
    buildPrompt(input),
  );
  const parsed = extractJson(raw);
  const candidates = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { exercises?: unknown }).exercises)
      ? (parsed as { exercises: unknown[] }).exercises
      : [];
  const names = new Set<string>();
  const drafts: AiExerciseDraft[] = [];
  for (const candidate of candidates) {
    const draft = sanitizeCandidate(candidate);
    if (!draft) continue;
    const normalized = normalizeName(draft.name);
    if (names.has(normalized)) continue;
    names.add(normalized);
    if (drafts.length < input.quantity) drafts.push(draft);
  }
  if (!drafts.length) throw invalidOutput();
  return { drafts, discardedCount: Math.max(0, candidates.length - drafts.length) };
}
