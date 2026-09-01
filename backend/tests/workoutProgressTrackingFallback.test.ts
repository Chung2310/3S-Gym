import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import CustomerProfile from '../models/CustomerProfile.js';
import Exercise from '../models/Exercise.js';
import User from '../models/User.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import { getJourney } from '../services/customerJourneyService.js';
import { createSession } from '../services/workoutProgressService.js';

describe('workout progress tracking fallback', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    await mongoose.connection.db?.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  async function createLegacyPlan() {
    const pt = await User.create({
      username: 'tracking-fallback-pt',
      password: 'hashed-password',
      role: 'PT',
    });
    const customer = await CustomerProfile.create({
      assignedPtId: pt._id,
      fullName: 'Khach tracking cu',
      phone: '0909000010',
    });
    const exercise = await Exercise.create({
      name: 'Chay bo',
      muscleGroup: 'Toan than',
      level: 'BEGINNER',
      ownerPtId: pt._id,
      defaultTrackingType: 'CARDIO',
    });
    const plan = await WorkoutPlan.create({
      customerId: customer._id,
      ptId: pt._id,
      title: 'Giao an cu',
      version: 1,
      lifecycleStatus: 'ACTIVE',
      sessions: [{
        name: 'Buoi 1',
        exercises: [{
          exerciseId: exercise._id,
          name: exercise.name,
          trackingType: 'UNCLASSIFIED',
          prescription: {},
        }],
      }],
    });
    const actor = { id: pt.id, username: pt.username, role: pt.role };

    return { actor, customer, exercise, plan };
  }

  it('uses the current exercise tracking type when loading an old active plan', async () => {
    const { actor, customer } = await createLegacyPlan();

    const journey = await getJourney(actor, { customerId: customer.id });
    const activePlan = journey.plans.active as { sessions: Array<{ exercises: Array<{ trackingType: string }> }> };

    expect(activePlan.sessions[0].exercises[0].trackingType).toBe('CARDIO');
  });

  it('uses the same fallback when saving a workout session', async () => {
    const { actor, customer, exercise, plan } = await createLegacyPlan();

    const created = await createSession(actor, {
      customerId: customer.id,
      workoutPlanId: plan.id,
      workoutPlanVersion: plan.version,
      sessionIndex: 0,
      performedAt: '2026-09-01T07:00:00.000Z',
      attendance: 'PRESENT',
      idempotencyKey: 'tracking-fallback-session',
      exerciseResults: [{
        exerciseId: exercise.id,
        exerciseIndex: 0,
        result: { durationMinutes: 30 },
      }],
    });

    expect(created.session.exerciseLogs[0]).toMatchObject({
      trackingType: 'CARDIO',
      result: { durationMinutes: 30 },
    });
  });

  it('preserves an explicit tracking type already saved in the customer plan', async () => {
    const { actor, customer, plan } = await createLegacyPlan();
    await WorkoutPlan.updateOne(
      { _id: plan._id },
      { $set: { 'sessions.0.exercises.0.trackingType': 'STRENGTH' } },
    );

    const journey = await getJourney(actor, { customerId: customer.id });
    const activePlan = journey.plans.active as { sessions: Array<{ exercises: Array<{ trackingType: string }> }> };

    expect(activePlan.sessions[0].exercises[0].trackingType).toBe('STRENGTH');
  });
});
