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
const availabilitySlots = [
  { dayNumber: 1, startMinute: 1080, endMinute: 1200 },
  { dayNumber: 3, startMinute: 1080, endMinute: 1200 },
];
const latestPrompt = () => (vi.mocked(generateText).mock.calls.at(-1) as unknown[] | undefined)?.at(-1);

beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('returns a validated proposal for a customer assigned to the PT', async () => {
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'ai-workout-pt', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách AI', phone: '0907000099', assignedPtId: pt.id, initialGoal: 'Giảm mỡ' });
  vi.mocked(generateText).mockResolvedValueOnce(JSON.stringify({ durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Progressive overload', trainingSplit: 'Full body', priorityMuscleGroups: ['LEGS'], restrictions: [] }));

  await expect(createWorkoutProposal(
    { id: pt.id, role: 'PT' },
    customer.id,
    availabilitySlots,
    'workout-proposal-test',
  )).resolves.toMatchObject({ durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60 });
  expect(latestPrompt()).toContain(JSON.stringify(availabilitySlots));
});

it('accepts schedules in different weeks at the same time', () => {
  const result = createWorkoutTemplateSchema.body!.validate({ title: 'Kế hoạch nhiều tuần', goal: 'FAT_LOSS', level: 'BEGINNER', durationDays: 14, scheduledExercises: [{ weekNumber: 1, dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat', trackingType: 'STRENGTH', prescription: { sets: 3, reps: '10' } }, { weekNumber: 2, dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Row', trackingType: 'STRENGTH', prescription: { sets: 3, reps: '10' } }] });
  expect(result.error).toBeUndefined();
});

it('creates a week-based draft without persisting it', async () => {
  const pt = await User.findOne({ username: 'ai-workout-pt' }).orFail();
  const customer = await CustomerProfile.findOne({ phone: '0907000099' }).orFail();
  vi.mocked(generateText).mockResolvedValueOnce(JSON.stringify({ title: 'Giảm mỡ 8 tuần', goal: 'FAT_LOSS', level: 'BEGINNER', durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, scheduledExercises: [{ weekNumber: 1, dayNumber: 2, startMinute: 480, durationMinutes: 60, generatedExerciseName: 'Squat không dụng cụ' }, { weekNumber: 1, dayNumber: 4, startMinute: 600, durationMinutes: 60, generatedExerciseName: 'Squat không dụng cụ' }], generatedExercises: [{ name: 'Squat không dụng cụ', muscleGroup: 'LEGS', level: 'BEGINNER', defaultTrackingType: 'BODYWEIGHT', equipment: [], description: '', technique: '', commonMistakes: [], contraindications: [], variants: [] }] }));
  const result = await generateWorkoutDraft({ id: pt.id, role: 'PT' }, { customerId: customer.id, proposal: { durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Progressive overload', trainingSplit: 'Full body', priorityMuscleGroups: ['LEGS'], restrictions: [] }, availabilitySlots, additionalRequest: '' }, 'workout-draft-test');
  expect(result).toMatchObject({
    title: 'Giảm mỡ 8 tuần',
    availabilitySlots,
    scheduleWarnings: [],
    scheduledExercises: [
      expect.objectContaining({ weekNumber: 1, dayNumber: 1, startMinute: 1080 }),
      expect.objectContaining({ weekNumber: 1, dayNumber: 3, startMinute: 1080 }),
    ],
  });
  expect(latestPrompt()).toContain(JSON.stringify(availabilitySlots));
});
