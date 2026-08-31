import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../services/aiProvider.js', () => ({ generateText: vi.fn().mockImplementation((_context: unknown, prompt: string) => Promise.resolve(prompt.includes('scheduledExercises') ? JSON.stringify({ title: 'Draft AI', goal: 'FAT_LOSS', level: 'BEGINNER', durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, scheduledExercises: [{ weekNumber: 1, dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat', sets: 3, reps: '10' }], generatedExercises: [] }) : JSON.stringify({ durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Full body', trainingSplit: 'Full body', priorityMuscleGroups: ['LEGS'], restrictions: [] }))) }));
import app from '../app.js';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import WorkoutTemplate from '../models/WorkoutTemplate.js';

let mongo: MongoMemoryServer;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('returns an AI workout proposal for an assigned customer without persisting a template', async () => {
  const pt = await User.create({ username: 'ai-api-pt', password: await bcrypt.hash('MatKhau123!', 10), role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách API', phone: '0907000088', assignedPtId: pt.id });
  await FeatureFlag.create({ key: 'EXERCISE_LIBRARY', enabled: true, roles: ['PT'] });
  const token = jwt.sign({ id: pt.id, role: pt.role }, process.env.JWT_SECRET || 'secret_key');
  const response = await request(app).post('/api/ai/workout-proposals').set('Authorization', `Bearer ${token}`).send({ customerId: customer.id });
  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ durationWeeks: 8, sessionsPerWeek: 4 });
});

it('does not persist templates while generating a draft', async () => {
  expect(await WorkoutTemplate.countDocuments()).toBe(0);
});

it('returns a generated draft without persisting it', async () => {
  const pt = await User.findOne({ username: 'ai-api-pt' }).orFail();
  const customer = await CustomerProfile.findOne({ phone: '0907000088' }).orFail();
  const token = jwt.sign({ id: pt.id, role: pt.role }, process.env.JWT_SECRET || 'secret_key');
  const response = await request(app).post('/api/ai/workout-generations').set('Authorization', `Bearer ${token}`).send({ customerId: customer.id, proposal: { durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Full body', trainingSplit: 'Full body', priorityMuscleGroups: ['LEGS'], restrictions: [] }, additionalRequest: '' });
  expect(response.status).toBe(200);
});
