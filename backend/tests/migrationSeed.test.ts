import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FeatureFlag from '../models/FeatureFlag.js';
import NutritionFormula from '../models/NutritionFormula.js';
import ActivityCalorie from '../models/ActivityCalorie.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import MigrationRecord from '../models/MigrationRecord.js';
import { migrateDown, migrationStatus, runMigrations, seedReferenceData } from '../services/migrationService.js';

let mongo: MongoMemoryServer;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
beforeEach(async () => { await mongoose.connection.db?.dropDatabase(); });
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

it('tracks migration versions and rolls back only fields added by each migration', async () => {
  await KnowledgeDocument.collection.insertOne({ title: 'Rollback legacy', topic: 'GENERAL', content: 'Rollback content', createdAt: new Date(), updatedAt: new Date() });
  const first = await runMigrations();
  const second = await runMigrations();
  expect(first.applied).toEqual(['001-content-defaults', '002-exercise-tracking-types']);
  expect(second.applied).toHaveLength(0);
  expect(await migrationStatus()).toEqual(expect.arrayContaining([expect.objectContaining({ version: '001-content-defaults', status: 'APPLIED' })]));

  expect((await migrateDown()).rolledBack).toBe('002-exercise-tracking-types');
  const rolledBack = await migrateDown();
  expect(rolledBack.rolledBack).toBe('001-content-defaults');
  const legacy = await KnowledgeDocument.collection.findOne({ title: 'Rollback legacy' });
  expect(legacy).not.toHaveProperty('version');
  expect(legacy).not.toHaveProperty('status');
  expect((await migrateDown()).rolledBack).toBeNull();
});

it('remains idempotent when the migration index has not been created yet', async () => {
  await mongoose.connection.db?.dropDatabase();
  await KnowledgeDocument.collection.insertOne({
    title: 'Fresh database legacy document',
    topic: 'GENERAL',
    content: 'Legacy content',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const first = await runMigrations();
  const second = await runMigrations();

  expect(first.applied).toEqual(['001-content-defaults', '002-exercise-tracking-types']);
  expect(second.applied).toEqual([]);
  expect(await MigrationRecord.countDocuments({ version: '001-content-defaults' })).toBe(1);
  expect(await MigrationRecord.countDocuments({ version: '002-exercise-tracking-types' })).toBe(1);
});
