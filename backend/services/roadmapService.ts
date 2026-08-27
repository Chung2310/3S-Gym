import { Types, type QueryFilter } from 'mongoose';
import Roadmap, { type IRoadmap } from '../models/Roadmap.js';
import CustomerProfile from '../models/CustomerProfile.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { recordAudit } from './auditService.js';
import type { AuthenticatedUser } from '../types/express.js';

const error = (message: string, status: number, code = status === 403 ? ERROR_CODES.AUTHORIZATION : status === 404 ? ERROR_CODES.NOT_FOUND : ERROR_CODES.VALIDATION) => new AppError({ message, status, code });

async function assertCustomer(user: AuthenticatedUser, customerId: string | Types.ObjectId) {
  const customer = await CustomerProfile.findById(customerId);
  if (!customer) throw error('Không tìm thấy khách hàng.', 404);
  if (user.role === 'PT' && String(customer.assignedPtId) !== user.id) throw error('Bạn không có quyền quản lý khách hàng này.', 403);
  return customer;
}

async function create(user: AuthenticatedUser, payload: Omit<IRoadmap, 'ptId' | 'status' | 'version' | 'publishedAt'>) {
  await assertCustomer(user, payload.customerId);
  return Roadmap.create({ ...payload, ptId: user.id, status: 'DRAFT', version: 1, publishedAt: null });
}

async function getOwned(user: AuthenticatedUser, id: string) {
  const roadmap = await Roadmap.findById(id);
  if (!roadmap) throw error('Không tìm thấy roadmap.', 404);
  await assertCustomer(user, roadmap.customerId);
  return roadmap;
}

async function update(user: AuthenticatedUser, id: string, payload: Partial<IRoadmap>) {
  const roadmap = await getOwned(user, id);
  for (const field of ['title', 'baseline', 'phases'] as const) if (payload[field] !== undefined) roadmap.set(field, payload[field]);
  if (roadmap.status === 'PUBLISHED') { roadmap.status = 'DRAFT'; roadmap.publishedAt = null; roadmap.version += 1; }
  return roadmap.save();
}

async function get(user: AuthenticatedUser, id: string) {
  return getOwned(user, id);
}

async function remove(user: AuthenticatedUser, id: string) {
  const roadmap = await getOwned(user, id);
  if (roadmap.status === 'PUBLISHED') throw error('KhÃ´ng thá»ƒ xÃ³a roadmap Ä‘Ã£ cÃ´ng bá»‘.', 409);
  await roadmap.deleteOne();
  await recordAudit({ actor: user, action: 'ROADMAP_DELETED', resourceType: 'roadmaps', resourceId: id, customerId: roadmap.customerId });
}

async function setPublished(user: AuthenticatedUser, id: string, publish: boolean) {
  const roadmap = await getOwned(user, id);
  roadmap.status = publish ? 'PUBLISHED' : 'DRAFT'; roadmap.publishedAt = publish ? new Date() : null;
  const saved = await roadmap.save();
  await recordAudit({ actor: user, action: publish ? 'ROADMAP_PUBLISHED' : 'ROADMAP_UNPUBLISHED', resourceType: 'roadmaps', resourceId: id, customerId: roadmap.customerId });
  return saved;
}

async function list(user: AuthenticatedUser, query: Record<string, unknown>) {
  const page = Number(query.page || 1); const limit = Number(query.limit || 20);
  const filter: QueryFilter<IRoadmap> = {};
  if (typeof query.customerId === 'string') filter.customerId = new Types.ObjectId(query.customerId);
  if (query.status === 'DRAFT' || query.status === 'PUBLISHED') filter.status = query.status;
  if (user.role === 'PT') {
    const ids = await CustomerProfile.find({ assignedPtId: user.id }).distinct('_id');
    if (typeof query.customerId === 'string' && !ids.some((id) => String(id) === query.customerId)) return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
    if (typeof query.customerId !== 'string') filter.customerId = { $in: ids };
  }
  const [items, total] = await Promise.all([Roadmap.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Roadmap.countDocuments(filter)]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export { create, get, update, remove, setPublished, list };
