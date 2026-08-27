import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, beforeAll, expect, it } from 'vitest';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import WorkoutTemplate from '../models/WorkoutTemplate.js';
import WorkoutSession from '../models/WorkoutSession.js';
import PtPackage from '../models/PtPackage.js';
import { createSession } from '../services/workoutProgressService.js';

let mongo: MongoMemoryReplSet;

beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('creates one session and consumes one package unit for concurrent retries', async () => {
  const pt = await User.create({ username: 'pt-concurrent-session', password: 'hashed-value', role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Concurrent', phone: '0908111002', assignedPtId: pt.id });
  const template = await WorkoutTemplate.create({ ownerPtId: pt.id, title: 'Concurrent Template', goal: 'STRENGTH', level: 'BEGINNER', sessions: [{ name: 'Day 1', exercises: [] }] });
  await PtPackage.create({ customerId: customer.id, name: 'Concurrent Package', totalSessions: 2, usedSessions: 0, remainingSessions: 2, startDate: '2026-08-01', endDate: '2026-12-01', status: 'ACTIVE' });
  await WorkoutSession.syncIndexes();
  const payload = { customerId: customer.id, templateId: template.id, sessionIndex: 0, performedAt: '2026-09-02', attendance: 'PRESENT' as const, idempotencyKey: 'concurrent-001' };

  const settled = await Promise.allSettled([
    createSession({ id: pt.id, role: 'PT' }, payload), createSession({ id: pt.id, role: 'PT' }, payload),
  ]);

  expect(settled.every((item) => item.status === 'fulfilled')).toBe(true);
  expect(await WorkoutSession.countDocuments({ ptId: pt.id, idempotencyKey: payload.idempotencyKey })).toBe(1);
  expect(await PtPackage.findOne({ customerId: customer.id }).lean()).toMatchObject({ usedSessions: 1, remainingSessions: 1 });
});
