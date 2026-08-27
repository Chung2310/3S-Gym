import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { embedText } from '../services/embeddingProvider.js';
import { searchVectors } from '../services/vectorSearchProvider.js';

let mongo: MongoMemoryServer;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('ranks published local chunks with numeric scores', async () => {
  process.env.VECTOR_SEARCH_MODE = 'local';
  const doc = await KnowledgeDocument.create({ title: 'Squat Guide', topic: 'training', content: 'squat strength guide', status: 'PUBLISHED', version: 1 });
  await KnowledgeChunk.create({ documentId: doc.id, documentVersion: 1, topic: 'training', position: 0, content: 'squat strength guide', embedding: embedText('squat strength guide') });
  const hits = await searchVectors('squat', { status: 'PUBLISHED' }, 5);
  expect(hits[0]).toMatchObject({ documentId: doc.id, content: 'squat strength guide', score: expect.any(Number) });
});

it('uses Atlas vector search without silently falling back', async () => {
  process.env.VECTOR_SEARCH_MODE = 'atlas'; process.env.VECTOR_SEARCH_INDEX = 'knowledge-vector';
  const aggregate = vi.spyOn(KnowledgeChunk, 'aggregate').mockResolvedValueOnce([{ documentId: new mongoose.Types.ObjectId(), content: 'atlas hit', topic: 'training', score: 0.95 }]);
  const hits = await searchVectors('squat', { status: 'PUBLISHED' }, 3);
  const pipeline = aggregate.mock.calls[0][0];
  expect(pipeline[0]).toHaveProperty('$vectorSearch.index', 'knowledge-vector');
  expect(hits[0].score).toBe(0.95);
  aggregate.mockRestore(); delete process.env.VECTOR_SEARCH_MODE; delete process.env.VECTOR_SEARCH_INDEX;
});

it('fails Atlas mode when the index is missing', async () => {
  process.env.VECTOR_SEARCH_MODE = 'atlas'; delete process.env.VECTOR_SEARCH_INDEX;
  await expect(searchVectors('squat', { status: 'PUBLISHED' }, 3)).rejects.toMatchObject({ status: 503 });
  delete process.env.VECTOR_SEARCH_MODE;
});
