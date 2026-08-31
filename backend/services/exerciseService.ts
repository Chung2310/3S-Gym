import { Types, type QueryFilter } from 'mongoose';
import Exercise, { type IExercise } from '../models/Exercise.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
import { recordAudit } from './auditService.js';

type ExerciseResponse = Record<string, unknown> & { id?: string; ownerPtId?: unknown; videoUrl?: string; videos?: IExercise['videos'] };
function canManageExercise(user: AuthenticatedUser, exercise: { ownerPtId?: unknown }): boolean {
  return user.role === 'ADMIN' || Boolean(exercise.ownerPtId && String(exercise.ownerPtId) === user.id);
}
function normalizeExerciseVideos(user: AuthenticatedUser, value: unknown): ExerciseResponse & { canManage: boolean } {
  const documentLike = value as { toObject?: () => unknown; id?: unknown };
  const raw = typeof documentLike.toObject === 'function' ? documentLike.toObject() : value;
  const exercise = { ...(raw as Record<string, unknown>) } as ExerciseResponse;
  const id = documentLike.id ?? exercise._id;
  if (id != null) exercise.id = String(id);
  if ((!exercise.videos || exercise.videos.length === 0) && exercise.videoUrl) {
    exercise.videos = [{ title: 'Video hướng dẫn', url: exercise.videoUrl, source: 'LINK' }];
  }
  return { ...exercise, canManage: canManageExercise(user, exercise) };
}

async function create(user: AuthenticatedUser, payload: Partial<IExercise>) {
  const scope = payload.scope || (user.role === 'ADMIN' ? 'GLOBAL' : 'PRIVATE');
  const exercise = await Exercise.create({ ...payload, scope, ownerPtId: user.role === 'PT' ? user.id : undefined });
  await recordAudit({ actor: user, action: 'EXERCISE_CREATED', resourceType: 'exercise', resourceId: exercise.id });
  return normalizeExerciseVideos(user, exercise);
}
async function list(user: AuthenticatedUser, query: Record<string, unknown>) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const andClauses: QueryFilter<IExercise>[] = [];

  if (user.role !== 'ADMIN') {
    andClauses.push({ $or: [{ scope: 'GLOBAL' as const }, { ownerPtId: new Types.ObjectId(user.id) }] });
  }
  if (typeof query.muscleGroup === 'string' && query.muscleGroup.trim()) {
    andClauses.push({ muscleGroup: { $regex: query.muscleGroup.trim(), $options: 'i' } as unknown as string });
  }
  if (typeof query.level === 'string' && query.level.trim()) {
    andClauses.push({ level: query.level as IExercise['level'] });
  }
  if (typeof query.defaultTrackingType === 'string' && query.defaultTrackingType.trim()) {
    andClauses.push({ defaultTrackingType: query.defaultTrackingType as IExercise['defaultTrackingType'] });
  }

  const rawSearch = (typeof query.keyword === 'string' ? query.keyword : typeof query.search === 'string' ? query.search : '').trim();
  if (rawSearch) {
    const escaped = rawSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' } as unknown as string;
    andClauses.push({
      $or: [
        { name: regex },
        { muscleGroup: regex },
        { equipment: regex },
      ],
    });
  }

  const filter: QueryFilter<IExercise> = andClauses.length > 0 ? { $and: andClauses } : {};
  const [items, total] = await Promise.all([
    Exercise.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Exercise.countDocuments(filter),
  ]);
  return { items: items.map((item) => normalizeExerciseVideos(user, item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
async function update(user: AuthenticatedUser, id: string, payload: Partial<IExercise>) {
  const exercise = await Exercise.findById(id);
  if (!exercise) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Exercise not found.' });
  if (!canManageExercise(user, exercise)) {
    throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý bài tập này.' });
  }
  const protectedFields = new Set(['_id', 'ownerPtId', 'scope', 'createdAt', 'updatedAt']);
  for (const [field, value] of Object.entries(payload)) if (!protectedFields.has(field)) exercise.set(field, value);
  const saved = await exercise.save();
  await recordAudit({ actor: user, action: 'EXERCISE_UPDATED', resourceType: 'exercise', resourceId: exercise.id });
  return normalizeExerciseVideos(user, saved);
}
async function getOwned(user: AuthenticatedUser, id: string) {
  const exercise = await Exercise.findById(id);
  if (!exercise) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy bài tập.' });
  if (user.role === 'PT' && exercise.scope !== 'GLOBAL' && String(exercise.ownerPtId) !== user.id) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền truy cập bài tập này.' });
  return exercise;
}
async function get(user: AuthenticatedUser, id: string) { return normalizeExerciseVideos(user, await getOwned(user, id)); }
async function remove(user: AuthenticatedUser, id: string) {
  const exercise = await getOwned(user, id);
  if (!canManageExercise(user, exercise)) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý bài tập này.' });
  await exercise.deleteOne();
  await recordAudit({ actor: user, action: 'EXERCISE_DELETED', resourceType: 'exercise', resourceId: exercise.id });
}
export { create, list, get, update, remove };
