import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import FeatureFlag from '../models/FeatureFlag.js';
import NutritionFormula from '../models/NutritionFormula.js';
import ActivityCalorie from '../models/ActivityCalorie.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import MigrationRecord from '../models/MigrationRecord.js';
import User from '../models/User.js';
import CreditWallet from '../models/CreditWallet.js';
import CreditPricing from '../models/CreditPricing.js';
import AiBillingPolicy from '../models/AiBillingPolicy.js';
import { AI_TASK_TYPES } from '../services/creditTypes.js';
import { migrateDown, migrationStatus, runMigrations, seedReferenceData } from '../services/migrationService.js';

let mongo: MongoMemoryReplSet;
beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
beforeEach(async () => { await mongoose.connection.db?.dropDatabase(); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('migration and reference seed are idempotent', async () => {
  await KnowledgeDocument.collection.insertOne({ title: 'Legacy document', topic: 'GENERAL', content: 'Legacy content', createdAt: new Date(), updatedAt: new Date() });
  await User.create([
    { username: 'legacy-admin', fullName: 'Legacy Admin', password: 'hash', role: 'ADMIN' },
    { username: 'legacy-pt', fullName: 'Legacy PT', password: 'hash', role: 'PT' },
    { username: 'legacy-customer', fullName: 'Legacy Customer', password: 'hash', role: 'CUSTOMER' },
  ]);

  const first = await runMigrations(); await seedReferenceData();
  const second = await runMigrations(); await seedReferenceData();
  const legacy = await KnowledgeDocument.findOne({ title: 'Legacy document' }).lean();
  expect(legacy).toMatchObject({ version: 1, status: 'DRAFT' });
  expect(first.applied).toEqual(['001-content-defaults', '002-credit-wallets-and-pricing']);
  expect(second.applied).toEqual([]);
  expect(await CreditWallet.countDocuments()).toBe(3);
  expect(await CreditWallet.find().select({ _id: 0, availableCredits: 1, reservedCredits: 1 }).lean())
    .toEqual(Array(3).fill({ availableCredits: 0, reservedCredits: 0 }));
  expect(await CreditPricing.countDocuments({ key: 'GLOBAL' })).toBe(1);
  expect(await CreditPricing.findOne({ key: 'GLOBAL' }).lean()).toMatchObject({ vndPerCredit: 1_000, usdToVnd: 26_000 });
  expect(await AiBillingPolicy.countDocuments()).toBe(AI_TASK_TYPES.length);
  expect((await AiBillingPolicy.distinct('taskType')).sort()).toEqual([...AI_TASK_TYPES].sort());
  expect(await FeatureFlag.countDocuments()).toBe(9);
  expect(await NutritionFormula.countDocuments({ name: 'MIFFLIN_ST_JEOR' })).toBe(1);
  expect(await ActivityCalorie.countDocuments()).toBeGreaterThanOrEqual(3);
});

it('tracks migration version and rolls back only fields added by migration', async () => {
  await KnowledgeDocument.collection.insertOne({ title: 'Rollback legacy', topic: 'GENERAL', content: 'Rollback content', createdAt: new Date(), updatedAt: new Date() });
  const first = await runMigrations();
  const second = await runMigrations();
  expect(first.applied).toContain('001-content-defaults');
  expect(first.applied).toContain('002-credit-wallets-and-pricing');
  expect(second.applied).toHaveLength(0);
  expect(await migrationStatus()).toEqual(expect.arrayContaining([
    expect.objectContaining({ version: '001-content-defaults', status: 'APPLIED' }),
    expect.objectContaining({ version: '002-credit-wallets-and-pricing', status: 'APPLIED' }),
  ]));

  expect((await migrateDown()).rolledBack).toBe('002-credit-wallets-and-pricing');
  expect((await KnowledgeDocument.findOne({ title: 'Rollback legacy' }).lean())).toMatchObject({ version: 1, status: 'DRAFT' });
  expect((await migrateDown()).rolledBack).toBe('001-content-defaults');
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

  expect(first.applied).toEqual(['001-content-defaults', '002-credit-wallets-and-pricing']);
  expect(second.applied).toEqual([]);
  expect(await MigrationRecord.countDocuments({ version: '001-content-defaults' })).toBe(1);
  expect(await MigrationRecord.countDocuments({ version: '002-credit-wallets-and-pricing' })).toBe(1);
});
