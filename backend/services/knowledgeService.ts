import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
import { recordAudit } from './auditService.js';
import { embedText } from './embeddingProvider.js';
import { Types, type ClientSession } from 'mongoose';
import { withTransaction } from './transactionService.js';
import { searchVectors } from './vectorSearchProvider.js';
async function replaceChunks(doc: { _id: Types.ObjectId; version: number; topic: string; content: string }, session?: ClientSession) { await KnowledgeChunk.deleteMany({ documentId: doc._id }, { session }); const parts = doc.content.match(/[\s\S]{1,1000}/g) || [doc.content]; await KnowledgeChunk.insertMany(parts.map((content, position) => ({ documentId: doc._id, documentVersion: doc.version, topic: doc.topic, position, content, embedding: embedText(`${doc.topic} ${content}`) })), { session }); return parts.length; }
export async function createDocument(payload: Record<string, unknown>) { return KnowledgeDocument.create({ ...payload, status: 'DRAFT', version: 1 }); }
export async function listDocuments(query: Record<string, unknown>) { const page = Number(query.page || 1); const limit = Number(query.limit || 20); const filter: Record<string, unknown> = {}; if (query.status === 'DRAFT' || query.status === 'PUBLISHED') filter.status = query.status; if (typeof query.topic === 'string') filter.topic = query.topic; const [items, total] = await Promise.all([KnowledgeDocument.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), KnowledgeDocument.countDocuments(filter)]); return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function updateDocument(id: string, payload: Record<string, unknown>) { const doc = await KnowledgeDocument.findById(id); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' }); for (const field of ['title', 'topic', 'content'] as const) if (payload[field] !== undefined) doc.set(field, payload[field]); doc.version += 1; doc.status = 'DRAFT'; doc.publishedAt = undefined; doc.approvedById = undefined; await KnowledgeChunk.deleteMany({ documentId: doc._id }); return doc.save(); }
export async function unpublishDocument(id: string) { const doc = await KnowledgeDocument.findById(id); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' }); doc.status = 'DRAFT'; doc.publishedAt = undefined; await KnowledgeChunk.deleteMany({ documentId: doc._id }); return doc.save(); }
export async function indexDocument(id: string) { const doc = await KnowledgeDocument.findOne({ _id: id, status: 'PUBLISHED' }); if (!doc) throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Chỉ có thể index tài liệu đã xuất bản.' }); const chunkCount = await replaceChunks(doc); return { documentId: String(doc._id), documentVersion: doc.version, chunkCount }; }
export async function deleteDocument(id: string) { const doc = await KnowledgeDocument.findById(id); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' }); if (doc.status === 'PUBLISHED') throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Hãy thu hồi tài liệu trước khi xóa.' }); await KnowledgeChunk.deleteMany({ documentId: doc._id }); await doc.deleteOne(); }
export async function publishDocument(user: AuthenticatedUser, id: string) {
  return withTransaction(async (session) => {
    const doc = await KnowledgeDocument.findById(id).session(session); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' });
    doc.status = 'PUBLISHED'; doc.publishedAt = new Date(); doc.effectiveAt = new Date(); doc.approvedById = new Types.ObjectId(user.id); await doc.save({ session });
    await replaceChunks(doc, session);
    await recordAudit({ actor: user, action: 'KNOWLEDGE_PUBLISHED', resourceType: 'knowledge', resourceId: id, metadata: { version: doc.version } }, session);
    return doc;
  });
}
export async function searchPublished(query: string, limit = 5) {
  if (!query.trim()) return [];
  const hits = await searchVectors(query, { status: 'PUBLISHED' }, limit);
  const docs = await KnowledgeDocument.find({ _id: { $in: hits.map((hit) => hit.documentId) }, status: 'PUBLISHED' }).lean();
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  return hits.flatMap((hit) => { const doc = byId.get(hit.documentId); return doc ? [{ ...hit, title: doc.title, topic: doc.topic, version: doc.version }] : []; });
}

import { STANDARD_3S_KNOWLEDGE_DOCS } from './standardKnowledgeLibrary.js';

export async function seedStandardKnowledgeLibrary(user?: AuthenticatedUser) {
  const seededDocs = [];
  for (const item of STANDARD_3S_KNOWLEDGE_DOCS) {
    let doc = await KnowledgeDocument.findOne({ title: item.title });
    if (!doc) {
      doc = new KnowledgeDocument({
        title: item.title,
        topic: item.topic,
        content: item.content,
        version: 1,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        effectiveAt: new Date(),
        approvedById: user?.id ? new Types.ObjectId(user.id) : undefined,
      });
    } else {
      doc.topic = item.topic;
      doc.content = item.content;
      doc.status = 'PUBLISHED';
      doc.publishedAt = new Date();
      doc.effectiveAt = new Date();
      if (user?.id) doc.approvedById = new Types.ObjectId(user.id);
    }
    await doc.save();
    await replaceChunks(doc);
    seededDocs.push(doc);
  }
  return {
    count: seededDocs.length,
    documents: seededDocs.map((d) => ({ id: String(d._id), title: d.title, topic: d.topic })),
  };
}
