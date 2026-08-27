import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FeatureFlag from '../models/FeatureFlag.js';
import NutritionFormula from '../models/NutritionFormula.js';
import ActivityCalorie from '../models/ActivityCalorie.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import { runMigrations, seedReferenceData } from '../services/migrationService.js';

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
