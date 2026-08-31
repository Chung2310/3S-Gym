import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { vi } from 'vitest';

vi.mock('../services/aiProvider.js', () => ({ generateText: vi.fn() }));

import { generateText } from '../services/aiProvider.js';
import { createWorkoutProposal, generateWorkoutDraft } from '../services/aiWorkoutService.js';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import { createWorkoutTemplateSchema } from '../validators/workoutValidator.js';

let mongo: MongoMemoryServer;

beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('returns a validated proposal for a customer assigned to the PT', async () => {
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'ai-workout-pt', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách AI', phone: '0907000099', assignedPtId: pt.id, initialGoal: 'Giảm mỡ' });
  vi.mocked(generateText).mockResolvedValueOnce(JSON.stringify({ durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Progressive overload', trainingSplit: 'Full body', priorityMuscleGroups: ['LEGS'], restrictions: [] }));

  await expect(createWorkoutProposal({ id: pt.id, role: 'PT' }, customer.id)).resolves.toMatchObject({ durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60 });
});

it('accepts schedules in different weeks at the same time', () => {
  const result = createWorkoutTemplateSchema.body!.validate({ title: 'Kế hoạch nhiều tuần', goal: 'FAT_LOSS', level: 'BEGINNER', durationDays: 7, scheduledExercises: [{ weekNumber: 1, dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat' }, { weekNumber: 2, dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Row' }] });
  expect(result.error).toBeUndefined();
});

it('creates a week-based draft without persisting it', async () => {
  const pt = await User.findOne({ username: 'ai-workout-pt' }).orFail();
  const customer = await CustomerProfile.findOne({ phone: '0907000099' }).orFail();
  vi.mocked(generateText).mockResolvedValueOnce(JSON.stringify({ title: 'Giảm mỡ 8 tuần', goal: 'FAT_LOSS', level: 'BEGINNER', durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, scheduledExercises: [{ weekNumber: 1, dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat', sets: 3, reps: '10' }], generatedExercises: [] }));
  await expect(generateWorkoutDraft({ id: pt.id, role: 'PT' }, { customerId: customer.id, proposal: { durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Progressive overload', trainingSplit: 'Full body', priorityMuscleGroups: ['LEGS'], restrictions: [] }, additionalRequest: '' })).resolves.toMatchObject({ title: 'Giảm mỡ 8 tuần', scheduledExercises: [expect.objectContaining({ weekNumber: 1 })] });
});
