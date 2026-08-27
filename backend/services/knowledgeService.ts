import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
export async function createDocument(payload: Record<string, unknown>) { return KnowledgeDocument.create({ ...payload, status: 'DRAFT', version: 1 }); }
export async function publishDocument(user: AuthenticatedUser, id: string) {
  const doc = await KnowledgeDocument.findById(id); if (!doc) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài liệu.' });
  doc.status = 'PUBLISHED'; doc.publishedAt = new Date(); doc.effectiveAt = new Date(); doc.approvedById = new (await import('mongoose')).Types.ObjectId(user.id); await doc.save();
  await KnowledgeChunk.deleteMany({ documentId: doc._id });
  const parts = doc.content.match(/[\s\S]{1,1000}/g) || [doc.content];
  await KnowledgeChunk.insertMany(parts.map((content, position) => ({ documentId: doc._id, documentVersion: doc.version, topic: doc.topic, position, content })));
  return doc;
}
export async function searchPublished(query: string, limit = 5) {
  const escaped = query.trim().split(/\s+/).filter(Boolean).map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return [];
  const regex = new RegExp(escaped.join('|'), 'i');
  const docs = await KnowledgeDocument.find({ status: 'PUBLISHED', $or: [{ title: regex }, { content: regex }, { topic: regex }] }).limit(limit).lean();
  return docs.map((doc) => ({ documentId: String(doc._id), title: doc.title, topic: doc.topic, content: doc.content, version: doc.version }));
}
