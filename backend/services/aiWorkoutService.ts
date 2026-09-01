import CustomerProfile from '../models/CustomerProfile.js';
import Goal from '../models/Goal.js';
import InBodyRecord from '../models/InBodyRecord.js';
import Exercise from '../models/Exercise.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { generateText } from './aiProvider.js';
import {
  availabilityProposalDefaults,
  normalizeWorkoutSessionTimings,
  scheduleWorkoutSessions,
} from './workoutAvailabilityScheduler.js';
import type { AuthenticatedUser } from '../types/express.js';
import type { WorkoutAvailabilitySlot } from '../types/workoutAvailability.js';

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

export interface WorkoutGenerationInput {
  customerId: string;
  proposal: WorkoutProposal;
  availabilitySlots: WorkoutAvailabilitySlot[];
  additionalRequest?: string;
}

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
const availabilityPrompt = (slots: WorkoutAvailabilitySlot[]) => {
  const dayCount = new Set(slots.map((slot) => slot.dayNumber)).size;
  const defaults = availabilityProposalDefaults(slots);
  const durations = slots.map((slot) => (
    `ngày ${slot.dayNumber}: ${slot.endMinute - slot.startMinute} phút`
  )).join(', ');
  return `${dayCount} ngày rảnh, ${slots.length} khung giờ (${durations}). Cấu hình tự tính bắt buộc: ${defaults.sessionsPerWeek} buổi/tuần, ${defaults.minutesPerSession} phút/buổi. Dữ liệu: ${JSON.stringify(slots)}`;
};

