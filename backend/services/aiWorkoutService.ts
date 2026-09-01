import CustomerProfile from '../models/CustomerProfile.js';
import Goal from '../models/Goal.js';
import InBodyRecord from '../models/InBodyRecord.js';
import Exercise from '../models/Exercise.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { generateText, generateWorkoutDraft as callGenerateWorkoutDraft } from './aiProvider.js';
import type { AuthenticatedUser } from '../types/express.js';

export interface WorkoutProposal {
  durationWeeks: number;
  sessionsPerWeek: number;
  minutesPerSession: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  trainingMethod: string;
  trainingSplit: string;
  priorityMuscleGroups: string[];
  restrictions: string[];
}

export interface WorkoutGenerationInput { customerId: string; proposal: WorkoutProposal; additionalRequest?: string }

interface AiScheduledExercise {
  exerciseId?: string;
  generatedExerciseName?: string;
  weekNumber: number;
  dayNumber: number;
  startMinute: number;
  durationMinutes: number;
}

interface AiGeneratedExercise {
  name: string;
  muscleGroup: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  defaultTrackingType: 'STRENGTH' | 'BODYWEIGHT' | 'CARDIO' | 'INTERVAL' | 'MOBILITY';
  equipment?: string[];
  description?: string;
  technique?: string;
  commonMistakes?: string[];
  contraindications?: string[];
  variants?: string[];
}

const classifiedTrackingTypes = ['STRENGTH', 'BODYWEIGHT', 'CARDIO', 'INTERVAL', 'MOBILITY'] as const;
const normalizeExerciseName = (value: unknown) => String(value || '').trim().toLocaleLowerCase('vi');

function normalizeLevel(level: unknown): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
  const str = String(level || '').trim().toUpperCase();
  if (str.includes('BEGIN') || str.includes('MỚI') || str.includes('CƠ BẢN')) return 'BEGINNER';
  if (str.includes('ADVANC') || str.includes('NÂNG CAO')) return 'ADVANCED';
  return 'INTERMEDIATE';
}

const exerciseLibraryFor = (user: AuthenticatedUser) => Exercise.find({
  $and: [
    { $or: [{ scope: 'GLOBAL' }, { ownerPtId: user.id }] },
    { defaultTrackingType: { $in: classifiedTrackingTypes } },
  ],
}).sort({ name: 1 }).limit(200).select('_id name muscleGroup level equipment defaultTrackingType').lean();
const exerciseCatalog = (library: Awaited<ReturnType<typeof exerciseLibraryFor>>) => library.map((exercise) => ({
  exerciseId: String(exercise._id), name: exercise.name, muscleGroup: exercise.muscleGroup,
  level: exercise.level, equipment: exercise.equipment, trackingType: exercise.defaultTrackingType,
}));

function extractJson(raw: string): any {
  const trimmed = raw.trim();
  try { return JSON.parse(trimmed); } catch {}

  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1].trim()); } catch {}
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)); } catch {}
  }

  throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về giáo án hợp lệ.' });
}

