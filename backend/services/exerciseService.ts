import { Types, type QueryFilter } from 'mongoose';
import Exercise, { type IExercise } from '../models/Exercise.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';

async function create(user: AuthenticatedUser, payload: Partial<IExercise>) {
  const scope = user.role === 'ADMIN' ? (payload.scope || 'GLOBAL') : 'PRIVATE';
  if (user.role === 'PT' && payload.scope === 'GLOBAL') throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'PT không được tạo bài tập dùng chung.' });
  return Exercise.create({ ...payload, scope, ownerPtId: scope === 'PRIVATE' ? user.id : undefined });
}
async function list(user: AuthenticatedUser, query: Record<string, unknown>) {
  const page = Number(query.page || 1); const limit = Number(query.limit || 20);
  const access: QueryFilter<IExercise> = user.role === 'ADMIN'
    ? {}
    : { $or: [{ scope: 'GLOBAL' as const }, { ownerPtId: new Types.ObjectId(user.id) }] };
  const filter: QueryFilter<IExercise> = { ...access };
  if (typeof query.muscleGroup === 'string') filter.muscleGroup = query.muscleGroup;
  if (typeof query.level === 'string') filter.level = query.level as IExercise['level'];
  if (typeof query.keyword === 'string' && query.keyword.trim()) filter.name = { $regex: query.keyword.trim(), $options: 'i' };
  const [items, total] = await Promise.all([Exercise.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(), Exercise.countDocuments(filter)]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
async function update(user: AuthenticatedUser, id: string, payload: Partial<IExercise>) {
  const exercise = await Exercise.findById(id);
  if (!exercise) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Exercise not found.' });
  if (user.role === 'PT' && (exercise.scope !== 'PRIVATE' || String(exercise.ownerPtId) !== user.id)) {
    throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'You cannot update this exercise.' });
  }
  const protectedFields = new Set(['_id', 'ownerPtId', 'scope', 'createdAt', 'updatedAt']);
  for (const [field, value] of Object.entries(payload)) if (!protectedFields.has(field)) exercise.set(field, value);
  return exercise.save();
}
async function getOwned(user: AuthenticatedUser, id: string) {
  const exercise = await Exercise.findById(id);
  if (!exercise) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy bài tập.' });
  if (user.role === 'PT' && exercise.scope !== 'GLOBAL' && String(exercise.ownerPtId) !== user.id) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền truy cập bài tập này.' });
  return exercise;
}
async function get(user: AuthenticatedUser, id: string) { return getOwned(user, id); }
async function remove(user: AuthenticatedUser, id: string) {
  const exercise = await getOwned(user, id);
  if (user.role === 'PT' && exercise.scope === 'GLOBAL') throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'PT không được xóa bài tập dùng chung.' });
  await exercise.deleteOne();
}
export { create, list, get, update, remove };