function parseProposal(
  raw: string,
  defaults: Pick<WorkoutProposal, 'sessionsPerWeek' | 'minutesPerSession'>,
): WorkoutProposal {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về đề xuất hợp lệ.' });
  let value: unknown;
  try { value = JSON.parse(match[0]); } catch { throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về đề xuất hợp lệ.' }); }
  const proposal = {
    ...(value as Partial<WorkoutProposal>),
    ...defaults,
  };
  if (!Number.isInteger(proposal.durationWeeks) || proposal.durationWeeks! < 4 || proposal.durationWeeks! > 12 || !Number.isInteger(proposal.sessionsPerWeek) || proposal.sessionsPerWeek! < 1 || proposal.sessionsPerWeek! > 7 || !Number.isInteger(proposal.minutesPerSession) || proposal.minutesPerSession! < 15 || proposal.minutesPerSession! > 240 || !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(String(proposal.level)) || typeof proposal.trainingMethod !== 'string' || typeof proposal.trainingSplit !== 'string' || !Array.isArray(proposal.priorityMuscleGroups) || !Array.isArray(proposal.restrictions)) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI trả về đề xuất thiếu hoặc sai dữ liệu.' });
  return proposal as WorkoutProposal;
}

export async function createWorkoutProposal(
  user: AuthenticatedUser,
  customerId: string,
  availabilitySlots: WorkoutAvailabilitySlot[],
  requestKey: string,
): Promise<WorkoutProposal> {
  const customer = await CustomerProfile.findOne({ _id: customerId, assignedPtId: user.id }).lean();
  if (!customer) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền tạo giáo án cho học viên này.' });
  const [goal, inbody, library] = await Promise.all([
    Goal.findOne({ customerId: customer._id }).sort({ createdAt: -1 }).lean(),
    InBodyRecord.findOne({ customerId: customer._id }).sort({ measurementDate: -1, createdAt: -1 }).lean(),
    exerciseLibraryFor(user),
  ]);
  const proposalDefaults = availabilityProposalDefaults(availabilitySlots);
  const raw = await generateText({ userId: user.id, taskType: 'TEXT_WORKOUT', requestKey: `${requestKey}:text-workout-proposal` }, `Trả về duy nhất JSON đề xuất giáo án 4-12 tuần cho học viên ${customer.fullName}. Mục tiêu: ${goal?.title || customer.initialGoal || 'chưa có'}. InBody: ${inbody ? `cân nặng ${inbody.weight}, mỡ ${inbody.bodyFatPercentage ?? 'chưa có'}` : 'chưa có'}. Sức khỏe: ${customer.medicalNotes || 'không có'}. Khung giờ rảnh lặp lại mỗi tuần, dayNumber từ 1 đến 7 và thời gian tính bằng phút: ${availabilityPrompt(availabilitySlots)}. Mỗi ngày chỉ xếp tối đa một buổi tập; dùng đúng sessionsPerWeek và minutesPerSession đã được hệ thống tự tính. Hãy phân tích khả năng đáp ứng của thư viện bài tập hiện có của PT khi đề xuất phương pháp và lịch tập; ưu tiên các bài phù hợp trong thư viện, chỉ dự kiến tạo bài mới nếu thật sự thiếu. Thư viện: ${JSON.stringify(exerciseCatalog(library))}. JSON gồm durationWeeks, sessionsPerWeek, minutesPerSession, level, trainingMethod, trainingSplit, priorityMuscleGroups, restrictions.`);
  return parseProposal(raw, proposalDefaults);
}

export async function generateWorkoutDraft(user: AuthenticatedUser, input: WorkoutGenerationInput, requestKey: string) {
  const customer = await CustomerProfile.findOne({ _id: input.customerId, assignedPtId: user.id }).lean();
  if (!customer) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền tạo giáo án cho học viên này.' });
  const proposal = input.proposal;
  if (proposal.durationWeeks < 4 || proposal.durationWeeks > 12) throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Chu kỳ AI phải từ 4 đến 12 tuần.' });
  const library = await exerciseLibraryFor(user);
  const raw = await generateText({ userId: user.id, taskType: 'TEXT_WORKOUT', requestKey: `${requestKey}:text-workout-draft` }, `Trả về duy nhất JSON giáo án cho ${customer.fullName}: title, goal, level, durationWeeks, sessionsPerWeek, minutesPerSession, scheduledExercises, generatedExercises. Khung giờ rảnh lặp lại mỗi tuần, dayNumber từ 1 đến 7 và thời gian tính bằng phút: ${availabilityPrompt(input.availabilitySlots)}. Mỗi ngày chỉ có tối đa một buổi tập; ưu tiên xếp nguyên buổi vào một khung giờ rảnh đủ dài. Nếu lịch rảnh không đủ, vẫn tạo đầy đủ số buổi và hệ thống sẽ sắp lại, cảnh báo PT. Ưu tiên tối đa bài phù hợp trong thư viện. Bài có sẵn: scheduledExercises dùng exerciseId. Chỉ khi không có bài phù hợp mới tạo bài mới: thêm đầy đủ vào generatedExercises và scheduledExercises tham chiếu bằng generatedExerciseName trùng chính xác tên bài mới. Mỗi scheduledExercises chỉ gồm exerciseId hoặc generatedExerciseName (chỉ một trong hai), weekNumber, dayNumber, startMinute, durationMinutes; không trả về trackingType, prescription hay thông số mục tiêu trong lịch. durationMinutes là thời lượng riêng của từng bài, không phải thời lượng cả buổi. Các bài cùng tuần và ngày phải nối tiếp nhau, không trùng giờ; tổng thời lượng của chúng không vượt quá ${proposal.minutesPerSession} phút. Mỗi generatedExercises gồm name, muscleGroup, level, defaultTrackingType, equipment, description, technique, commonMistakes, contraindications, variants; defaultTrackingType chỉ là STRENGTH, BODYWEIGHT, CARDIO, INTERVAL hoặc MOBILITY. Ngày không có bài là ngày nghỉ hợp lệ. Thời gian dùng bước 15 phút và không trùng nhau. Cấu hình: ${JSON.stringify(proposal)}. Yêu cầu PT: ${input.additionalRequest || 'không có'}. Thư viện: ${JSON.stringify(exerciseCatalog(library))}.`);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về giáo án hợp lệ.' });
  let draft: any;
  try { draft = JSON.parse(match[0]); } catch { throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về giáo án hợp lệ.' }); }
  if (!draft?.title || !Array.isArray(draft.scheduledExercises) || !Array.isArray(draft.generatedExercises) || draft.durationWeeks !== proposal.durationWeeks) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI trả về giáo án thiếu hoặc sai dữ liệu.' });
  const libraryById = new Map(library.map((exercise) => [String(exercise._id), exercise]));
  const libraryByName = new Map(library.map((exercise) => [normalizeExerciseName(exercise.name), exercise]));
  const generatedExercises = (draft.generatedExercises as AiGeneratedExercise[]).map((exercise) => {
    if (!exercise?.name?.trim() || !exercise.muscleGroup?.trim() || !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(exercise.level) || !classifiedTrackingTypes.includes(exercise.defaultTrackingType)) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI trả về bài tập mới thiếu thông tin hoặc cách ghi nhận không hợp lệ.' });
    return { name: exercise.name.trim(), muscleGroup: exercise.muscleGroup.trim(), level: exercise.level, defaultTrackingType: exercise.defaultTrackingType, equipment: Array.isArray(exercise.equipment) ? exercise.equipment : [], description: exercise.description || '', technique: exercise.technique || '', commonMistakes: Array.isArray(exercise.commonMistakes) ? exercise.commonMistakes : [], contraindications: Array.isArray(exercise.contraindications) ? exercise.contraindications : [], variants: Array.isArray(exercise.variants) ? exercise.variants : [] };
  }).filter((exercise) => !libraryByName.has(normalizeExerciseName(exercise.name)));
  const generatedByName = new Map(generatedExercises.map((exercise) => [normalizeExerciseName(exercise.name), exercise]));
  const scheduledExercises = (draft.scheduledExercises as AiScheduledExercise[]).map((item) => {
    const existingExercise = item.exerciseId ? libraryById.get(String(item.exerciseId)) : libraryByName.get(normalizeExerciseName(item.generatedExerciseName));
    const generatedExercise = item.generatedExerciseName ? generatedByName.get(normalizeExerciseName(item.generatedExerciseName)) : undefined;
    const hasExactlyOneReference = Boolean(item.exerciseId) !== Boolean(item.generatedExerciseName);
    if (!hasExactlyOneReference || (!existingExercise && !generatedExercise) || !Number.isInteger(item.weekNumber) || item.weekNumber < 1 || item.weekNumber > proposal.durationWeeks || !Number.isInteger(item.dayNumber) || item.dayNumber < 1 || item.dayNumber > 7 || !Number.isInteger(item.startMinute) || item.startMinute < 0 || item.startMinute > 1425 || item.startMinute % 15 || !Number.isInteger(item.durationMinutes) || item.durationMinutes < 15 || item.durationMinutes % 15 || item.startMinute + item.durationMinutes > 1440) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI trả về lịch tập không hợp lệ hoặc tham chiếu bài tập không tồn tại.' });
    const exercise = existingExercise || generatedExercise!;
    return {
      ...(existingExercise ? { exerciseId: String(existingExercise._id) } : {}),
      name: exercise.name,
      trackingType: exercise.defaultTrackingType,
      prescription: {},
      weekNumber: item.weekNumber,
      dayNumber: item.dayNumber,
      startMinute: item.startMinute,
      durationMinutes: item.durationMinutes,
    };
  });
  const normalizedExercises = normalizeWorkoutSessionTimings(
    scheduledExercises,
    proposal.minutesPerSession,
  );
  const scheduled = scheduleWorkoutSessions(
    normalizedExercises,
    input.availabilitySlots,
    proposal.sessionsPerWeek,
  );
  return {
    ...draft,
    scheduledExercises: scheduled.scheduledExercises,
    availabilitySlots: input.availabilitySlots,
    scheduleWarnings: scheduled.scheduleWarnings,
    generatedExercises,
  };
}
