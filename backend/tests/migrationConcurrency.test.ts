import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import MigrationRecord from '../models/MigrationRecord.js';
import { runMigrations } from '../services/migrationService.js';

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  vi.restoreAllMocks();
  await mongoose.connection.db?.dropDatabase();
  await MigrationRecord.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('allows only one concurrent runner to apply a migration version', async () => {
  await KnowledgeDocument.collection.insertOne({
    title: 'Concurrent legacy document',
    topic: 'GENERAL',
    content: 'Legacy content',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const results = await Promise.all([runMigrations(), runMigrations()]);

  expect(results.flatMap((result) => result.applied).sort()).toEqual(['001-content-defaults', '002-exercise-tracking-types']);
  expect(await MigrationRecord.countDocuments({ version: '001-content-defaults', status: 'APPLIED' })).toBe(1);
  expect(await MigrationRecord.countDocuments({ version: '002-exercise-tracking-types', status: 'APPLIED' })).toBe(1);
});

it('takes over an expired migration lock', async () => {
  await MigrationRecord.collection.insertOne({
    version: '001-content-defaults',
    name: 'Add version and status defaults to legacy content',
    status: 'RUNNING',
    ownerId: 'stale-runner',
    lockedAt: new Date(Date.now() - 120_000),
    expiresAt: new Date(Date.now() - 60_000),
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await expect(runMigrations()).resolves.toEqual({ applied: ['001-content-defaults', '002-exercise-tracking-types'] });
  await expect(MigrationRecord.findOne({ version: '001-content-defaults' }).lean()).resolves.toMatchObject({
    status: 'APPLIED',
  });
});

it('stores a sanitized failure summary and releases the lock', async () => {
  vi.spyOn(KnowledgeDocument, 'updateMany').mockRejectedValueOnce(
    new Error('mongodb://admin:secret@db.internal/data?token=top-secret'),
  );

  await expect(runMigrations()).rejects.toThrow();

  const record = await MigrationRecord.findOne({ version: '001-content-defaults' }).lean();
  expect(record).toMatchObject({ status: 'FAILED', error: { name: 'Error' } });
  expect(JSON.stringify(record?.error)).not.toMatch(/admin|secret|db\.internal|token/i);
  expect(record).not.toHaveProperty('ownerId');
  expect(record).not.toHaveProperty('expiresAt');
});
