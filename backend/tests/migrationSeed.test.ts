import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FeatureFlag from '../models/FeatureFlag.js';
import NutritionFormula from '../models/NutritionFormula.js';
import ActivityCalorie from '../models/ActivityCalorie.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import { migrateDown, migrationStatus, runMigrations, seedReferenceData } from '../services/migrationService.js';

let mongo: MongoMemoryServer;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('migration and reference seed are idempotent', async () => {
  await KnowledgeDocument.collection.insertOne({ title: 'Legacy document', topic: 'GENERAL', content: 'Legacy content', createdAt: new Date(), updatedAt: new Date() });
  await runMigrations(); await seedReferenceData();
  await runMigrations(); await seedReferenceData();
  const legacy = await KnowledgeDocument.findOne({ title: 'Legacy document' }).lean();
  expect(legacy).toMatchObject({ version: 1, status: 'DRAFT' });
  expect(await FeatureFlag.countDocuments()).toBe(9);
  expect(await NutritionFormula.countDocuments({ name: 'MIFFLIN_ST_JEOR' })).toBe(1);
  expect(await ActivityCalorie.countDocuments()).toBeGreaterThanOrEqual(3);
});

it('tracks migration version and rolls back only fields added by migration', async () => {
  await migrateDown();
  await KnowledgeDocument.collection.insertOne({ title: 'Rollback legacy', topic: 'GENERAL', content: 'Rollback content', createdAt: new Date(), updatedAt: new Date() });
  const first = await runMigrations();
  const second = await runMigrations();
  expect(first.applied).toContain('001-content-defaults');
  expect(second.applied).toHaveLength(0);
  expect(await migrationStatus()).toEqual(expect.arrayContaining([expect.objectContaining({ version: '001-content-defaults', status: 'APPLIED' })]));

  const rolledBack = await migrateDown();
  expect(rolledBack.rolledBack).toBe('001-content-defaults');
  const legacy = await KnowledgeDocument.collection.findOne({ title: 'Rollback legacy' });
  expect(legacy).not.toHaveProperty('version');
  expect(legacy).not.toHaveProperty('status');
  expect((await migrateDown()).rolledBack).toBeNull();
});
