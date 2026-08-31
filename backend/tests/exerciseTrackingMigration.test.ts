import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { migrateDown, runMigrations } from '../services/migrationService.js';

let mongo: MongoMemoryServer;

beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
beforeEach(async () => { await mongoose.connection.db?.dropDatabase(); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

async function seedLegacyTrackingRecords() {
  const now = new Date();
  await mongoose.connection.collection('exercises').insertOne({ name: 'Chạy bộ', muscleGroup: 'CARDIO', level: 'BEGINNER', createdAt: now, updatedAt: now });
  await mongoose.connection.collection('workouttemplates').insertOne({
    title: 'Legacy template', ownerPtId: new mongoose.Types.ObjectId(), goal: 'FITNESS', level: 'BEGINNER',
    scheduledExercises: [{ name: 'Squat', dayNumber: 1, startMinute: 480, durationMinutes: 60 }],
    unscheduledExercises: [{ name: 'Row', durationMinutes: 30, trackingType: 'STRENGTH' }],
    sessions: [{ name: 'Ngày 1', exercises: [{ name: 'Plank' }] }], createdAt: now, updatedAt: now,
  });
  await mongoose.connection.collection('workoutplans').insertOne({
    title: 'Legacy plan', customerId: new mongoose.Types.ObjectId(), ptId: new mongoose.Types.ObjectId(),
    scheduledExercises: [], unscheduledExercises: [{ name: 'Mobility', durationMinutes: 15 }], sessions: [], createdAt: now, updatedAt: now,
  });
}

it('reports dry-run counts without changing legacy records', async () => {
  await seedLegacyTrackingRecords();
  const result = await runMigrations({ dryRun: true });

  expect(result.applied).toEqual([]);
  expect(result.dryRun).toEqual(expect.arrayContaining([
    expect.objectContaining({ version: '002-exercise-tracking-types', counts: {
      exercises: { matched: 1, modified: 1 }, workoutTemplates: { matched: 1, modified: 1 }, workoutPlans: { matched: 1, modified: 1 },
    } }),
  ]));
  expect(await mongoose.connection.collection('exercises').findOne({ name: 'Chạy bộ' })).not.toHaveProperty('defaultTrackingType');
});

it('sets only missing tracking types to unclassified and is idempotent', async () => {
  await seedLegacyTrackingRecords();
  const first = await runMigrations();
  const second = await runMigrations();

  expect(first.applied).toEqual(['001-content-defaults', '002-exercise-tracking-types']);
  expect(second.applied).toEqual([]);
  expect(await mongoose.connection.collection('exercises').findOne({ name: 'Chạy bộ' })).toMatchObject({ defaultTrackingType: 'UNCLASSIFIED' });
  const template = await mongoose.connection.collection('workouttemplates').findOne({ title: 'Legacy template' });
  expect(template?.scheduledExercises[0].trackingType).toBe('UNCLASSIFIED');
  expect(template?.sessions[0].exercises[0].trackingType).toBe('UNCLASSIFIED');
  expect(template?.unscheduledExercises[0].trackingType).toBe('STRENGTH');
});

it('rolls back only fields introduced by migration 002', async () => {
  await seedLegacyTrackingRecords();
  await runMigrations();
  expect((await migrateDown()).rolledBack).toBe('002-exercise-tracking-types');

  expect(await mongoose.connection.collection('exercises').findOne({ name: 'Chạy bộ' })).not.toHaveProperty('defaultTrackingType');
  const template = await mongoose.connection.collection('workouttemplates').findOne({ title: 'Legacy template' });
  expect(template?.scheduledExercises[0]).not.toHaveProperty('trackingType');
  expect(template?.sessions[0].exercises[0]).not.toHaveProperty('trackingType');
  expect(template?.unscheduledExercises[0].trackingType).toBe('STRENGTH');
});
