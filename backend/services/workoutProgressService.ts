import { Types } from 'mongoose';
import WorkoutTemplate from '../models/WorkoutTemplate.js';
import WorkoutSession from '../models/WorkoutSession.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import CustomerProfile from '../models/CustomerProfile.js';
import PtPackage from '../models/PtPackage.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';

interface TemplatePayload { title: string; goal: string; level: string; sessions: Array<Record<string, unknown>> }
interface SessionPayload {
  customerId: string; templateId: string; sessionIndex: number; performedAt: string; attendance: 'PRESENT' | 'ABSENT' | 'LATE';
  idempotencyKey: string; exerciseLogs?: Array<Record<string, unknown>>; absenceReason?: string; feeling?: string; notes?: string;
}
interface MeasurementPayload { customerId: string; measuredAt: string; weight?: number; bodyFatPercentage?: number; muscleMass?: number; measurements?: Record<string, number> }

const fail = (message: string, status: number) => new AppError({ message, status, code: status === 403 ? ERROR_CODES.AUTHORIZATION : ERROR_CODES.NOT_FOUND });
async function customerFor(user: AuthenticatedUser, id: string) {
  const customer = await CustomerProfile.findById(id);
  if (!customer) throw fail('Không tìm thấy khách hàng.', 404);
  if (user.role === 'PT' && String(customer.assignedPtId) !== user.id) throw fail('Bạn không có quyền quản lý khách hàng này.', 403);
  return customer;
}
async function createTemplate(user: AuthenticatedUser, payload: TemplatePayload) {
  return WorkoutTemplate.create({ ...payload, ownerPtId: user.id, version: 1, status: 'ACTIVE' });
}
async function listTemplates(user: AuthenticatedUser, query: Record<string, unknown>) {
  const page = Number(query.page || 1); const limit = Number(query.limit || 20);
  const filter: Record<string, unknown> = user.role === 'PT' ? { ownerPtId: new Types.ObjectId(user.id) } : {};
  if (query.status === 'ACTIVE' || query.status === 'ARCHIVED') filter.status = query.status;
  if (typeof query.goal === 'string') filter.goal = query.goal;
  if (typeof query.level === 'string') filter.level = query.level;
  const [items, total] = await Promise.all([
    WorkoutTemplate.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    WorkoutTemplate.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
async function updateTemplate(user: AuthenticatedUser, id: string, payload: Partial<TemplatePayload>) {
  const filter = { _id: id, ...(user.role === 'PT' ? { ownerPtId: new Types.ObjectId(user.id) } : {}) };
  const template = await WorkoutTemplate.findOne(filter);
  if (!template) throw fail('Workout template not found.', 404);
  for (const field of ['title', 'goal', 'level', 'sessions'] as const) if (payload[field] !== undefined) template.set(field, payload[field]);
  template.version += 1;
  return template.save();
}
async function createSession(user: AuthenticatedUser, payload: SessionPayload) {
  const ptId = new Types.ObjectId(user.id);
  const customerId = new Types.ObjectId(payload.customerId);
  const templateId = new Types.ObjectId(payload.templateId);
  const existing = await WorkoutSession.findOne({ ptId, idempotencyKey: payload.idempotencyKey });
  if (existing) return { session: existing, created: false };
  await customerFor(user, String(payload.customerId));
  const template = await WorkoutTemplate.findOne({ _id: templateId, ownerPtId: ptId }).lean();
  if (!template) throw fail('Không tìm thấy giáo án mẫu.', 404);
  const sessionIndex = Number(payload.sessionIndex);
  const selectedSession = template.sessions[sessionIndex];
  if (!selectedSession) throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Buổi tập trong giáo án không hợp lệ.' });
  const session = await WorkoutSession.create({
    ...payload, ptId: user.id, planSnapshot: { templateId: template._id, title: template.title, version: template.version, session: selectedSession },
  });
  if (payload.attendance === 'PRESENT' || payload.attendance === 'LATE') {
    const selectedPackage = await PtPackage.findOne({ customerId, status: 'ACTIVE', remainingSessions: { $gt: 0 } }).sort({ endDate: 1 });
    if (selectedPackage) {
      const completing = selectedPackage.remainingSessions === 1;
      await PtPackage.updateOne({ _id: selectedPackage._id, remainingSessions: selectedPackage.remainingSessions }, { $inc: { usedSessions: 1, remainingSessions: -1 }, ...(completing ? { $set: { status: 'COMPLETED' } } : {}) });
    }
  }
  return { session, created: true };
}
async function createMeasurement(user: AuthenticatedUser, payload: MeasurementPayload) {
  await customerFor(user, String(payload.customerId));
  return BodyMeasurement.create({ ...payload, ptId: user.id });
}
async function getProgress(user: AuthenticatedUser, customerId: string) {
  await customerFor(user, customerId);
  const [measurements, sessions] = await Promise.all([
    BodyMeasurement.find({ customerId }).sort({ measuredAt: 1 }).lean(),
    WorkoutSession.find({ customerId }).sort({ performedAt: 1 }).lean(),
  ]);
  return { customerId: new Types.ObjectId(customerId), measurements, sessions };
}
export { createTemplate, listTemplates, updateTemplate, createSession, createMeasurement, getProgress };
