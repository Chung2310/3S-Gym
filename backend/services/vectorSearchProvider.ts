import KnowledgeChunk from '../models/KnowledgeChunk.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { cosineSimilarity, embedText, embedTextBillable } from './embeddingProvider.js';
import type { AiBillingContext } from './creditTypes.js';
import type { PipelineStage } from 'mongoose';
import { APP_POLICY } from '../config/env.js';

export interface VectorFilters { status?: 'PUBLISHED'; topic?: string }
export interface VectorHit { documentId: string; title?: string; topic: string; content: string; score: number }

export function searchVectors(context: AiBillingContext, query: string, filters: VectorFilters, limit: number): Promise<VectorHit[]>;
export function searchVectors(query: string, filters: VectorFilters, limit: number): Promise<VectorHit[]>;
export async function searchVectors(context: AiBillingContext | string, queryOrFilters: string | VectorFilters, filtersOrLimit: VectorFilters | number, maybeLimit?: number): Promise<VectorHit[]> {
  const billed = typeof context !== 'string';
  const query = billed ? queryOrFilters as string : context;
  const filters = (billed ? filtersOrLimit : queryOrFilters) as VectorFilters;
  const limit = (billed ? maybeLimit : filtersOrLimit) as number;
  const mode = process.env.NODE_ENV === 'production' ? 'atlas' : 'local';
  const queryVector = billed ? await embedTextBillable(context, query) : embedText(query);
  if (mode === 'atlas') {
    const index = APP_POLICY.VECTOR_SEARCH_INDEX;
    try {
      const pipeline: PipelineStage[] = [
        { $vectorSearch: { index, path: 'embedding', queryVector, numCandidates: Math.max(limit * 10, 50), limit } },
        { $lookup: { from: 'knowledgedocuments', localField: 'documentId', foreignField: '_id', as: 'document' } },
        { $unwind: '$document' },
        { $match: { 'document.status': filters.status || 'PUBLISHED', ...(filters.topic ? { topic: filters.topic } : {}) } },
        { $project: { documentId: { $toString: '$documentId' }, title: '$document.title', topic: 1, content: 1, score: { $meta: 'vectorSearchScore' } } },
      ];
      return await KnowledgeChunk.aggregate<VectorHit>(pipeline);
    } catch (cause) {
      throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Vector Search tạm thời không khả dụng.', cause });
    }
  }
  if (mode !== 'local') throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Chế độ Vector Search không hợp lệ.' });
  const chunks = await KnowledgeChunk.find({ embedding: { $exists: true, $ne: [] }, ...(filters.topic ? { topic: filters.topic } : {}) }).lean();
  const documentIds = [...new Set(chunks.map((chunk) => String(chunk.documentId)))];
  const docs = await KnowledgeDocument.find({ _id: { $in: documentIds }, status: filters.status || 'PUBLISHED' }).lean();
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  return chunks.flatMap((chunk) => {
    const doc = byId.get(String(chunk.documentId));
    return doc ? [{ documentId: String(doc._id), title: doc.title, topic: chunk.topic, content: chunk.content, score: cosineSimilarity(queryVector, chunk.embedding) }] : [];
  }).filter((hit) => hit.score > 0).sort((left, right) => right.score - left.score).slice(0, limit);
}
