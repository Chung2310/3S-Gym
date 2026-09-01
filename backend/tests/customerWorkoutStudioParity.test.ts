import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import CustomerProfile from '../models/CustomerProfile.js';
import User from '../models/User.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutTemplate from '../models/WorkoutTemplate.js';
import { assignCustomerWorkoutPlan, updateCustomerWorkoutPlan } from '../services/customerWorkoutPlanService.js';
import { updateTemplate as updateWorkoutTemplate } from '../services/workoutProgressService.js';
import { updateCustomerPlanSchema } from '../validators/customerWorkoutPlanValidator.js';
import { updateWorkoutTemplateSchema } from '../validators/workoutValidator.js';

const strengthExercise = {
  name: 'Back Squat',
  trackingType: 'STRENGTH',
  prescription: {
    sets: 3,
    reps: '8',
    targetWeight: 60,
    restSeconds: 90,
  },
};

function scheduleItem(weekNumber: number, startMinute = 480) {
  return {
    ...strengthExercise,
    weekNumber,
    dayNumber: 1,
    startMinute,
    durationMinutes: 60,
  };
}

function validateCustomerBody(body: Record<string, unknown>) {
  return updateCustomerPlanSchema.body!.validate(body, { abortEarly: false });
}

function validateTemplateBody(body: Record<string, unknown>) {
  return updateWorkoutTemplateSchema.body!.validate(body, { abortEarly: false });
}

describe('customer workout Studio validation parity', () => {
  it('accepts the unchanged multi-week Studio payload accepted for templates', () => {
    const body = {
      title: 'Giáo án hai tuần',
      goal: 'Tăng sức mạnh',
      level: 'BEGINNER',
      durationDays: 14,
      scheduledExercises: [scheduleItem(1), scheduleItem(2)],
      unscheduledExercises: [],
    };

    expect(validateTemplateBody(body).error).toBeUndefined();
    expect(validateCustomerBody(body).error).toBeUndefined();
  });

  it('allows the same time slot on the same weekday in different weeks', () => {
    const result = validateCustomerBody({
      durationDays: 14,
      scheduledExercises: [scheduleItem(1), scheduleItem(2)],
    });

    expect(result.error).toBeUndefined();
  });

  it('rejects overlapping exercises in the same week and day', () => {
    const result = validateCustomerBody({
      durationDays: 7,
      scheduledExercises: [scheduleItem(1), scheduleItem(1, 510)],
    });

    expect(result.error).toBeDefined();
  });

  it('enforces the 15-minute Studio grid for customer plans', () => {
    const result = validateCustomerBody({
      durationDays: 7,
      scheduledExercises: [{ ...scheduleItem(1), startMinute: 487 }],
    });

    expect(result.error).toBeDefined();
  });

  it('accepts a partial schedule PATCH so the service can validate it against persisted duration', () => {
    const result = validateCustomerBody({
      scheduledExercises: [scheduleItem(1)],
    });

    expect(result.error).toBeUndefined();
  });
});

describe('customer workout Studio persistence parity', () => {
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

  it('preserves week numbers through assignment and an unchanged Studio save', async () => {
    const pt = await User.create({
      username: 'studio-parity-pt',
      password: 'hashed-password',
      role: 'PT',
    });
    const customer = await CustomerProfile.create({
      assignedPtId: pt._id,
      fullName: 'Khách Studio',
      phone: '0909000002',
    });
    const template = await WorkoutTemplate.create({
      ownerPtId: pt._id,
      title: 'Giáo án hai tuần',
      goal: 'Tăng sức mạnh',
      level: 'BEGINNER',
      durationDays: 14,
      scheduledExercises: [scheduleItem(1), scheduleItem(2)],
      unscheduledExercises: [],
      sessions: [],
    });
    const actor = { id: pt.id, username: pt.username, role: pt.role };

    await expect(updateWorkoutTemplate(actor, template.id, {
      durationDays: 7,
    })).rejects.toMatchObject({ status: 400 });

    const assigned = await assignCustomerWorkoutPlan(actor, customer.id, template.id);
    expect(assigned.scheduledExercises.map((item: { get(path: string): unknown }) => item.get('weekNumber'))).toEqual([1, 2]);

    await expect(updateCustomerWorkoutPlan(actor, customer.id, assigned.id, {
      durationDays: 7,
    })).rejects.toMatchObject({ status: 400 });

    const unchangedSchedule = assigned.toObject().scheduledExercises as Array<Record<string, unknown>>;
    await updateCustomerWorkoutPlan(actor, customer.id, assigned.id, {
      title: assigned.title,
      goal: assigned.goal,
      level: assigned.level,
      durationDays: assigned.durationDays,
      scheduledExercises: unchangedSchedule,
      unscheduledExercises: assigned.toObject().unscheduledExercises,
    });

    const reloaded = await WorkoutPlan.findById(assigned.id).orFail();
    expect(reloaded.scheduledExercises.map((item) => item.get('weekNumber'))).toEqual([1, 2]);
    expect(reloaded.sessions.map((session) => session.name)).toEqual(['Tuần 1 · Ngày 1', 'Tuần 2 · Ngày 1']);

    const sourceTemplate = await WorkoutTemplate.findById(template.id).orFail();
    expect(sourceTemplate.toObject()).toEqual(template.toObject());
  });
});
