import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, expect, it } from 'vitest';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutSession from '../models/WorkoutSession.js';
import PtPackage from '../models/PtPackage.js';
import { createSession, updateSession } from '../services/workoutProgressService.js';

let mongo: MongoMemoryReplSet;

beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('creates one session and consumes one package unit for concurrent retries', async () => {
  const pt = await User.create({ username: 'pt-concurrent-session', password: 'hashed-value', role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Concurrent', phone: '0908111002', assignedPtId: pt.id });
  const plan = await WorkoutPlan.create({ customerId: customer.id, ptId: pt.id, title: 'Concurrent Plan', goal: 'STRENGTH', level: 'BEGINNER', lifecycleStatus: 'ACTIVE', version: 1, sessions: [{ name: 'Day 1', exercises: [] }] });
  await PtPackage.create({ customerId: customer.id, name: 'Concurrent Package', totalSessions: 2, usedSessions: 0, remainingSessions: 2, startDate: '2026-08-01', endDate: '2026-12-01', status: 'ACTIVE' });
  await WorkoutSession.syncIndexes();
  const payload = { customerId: customer.id, workoutPlanId: plan.id, workoutPlanVersion: 1, sessionIndex: 0, performedAt: '2026-09-02', attendance: 'PRESENT' as const, exerciseResults: [], idempotencyKey: 'concurrent-001' };

  const settled = await Promise.allSettled([
    createSession({ id: pt.id, role: 'PT' }, payload), createSession({ id: pt.id, role: 'PT' }, payload),
  ]);

  expect(settled.every((item) => item.status === 'fulfilled')).toBe(true);
  expect(await WorkoutSession.countDocuments({ ptId: pt.id, idempotencyKey: payload.idempotencyKey })).toBe(1);
  expect(await PtPackage.findOne({ customerId: customer.id }).lean()).toMatchObject({ usedSessions: 1, remainingSessions: 1 });
});

it('corrects mutable workout details while preserving the plan snapshot and ownership', async () => {
  const pt = await User.create({ username: 'pt-session-editor', password: 'hashed-value', role: 'PT' });
  const foreignPt = await User.create({ username: 'pt-session-foreign', password: 'hashed-value', role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Session', phone: '0908111003', assignedPtId: pt.id });
  const session = await WorkoutSession.create({
    customerId: customer.id, ptId: pt.id, performedAt: '2026-09-03', attendance: 'PRESENT', idempotencyKey: 'edit-001',
    planSnapshot: { title: 'Original plan', version: 1, session: { name: 'Day 1' } },
    exerciseLogs: [{ name: 'Squat', sets: [{ reps: 8, weight: 50, rpe: 7, completed: true }] }],
  });

  const updated = await updateSession({ id: pt.id, role: 'PT' }, session.id, {
    feeling: 'Khỏe', notes: 'Kỹ thuật ổn',
    exerciseLogs: [{ name: 'Squat', sets: [{ reps: 10, weight: 55, rpe: 8, completed: true }] }],
    planSnapshot: { title: 'Tampered' }, customerId: foreignPt.id,
  });
  expect(updated).toMatchObject({ feeling: 'Khỏe', notes: 'Kỹ thuật ổn' });
  expect((updated.exerciseLogs[0] as { sets: Array<Record<string, unknown>> }).sets[0]).toMatchObject({ reps: 10, weight: 55, rpe: 8 });
  expect(updated.planSnapshot).toMatchObject({ title: 'Original plan', version: 1 });

  await expect(updateSession({ id: foreignPt.id, role: 'PT' }, session.id, { feeling: 'Không được phép' })).rejects.toMatchObject({ status: 403 });
});

it('persists typed results while retaining legacy set logs', async () => {
  const pt = await User.create({ username: 'pt-typed-session', password: 'hashed-value', role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Typed', phone: '0908111099', assignedPtId: pt.id });
  const typed = await WorkoutSession.create({
    customerId: customer.id, ptId: pt.id, performedAt: '2026-09-04', attendance: 'PRESENT', idempotencyKey: 'typed-001',
    workoutPlanId: new mongoose.Types.ObjectId(), workoutPlanVersion: 2, planSnapshot: { title: 'Cardio plan' },
    exerciseLogs: [{ name: 'Treadmill Run', trackingType: 'CARDIO', prescribedSnapshot: { durationMinutes: 20 }, result: { durationMinutes: 22, distanceKm: 3.4, inclinePercent: 0 } }],
  });
  const legacy = await WorkoutSession.create({
    customerId: customer.id, ptId: pt.id, performedAt: '2026-09-05', attendance: 'PRESENT', idempotencyKey: 'legacy-001',
    planSnapshot: { title: 'Legacy plan' }, exerciseLogs: [{ name: 'Squat', sets: [{ weight: 50, reps: 10, completed: true }] }],
  });

  expect((typed.exerciseLogs[0] as Record<string, unknown>).result).toMatchObject({ durationMinutes: 22, distanceKm: 3.4, inclinePercent: 0 });
  expect((legacy.exerciseLogs[0] as { sets: unknown[] }).sets).toHaveLength(1);
});
