import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutSession from '../models/WorkoutSession.js';
import PtPackage from '../models/PtPackage.js';
import { createSession } from '../services/workoutProgressService.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import NutritionFormula from '../models/NutritionFormula.js';
import ProgressReport from '../models/ProgressReport.js';
import AuditLog from '../models/AuditLog.js';
import { publishDocument } from '../services/knowledgeService.js';
import { createFormula } from '../services/nutritionMetricsService.js';
import { publishReport } from '../services/operationsService.js';

let mongo: MongoMemoryReplSet;
let ptId: string;
let customerId: string;
let workoutPlanId: string;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  const pt = await User.create({ username: 'pt-atomicity', password: 'hashed-value', role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Atomic', phone: '0908111001', assignedPtId: pt.id });
  const plan = await WorkoutPlan.create({ customerId: customer.id, ptId: pt.id, title: 'Atomic Plan', goal: 'STRENGTH', level: 'BEGINNER', lifecycleStatus: 'ACTIVE', version: 1, sessions: [{ name: 'Day 1', exercises: [] }] });
  ptId = pt.id; customerId = customer.id; workoutPlanId = plan.id;
  await WorkoutSession.syncIndexes();
});

beforeEach(async () => {
  await WorkoutSession.deleteMany({});
  await PtPackage.deleteMany({});
  await PtPackage.create({ customerId, name: 'Atomic Package', totalSessions: 2, usedSessions: 0, remainingSessions: 2, startDate: '2026-08-01', endDate: '2026-12-01', status: 'ACTIVE' });
});

afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('rolls back the workout session when package consumption fails', async () => {
  vi.spyOn(PtPackage, 'updateOne').mockRejectedValueOnce(new Error('package write failed'));
  await expect(createSession({ id: ptId, role: 'PT' }, {
    customerId, workoutPlanId, workoutPlanVersion: 1, sessionIndex: 0, performedAt: '2026-09-02', attendance: 'PRESENT', exerciseResults: [], idempotencyKey: 'rollback-001',
  })).rejects.toThrow('package write failed');

  expect(await WorkoutSession.countDocuments({ idempotencyKey: 'rollback-001' })).toBe(0);
  expect(await PtPackage.findOne({ customerId }).lean()).toMatchObject({ usedSessions: 0, remainingSessions: 2 });
  vi.restoreAllMocks();
});

it('keeps a knowledge document draft when chunk indexing fails', async () => {
  const doc = await KnowledgeDocument.create({ title: 'Atomic Knowledge', topic: 'training', content: 'Safe content', status: 'DRAFT', version: 1 });
  vi.spyOn(KnowledgeChunk, 'insertMany').mockRejectedValueOnce(new Error('chunk write failed'));

  await expect(publishDocument({ id: ptId, role: 'PT' }, doc.id)).rejects.toThrow('chunk write failed');

  expect(await KnowledgeDocument.findById(doc.id).lean()).toMatchObject({ status: 'DRAFT' });
  expect(await KnowledgeChunk.countDocuments({ documentId: doc.id })).toBe(0);
  vi.restoreAllMocks();
});

it('keeps the previous nutrition formula active when creating a version fails', async () => {
  const active = await NutritionFormula.create({ name: 'ATOMIC_FORMULA', version: 1, active: true, fatLossFactor: 0.85, muscleGainFactor: 1.1, proteinPerKg: 2, fatPerKg: 0.8 });
  vi.spyOn(NutritionFormula, 'create').mockRejectedValueOnce(new Error('formula create failed'));

  await expect(createFormula({ name: 'ATOMIC_FORMULA', fatLossFactor: 0.8, muscleGainFactor: 1.2, proteinPerKg: 2.1, fatPerKg: 0.9 }))
    .rejects.toThrow('formula create failed');

  expect(await NutritionFormula.findById(active.id).lean()).toMatchObject({ active: true });
  vi.restoreAllMocks();
});

it('keeps a progress report draft when its required audit write fails', async () => {
  const report = await ProgressReport.create({ customerId, ptId, periodStart: '2026-08-01', periodEnd: '2026-08-31', summary: 'Atomic report', status: 'DRAFT', version: 1 });
  vi.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('audit write failed'));

  await expect(publishReport({ id: ptId, role: 'PT' }, report.id)).rejects.toThrow('audit write failed');

  expect(await ProgressReport.findById(report.id).lean()).toMatchObject({ status: 'DRAFT', publishedAt: null });
  vi.restoreAllMocks();
});
