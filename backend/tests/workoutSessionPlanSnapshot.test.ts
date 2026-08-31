import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, expect, it } from 'vitest';
import CustomerProfile from '../models/CustomerProfile.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutSession from '../models/WorkoutSession.js';
import User from '../models/User.js';
import { createSession } from '../services/workoutProgressService.js';

let mongo: MongoMemoryReplSet;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await WorkoutSession.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function assignedCardioPlan(suffix: string) {
  const pt = await User.create({ username: `pt-plan-snapshot-${suffix}`, password: 'hashed-value', role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: `Khách ${suffix}`, phone: `0911${suffix.padStart(6, '0')}`, assignedPtId: pt.id });
  const exerciseId = new mongoose.Types.ObjectId();
  const plan = await WorkoutPlan.create({
    customerId: customer.id,
    ptId: pt.id,
    title: 'Cardio nền tảng',
    goal: 'Sức bền',
    level: 'BEGINNER',
    lifecycleStatus: 'ACTIVE',
    version: 3,
    sessions: [{ name: 'Buổi chạy', exercises: [{ exerciseId, name: 'Treadmill Run', trackingType: 'CARDIO', prescription: { durationMinutes: 20, distanceKm: 3 } }] }],
  });
  return { pt, customer, exerciseId, plan };
}

it('creates exercise logs only from the active assigned plan snapshot', async () => {
  const { pt, customer, plan } = await assignedCardioPlan('1');
  const result = await createSession({ id: pt.id, role: 'PT' }, {
    customerId: customer.id,
    workoutPlanId: plan.id,
    workoutPlanVersion: 3,
    sessionIndex: 0,
    performedAt: '2026-09-02',
    attendance: 'PRESENT',
    idempotencyKey: 'trusted-plan-001',
    exerciseResults: [{ exerciseIndex: 0, result: { durationMinutes: 22, distanceKm: 3.4, inclinePercent: 0 }, notes: 'Nhịp ổn', name: 'Forged name', trackingType: 'STRENGTH', prescription: { sets: 99 } } as never],
  });

  expect(result.created).toBe(true);
  expect(result.session).toMatchObject({ workoutPlanId: plan._id, workoutPlanVersion: 3 });
  expect(result.session.planSnapshot).toMatchObject({ workoutPlanId: plan._id, title: 'Cardio nền tảng', version: 3, sessionIndex: 0, session: { name: 'Buổi chạy' } });
  expect(result.session.exerciseLogs[0]).toMatchObject({ name: 'Treadmill Run', trackingType: 'CARDIO', prescribedSnapshot: { durationMinutes: 20, distanceKm: 3 }, result: { durationMinutes: 22, distanceKm: 3.4, inclinePercent: 0 }, notes: 'Nhịp ổn' });
  expect(result.session.toObject().exerciseLogs[0]).not.toHaveProperty('sets');
});

it('rejects stale versions and plans that are no longer active', async () => {
  const { pt, customer, plan } = await assignedCardioPlan('2');
  const base = { customerId: customer.id, workoutPlanId: plan.id, sessionIndex: 0, performedAt: '2026-09-02', attendance: 'PRESENT' as const, exerciseResults: [{ exerciseIndex: 0, result: { durationMinutes: 20 } }] };

  await expect(createSession({ id: pt.id, role: 'PT' }, { ...base, workoutPlanVersion: 2, idempotencyKey: 'stale-001' })).rejects.toMatchObject({ status: 409 });
  await WorkoutPlan.updateOne({ _id: plan._id }, { lifecycleStatus: 'ARCHIVED' });
  await expect(createSession({ id: pt.id, role: 'PT' }, { ...base, workoutPlanVersion: 3, idempotencyKey: 'archived-001' })).rejects.toMatchObject({ status: 409 });
});

it('rejects results that do not match the prescribed tracking type', async () => {
  const { pt, customer, plan } = await assignedCardioPlan('3');
  await expect(createSession({ id: pt.id, role: 'PT' }, {
    customerId: customer.id, workoutPlanId: plan.id, workoutPlanVersion: 3, sessionIndex: 0,
    performedAt: '2026-09-02', attendance: 'PRESENT', idempotencyKey: 'mismatch-001',
    exerciseResults: [{ exerciseIndex: 0, result: { sets: [{ reps: 10, weight: 60, completed: true }] } }],
  })).rejects.toMatchObject({ status: 400 });
  expect(await WorkoutSession.countDocuments({ idempotencyKey: 'mismatch-001' })).toBe(0);
});

it('stores no exercise results for an absent customer', async () => {
  const { pt, customer, plan } = await assignedCardioPlan('4');
  const result = await createSession({ id: pt.id, role: 'PT' }, {
    customerId: customer.id, workoutPlanId: plan.id, workoutPlanVersion: 3, sessionIndex: 0,
    performedAt: '2026-09-02', attendance: 'ABSENT', idempotencyKey: 'absent-001', exerciseResults: [],
  });
  expect(result.session.exerciseLogs).toEqual([]);

  await expect(createSession({ id: pt.id, role: 'PT' }, {
    customerId: customer.id, workoutPlanId: plan.id, workoutPlanVersion: 3, sessionIndex: 0,
    performedAt: '2026-09-03', attendance: 'ABSENT', idempotencyKey: 'absent-invalid-001', exerciseResults: [{ exerciseIndex: 0, result: { durationMinutes: 20 } }],
  })).rejects.toMatchObject({ status: 400 });
});
