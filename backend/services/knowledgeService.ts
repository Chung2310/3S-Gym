import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
import { recordAudit } from './auditService.js';
export async function createDocument(payload: Record<string, unknown>) { return KnowledgeDocument.create({ ...payload, status: 'DRAFT', version: 1 }); }
export async function listDocuments(query: Record<string, unknown>) { const page = Number(query.page || 1); const limit = Number(query.limit || 20); const filter: Record<string, unknown> = {}; if (query.status === 'DRAFT' || query.status === 'PUBLISHED') filter.status = query.status; if (typeof query.topic === 'string') filter.topic = query.topic; const [items, total] = await Promise.all([KnowledgeDocument.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), KnowledgeDocument.countDocuments(filter)]); return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function updateDocument(id: string, payload: Record<string, unknown>) { const doc = await KnowledgeDocument.findById(id); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' }); for (const field of ['title', 'topic', 'content'] as const) if (payload[field] !== undefined) doc.set(field, payload[field]); doc.version += 1; doc.status = 'DRAFT'; doc.publishedAt = undefined; doc.approvedById = undefined; await KnowledgeChunk.deleteMany({ documentId: doc._id }); return doc.save(); }
export async function unpublishDocument(id: string) { const doc = await KnowledgeDocument.findById(id); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' }); doc.status = 'DRAFT'; doc.publishedAt = undefined; await KnowledgeChunk.deleteMany({ documentId: doc._id }); return doc.save(); }
export async function indexDocument(id: string) { const doc = await KnowledgeDocument.findOne({ _id: id, status: 'PUBLISHED' }); if (!doc) throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Chỉ có thể index tài liệu đã xuất bản.' }); await KnowledgeChunk.deleteMany({ documentId: doc._id }); const parts = doc.content.match(/[\s\S]{1,1000}/g) || [doc.content]; await KnowledgeChunk.insertMany(parts.map((content, position) => ({ documentId: doc._id, documentVersion: doc.version, topic: doc.topic, position, content }))); return { documentId: String(doc._id), documentVersion: doc.version, chunkCount: parts.length }; }
export async function deleteDocument(id: string) { const doc = await KnowledgeDocument.findById(id); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' }); if (doc.status === 'PUBLISHED') throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Hãy thu hồi tài liệu trước khi xóa.' }); await KnowledgeChunk.deleteMany({ documentId: doc._id }); await doc.deleteOne(); }
export async function publishDocument(user: AuthenticatedUser, id: string) {
  const doc = await KnowledgeDocument.findById(id); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' });
  doc.status = 'PUBLISHED'; doc.publishedAt = new Date(); doc.effectiveAt = new Date(); doc.approvedById = new (await import('mongoose')).Types.ObjectId(user.id); await doc.save();
  await KnowledgeChunk.deleteMany({ documentId: doc._id });
  const parts = doc.content.match(/[\s\S]{1,1000}/g) || [doc.content];
  await KnowledgeChunk.insertMany(parts.map((content, position) => ({ documentId: doc._id, documentVersion: doc.version, topic: doc.topic, position, content })));
  await recordAudit({ actor: user, action: 'KNOWLEDGE_PUBLISHED', resourceType: 'knowledge', resourceId: id, metadata: { version: doc.version } });
  return doc;
}
export async function searchPublished(query: string, limit = 5) {
  const escaped = query.trim().split(/\s+/).filter(Boolean).map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return [];
  const regex = new RegExp(escaped.join('|'), 'i');
  const docs = await KnowledgeDocument.find({ status: 'PUBLISHED', $or: [{ title: regex }, { content: regex }, { topic: regex }] }).limit(limit).lean();
  return docs.map((doc) => ({ documentId: String(doc._id), title: doc.title, topic: doc.topic, content: doc.content, version: doc.version }));
}
