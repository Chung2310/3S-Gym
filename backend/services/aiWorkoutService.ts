import CustomerProfile from '../models/CustomerProfile.js';
import Goal from '../models/Goal.js';
import InBodyRecord from '../models/InBodyRecord.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { generateText } from './aiProvider.js';
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

function parseProposal(raw: string): WorkoutProposal {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về đề xuất hợp lệ.' });
  let value: unknown;
  try { value = JSON.parse(match[0]); } catch { throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về đề xuất hợp lệ.' }); }
  const proposal = value as Partial<WorkoutProposal>;
  if (!Number.isInteger(proposal.durationWeeks) || proposal.durationWeeks! < 4 || proposal.durationWeeks! > 12 || !Number.isInteger(proposal.sessionsPerWeek) || proposal.sessionsPerWeek! < 1 || proposal.sessionsPerWeek! > 7 || !Number.isInteger(proposal.minutesPerSession) || proposal.minutesPerSession! < 15 || proposal.minutesPerSession! > 240 || !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(String(proposal.level)) || typeof proposal.trainingMethod !== 'string' || typeof proposal.trainingSplit !== 'string' || !Array.isArray(proposal.priorityMuscleGroups) || !Array.isArray(proposal.restrictions)) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI trả về đề xuất thiếu hoặc sai dữ liệu.' });
  return proposal as WorkoutProposal;
}

export async function createWorkoutProposal(user: AuthenticatedUser, customerId: string, requestKey: string): Promise<WorkoutProposal> {
  const customer = await CustomerProfile.findOne({ _id: customerId, assignedPtId: user.id }).lean();
  if (!customer) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền tạo giáo án cho học viên này.' });
  const [goal, inbody] = await Promise.all([
    Goal.findOne({ customerId: customer._id }).sort({ createdAt: -1 }).lean(),
    InBodyRecord.findOne({ customerId: customer._id }).sort({ measurementDate: -1, createdAt: -1 }).lean(),
  ]);
  const raw = await generateText({ userId: user.id, taskType: 'TEXT_WORKOUT', requestKey: `${requestKey}:text-workout-proposal` }, `Trả về duy nhất JSON đề xuất giáo án 4-12 tuần cho học viên ${customer.fullName}. Mục tiêu: ${goal?.title || customer.initialGoal || 'chưa có'}. InBody: ${inbody ? `cân nặng ${inbody.weight}, mỡ ${inbody.bodyFatPercentage ?? 'chưa có'}` : 'chưa có'}. Sức khỏe: ${customer.medicalNotes || 'không có'}. JSON gồm durationWeeks, sessionsPerWeek, minutesPerSession, level, trainingMethod, trainingSplit, priorityMuscleGroups, restrictions.`);
  return parseProposal(raw);
}

export async function generateWorkoutDraft(user: AuthenticatedUser, input: WorkoutGenerationInput, requestKey: string) {
  const customer = await CustomerProfile.findOne({ _id: input.customerId, assignedPtId: user.id }).lean();
  if (!customer) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền tạo giáo án cho học viên này.' });
  const proposal = input.proposal;
  if (proposal.durationWeeks < 4 || proposal.durationWeeks > 12) throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Chu kỳ AI phải từ 4 đến 12 tuần.' });
  const raw = await generateText({ userId: user.id, taskType: 'TEXT_WORKOUT', requestKey: `${requestKey}:text-workout-draft` }, `Trả về duy nhất JSON giáo án cho ${customer.fullName}: title, goal, level, durationWeeks, sessionsPerWeek, minutesPerSession, scheduledExercises, generatedExercises. Mỗi scheduledExercises có weekNumber, dayNumber, startMinute, durationMinutes, name, trackingType và prescription đúng loại. trackingType chỉ là STRENGTH, BODYWEIGHT, CARDIO, INTERVAL hoặc MOBILITY. Cấu hình đã duyệt: ${JSON.stringify(proposal)}. Yêu cầu PT: ${input.additionalRequest || 'không có'}.`);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về giáo án hợp lệ.' });
  let draft: any;
  try { draft = JSON.parse(match[0]); } catch { throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI không trả về giáo án hợp lệ.' }); }
  if (!draft?.title || !Array.isArray(draft.scheduledExercises) || !Array.isArray(draft.generatedExercises) || draft.durationWeeks !== proposal.durationWeeks) throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI trả về giáo án thiếu hoặc sai dữ liệu.' });
  for (const item of draft.scheduledExercises) if (!Number.isInteger(item.weekNumber) || item.weekNumber < 1 || item.weekNumber > proposal.durationWeeks || !Number.isInteger(item.dayNumber) || item.dayNumber < 1 || item.dayNumber > 7 || !Number.isInteger(item.startMinute) || item.startMinute % 15 || !Number.isInteger(item.durationMinutes) || item.durationMinutes < 15 || !item.name || !['STRENGTH', 'BODYWEIGHT', 'CARDIO', 'INTERVAL', 'MOBILITY'].includes(item.trackingType) || !item.prescription || typeof item.prescription !== 'object') throw new AppError({ status: 502, code: ERROR_CODES.EXTERNAL, message: 'AI trả về lịch tập không hợp lệ.' });
  return draft;
}
