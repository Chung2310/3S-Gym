import mongoose, { Types } from 'mongoose';
import CustomerProfile from '../models/CustomerProfile.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutTemplate from '../models/WorkoutTemplate.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';

function fail(message: string, status: number) {
  return new AppError({ message, status, code: status === 404 ? ERROR_CODES.NOT_FOUND : status === 403 ? ERROR_CODES.AUTHORIZATION : ERROR_CODES.VALIDATION });
}

async function assertCustomerAccess(user: AuthenticatedUser, customerId: string) {
  const filter: Record<string, unknown> = { _id: customerId };
  if (user.role === 'PT') filter.assignedPtId = user.id;
  const customer = await CustomerProfile.findOne(filter);
  if (!customer) throw fail('Không tìm thấy khách hàng.', 404);
  return customer;
}

function snapshotFields(template: Record<string, any>) {
  return {
    sourceTemplateId: template._id,
    title: template.title,
    goal: template.goal,
    level: template.level,
    durationDays: template.durationDays,
    muscleGroups: template.muscleGroups,
    defaultSets: template.defaultSets,
    defaultReps: template.defaultReps,
    defaultWeight: template.defaultWeight,
    defaultTempo: template.defaultTempo,
    technicalNotes: template.technicalNotes,
    scheduledExercises: template.scheduledExercises,
    unscheduledExercises: template.unscheduledExercises,
    sessions: template.sessions,
  };
}

function exercisesFromPlan(plan: Record<string, any>) {
  return [
    ...(plan.scheduledExercises || []),
    ...(plan.unscheduledExercises || []),
    ...(plan.sessions || []).flatMap((session: Record<string, any>) => session.exercises || []),
  ] as Array<Record<string, any>>;
}

function assertClassifiedPlan(plan: Record<string, any>) {
  const exercise = exercisesFromPlan(plan).find((item) => !item.trackingType || item.trackingType === 'UNCLASSIFIED');
  if (exercise) throw fail(`Hãy phân loại cách ghi nhận cho bài tập "${String(exercise.name || 'Chưa đặt tên')}" trước khi lưu giáo án.`, 400);
}

async function supportsTransactions() {
  const hello = await mongoose.connection.db?.command({ hello: 1 });
  return Boolean(hello?.setName || hello?.msg === 'isdbgrid');
}

async function assignWithoutTransaction(user: AuthenticatedUser, customerId: string, template: Record<string, any>, now: Date) {
  const active = await WorkoutPlan.findOne({ customerId, lifecycleStatus: 'ACTIVE' });
  if (!active) {
    return WorkoutPlan.create({
      customerId: new Types.ObjectId(customerId), ptId: new Types.ObjectId(user.id), ...snapshotFields(template),
      lifecycleStatus: 'ACTIVE', assignedAt: now, archivedAt: null, status: 'DRAFT', publishedAt: null,
    });
  }

  const previous = active.toObject();
  const { _id: _previousId, createdAt: _createdAt, updatedAt: _updatedAt, ...historyFields } = previous;
  const archived = await WorkoutPlan.create({ ...historyFields, lifecycleStatus: 'ARCHIVED', archivedAt: now });
  try {
    active.set({
      ...snapshotFields(template), ptId: new Types.ObjectId(user.id), lifecycleStatus: 'ACTIVE', assignedAt: now,
      archivedAt: null, status: 'DRAFT', publishedAt: null,
    });
    return await active.save();
  } catch (error) {
    await archived.deleteOne();
    throw error;
  }
}

export async function listCustomerWorkoutPlans(user: AuthenticatedUser, customerId: string) {
  await assertCustomerAccess(user, customerId);
  const [active, history] = await Promise.all([
    WorkoutPlan.findOne({ customerId, lifecycleStatus: 'ACTIVE' }).lean(),
    WorkoutPlan.find({ customerId, lifecycleStatus: 'ARCHIVED' }).sort({ archivedAt: -1 }).lean(),
  ]);
  return { active, history };
}

export async function assignCustomerWorkoutPlan(user: AuthenticatedUser, customerId: string, templateId: string) {
  await assertCustomerAccess(user, customerId);
  const template = await WorkoutTemplate.findOne({ _id: templateId, ownerPtId: user.id }).lean();
  if (!template) throw fail('Không tìm thấy giáo án mẫu.', 404);
  assertClassifiedPlan(template);
  const now = new Date();
  if (!(await supportsTransactions())) return assignWithoutTransaction(user, customerId, template, now);
  const session = await mongoose.startSession();
  try {
    let assigned;
    await session.withTransaction(async () => {
      await WorkoutPlan.updateOne({ customerId, lifecycleStatus: 'ACTIVE' }, { lifecycleStatus: 'ARCHIVED', archivedAt: now }, { session });
      [assigned] = await WorkoutPlan.create([{
        customerId: new Types.ObjectId(customerId), ptId: new Types.ObjectId(user.id), ...snapshotFields(template),
        lifecycleStatus: 'ACTIVE', assignedAt: now, archivedAt: null, status: 'DRAFT', publishedAt: null,
      }], { session });
    });
    return assigned!;
  } finally { await session.endSession(); }
}

export async function getCustomerWorkoutPlan(user: AuthenticatedUser, customerId: string, planId: string) {
  await assertCustomerAccess(user, customerId);
  const plan = await WorkoutPlan.findOne({ _id: planId, customerId }).populate('customerId', 'fullName phone');
  if (!plan) throw fail('Không tìm thấy giáo án khách hàng.', 404);
  return plan;
}

export async function updateCustomerWorkoutPlan(user: AuthenticatedUser, customerId: string, planId: string, payload: Record<string, unknown>) {
  const plan = await getCustomerWorkoutPlan(user, customerId, planId);
  if (plan.get('lifecycleStatus') !== 'ACTIVE') throw fail('Không thể sửa giáo án đã lưu trong lịch sử.', 409);
  assertClassifiedPlan({ ...plan.toObject(), ...payload });
  const mutable = ['title', 'goal', 'level', 'durationDays', 'muscleGroups', 'defaultSets', 'defaultReps', 'defaultWeight', 'defaultTempo', 'technicalNotes', 'scheduledExercises', 'unscheduledExercises', 'sessions'];
  for (const field of mutable) if (Object.prototype.hasOwnProperty.call(payload, field)) plan.set(field, payload[field]);
  return plan.save();
}