function parseProposal(raw: string): WorkoutProposal {
  let value: unknown;
  try { value = extractJson(raw); } catch { throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về đề xuất hợp lệ.' }); }
  const proposal = (value && typeof value === 'object' ? value : {}) as Record<string, any>;
  const durationWeeks = Math.min(12, Math.max(4, Math.round(Number(proposal.durationWeeks) || 8)));
  const sessionsPerWeek = Math.min(7, Math.max(1, Math.round(Number(proposal.sessionsPerWeek) || 4)));
  const minutesPerSession = Math.min(240, Math.max(15, Math.round((Number(proposal.minutesPerSession) || 60) / 15) * 15));
  const level = normalizeLevel(proposal.level);
  const trainingMethod = typeof proposal.trainingMethod === 'string' && proposal.trainingMethod.trim() ? proposal.trainingMethod.trim() : 'Huấn luyện toàn diện';
  const trainingSplit = typeof proposal.trainingSplit === 'string' && proposal.trainingSplit.trim() ? proposal.trainingSplit.trim() : 'Toàn thân (Full Body)';
  const priorityMuscleGroups = Array.isArray(proposal.priorityMuscleGroups) ? proposal.priorityMuscleGroups.map(String) : [];
  const restrictions = Array.isArray(proposal.restrictions) ? proposal.restrictions.map(String) : [];
  return { durationWeeks, sessionsPerWeek, minutesPerSession, level, trainingMethod, trainingSplit, priorityMuscleGroups, restrictions };
}

export async function createWorkoutProposal(user: AuthenticatedUser, customerId: string, requestKey: string): Promise<WorkoutProposal> {
  const customer = await CustomerProfile.findOne({ _id: customerId, assignedPtId: user.id }).lean();
  if (!customer) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền tạo giáo án cho học viên này.' });
  const [goal, inbody, library] = await Promise.all([
    Goal.findOne({ customerId: customer._id }).sort({ createdAt: -1 }).lean(),
    InBodyRecord.findOne({ customerId: customer._id }).sort({ measurementDate: -1, createdAt: -1 }).lean(),
    exerciseLibraryFor(user),
  ]);
  const raw = await generateText({ userId: user.id, taskType: 'TEXT_WORKOUT', requestKey: `${requestKey}:text-workout-proposal` }, `Trả về duy nhất JSON đề xuất giáo án 4-12 tuần cho học viên ${customer.fullName}. Mục tiêu: ${goal?.title || customer.initialGoal || 'chưa có'}. InBody: ${inbody ? `cân nặng ${inbody.weight}, mỡ ${inbody.bodyFatPercentage ?? 'chưa có'}` : 'chưa có'}. Sức khỏe: ${customer.medicalNotes || 'không có'}. Hãy phân tích khả năng đáp ứng của thư viện bài tập hiện có của PT khi đề xuất phương pháp và lịch tập; ưu tiên các bài phù hợp trong thư viện, chỉ dự kiến tạo bài mới nếu thật sự thiếu. Thư viện: ${JSON.stringify(exerciseCatalog(library))}. JSON gồm: durationWeeks (4-12), sessionsPerWeek (1-7), minutesPerSession (15-240), level (BEGINNER | INTERMEDIATE | ADVANCED), trainingMethod (chuỗi), trainingSplit (chuỗi), priorityMuscleGroups (mảng chuỗi), restrictions (mảng chuỗi).`);
  return parseProposal(raw);
}

export async function generateWorkoutDraft(user: AuthenticatedUser, input: WorkoutGenerationInput, requestKey: string) {
  const customer = await CustomerProfile.findOne({ _id: input.customerId, assignedPtId: user.id }).lean();
  if (!customer) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền tạo giáo án cho học viên này.' });
  const proposal = input.proposal;
  if (proposal.durationWeeks < 4 || proposal.durationWeeks > 12) throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Chu kỳ AI phải từ 4 đến 12 tuần.' });
  const library = await exerciseLibraryFor(user);
  const raw = await callGenerateWorkoutDraft({ userId: user.id, taskType: 'TEXT_WORKOUT', requestKey: `${requestKey}:text-workout-draft` }, `Trả về duy nhất JSON giáo án cho ${customer.fullName}:
- title: Tiêu đề giáo án (ví dụ: "Giáo án ${proposal.trainingSplit} ${proposal.durationWeeks} tuần")
- goal: Mục tiêu ngắn gọn
- level: BEGINNER | INTERMEDIATE | ADVANCED
- durationWeeks: ${proposal.durationWeeks}
- sessionsPerWeek: ${proposal.sessionsPerWeek}
- minutesPerSession: ${proposal.minutesPerSession}
- scheduledExercises: Lịch tập tuần mẫu (weekNumber luôn đặt là 1) gồm đúng ${proposal.sessionsPerWeek} ngày tập phân bổ trong tuần (dayNumber từ 1 đến 7). Mỗi ngày tập gồm 4-6 bài tập phù hợp với thời lượng ${proposal.minutesPerSession} phút. Mỗi phần tử chỉ gồm { exerciseId, weekNumber: 1, dayNumber, startMinute, durationMinutes } hoặc { generatedExerciseName, weekNumber: 1, dayNumber, startMinute, durationMinutes }. Không trả về trackingType hay prescription trong lịch.
- generatedExercises: Tối đa 2-3 bài tập mới nếu thư viện thiếu (nếu thư viện đã đủ thì để mảng rỗng []). Mỗi bài gồm { name, muscleGroup, level, defaultTrackingType, equipment, description, technique, commonMistakes, contraindications, variants }. defaultTrackingType chỉ là STRENGTH, BODYWEIGHT, CARDIO, INTERVAL hoặc MOBILITY.
Thời gian dùng bước 15 phút không trùng nhau.
Cấu hình: ${JSON.stringify(proposal)}. Yêu cầu PT: ${input.additionalRequest || 'không có'}. Thư viện: ${JSON.stringify(exerciseCatalog(library))}.`);

  const draft = extractJson(raw);
  if (!draft || typeof draft !== 'object') throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về giáo án hợp lệ.' });

  if (!Array.isArray(draft.scheduledExercises)) {
    draft.scheduledExercises = Array.isArray(draft.schedule)
      ? draft.schedule
      : Array.isArray(draft.exercises)
        ? draft.exercises
        : [];
  }
  if (!Array.isArray(draft.generatedExercises)) {
    draft.generatedExercises = Array.isArray(draft.newExercises)
      ? draft.newExercises
      : [];
  }

  draft.title = draft.title || `Giáo án ${proposal.trainingSplit} (${proposal.durationWeeks} tuần)`;
  draft.goal = draft.goal || customer.initialGoal || 'Cải thiện thể lực toàn diện';
  draft.durationWeeks = proposal.durationWeeks;
  draft.sessionsPerWeek = proposal.sessionsPerWeek;
  draft.minutesPerSession = proposal.minutesPerSession;
  draft.level = normalizeLevel(draft.level || proposal.level);

  const libraryById = new Map(library.map((exercise) => [String(exercise._id), exercise]));
  const libraryByName = new Map(library.map((exercise) => [normalizeExerciseName(exercise.name), exercise]));
  const generatedExercises = (draft.generatedExercises as AiGeneratedExercise[]).map((exercise) => {
    const name = exercise?.name?.trim() || 'Bài tập mới';
    const muscleGroup = exercise?.muscleGroup?.trim() || 'Toàn thân';
    const level = normalizeLevel(exercise?.level);
    const defaultTrackingType = classifiedTrackingTypes.includes(exercise?.defaultTrackingType) ? exercise.defaultTrackingType : 'STRENGTH';
    return { name, muscleGroup, level, defaultTrackingType, equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [], description: exercise.description || '', technique: exercise.technique || '', commonMistakes: Array.isArray(exercise.commonMistakes) ? exercise.commonMistakes : [], contraindications: Array.isArray(exercise.contraindications) ? exercise.contraindications : [], variants: Array.isArray(exercise.variants) ? exercise.variants : [] };
  }).filter((exercise) => !libraryByName.has(normalizeExerciseName(exercise.name)));
  const generatedByName = new Map(generatedExercises.map((exercise) => [normalizeExerciseName(exercise.name), exercise]));

  const scheduledExercises = (draft.scheduledExercises as AiScheduledExercise[]).map((item) => {
    const existingExercise = item.exerciseId ? libraryById.get(String(item.exerciseId)) : libraryByName.get(normalizeExerciseName(item.generatedExerciseName || (item as any).name));
    const generatedExercise = item.generatedExerciseName ? generatedByName.get(normalizeExerciseName(item.generatedExerciseName)) : undefined;
    const exerciseName = existingExercise?.name || generatedExercise?.name || item.generatedExerciseName || (item as any).name || 'Bài tập thể lực';
    const trackingType = existingExercise?.defaultTrackingType || generatedExercise?.defaultTrackingType || 'STRENGTH';
    const weekNumber = Math.min(proposal.durationWeeks, Math.max(1, Math.round(Number(item.weekNumber) || 1)));
    const dayNumber = Math.min(7, Math.max(1, Math.round(Number(item.dayNumber) || 1)));
    const startMinute = Math.min(1425, Math.max(0, Math.round((Number(item.startMinute) || 0) / 15) * 15));
    const durationMinutes = Math.min(1440 - startMinute, Math.max(15, Math.round((Number(item.durationMinutes) || 30) / 15) * 15));
    return {
      ...(existingExercise ? { exerciseId: String(existingExercise._id) } : {}),
      name: exerciseName,
      trackingType,
      prescription: {},
      weekNumber,
      dayNumber,
      startMinute,
      durationMinutes,
    };
  });
  const sortedSchedule = [...scheduledExercises].sort((left, right) => left.weekNumber - right.weekNumber || left.dayNumber - right.dayNumber || left.startMinute - right.startMinute);
  for (let index = 1; index < sortedSchedule.length; index += 1) {
    const previous = sortedSchedule[index - 1];
    const current = sortedSchedule[index];
    if (previous.weekNumber === current.weekNumber && previous.dayNumber === current.dayNumber && current.startMinute < previous.startMinute + previous.durationMinutes) {
      current.startMinute = Math.min(1440 - current.durationMinutes, previous.startMinute + previous.durationMinutes);
    }
  }

  // Nếu AI chỉ sinh lịch cho tuần mẫu (week 1), nhân bản sang các tuần còn lại của chu kỳ
  const distinctWeeks = new Set(sortedSchedule.map((s) => s.weekNumber));
  let finalSchedule = sortedSchedule;
  if (distinctWeeks.size === 1 && proposal.durationWeeks > 1) {
    finalSchedule = [];
    for (let w = 1; w <= proposal.durationWeeks; w++) {
      for (const item of sortedSchedule) {
        finalSchedule.push({ ...item, weekNumber: w });
      }
    }
  }

  return { ...draft, scheduledExercises: finalSchedule, generatedExercises };
}
