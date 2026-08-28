import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import CustomerProfile from '../models/CustomerProfile.js';
import User from '../models/User.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutTemplate from '../models/WorkoutTemplate.js';

let mongo: MongoMemoryReplSet;
let token: string;
let customerId: string;
let templateId: string;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'pt-plan-tab', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Giáo Án', phone: '0903999001', assignedPtId: pt.id });
  const template = await WorkoutTemplate.create({
    ownerPtId: pt.id,
    title: 'Tăng cơ 7 ngày',
    goal: 'Tăng cơ',
    level: 'BEGINNER',
    durationDays: 7,
    muscleGroups: ['Chân', 'Lưng'],
    defaultSets: 4,
    defaultReps: '8-12',
    defaultWeight: '60-70% 1RM',
    defaultTempo: '3-1-1-0',
    technicalNotes: 'Giữ thân người ổn định.',
    scheduledExercises: [{ dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat' }],
    unscheduledExercises: [{ name: 'Row', durationMinutes: 30 }],
    sessions: [{ name: 'Ngày 1', exercises: [{ name: 'Squat' }] }],
  });
  token = jwt.sign({ id: pt.id, role: 'PT' }, process.env.JWT_SECRET || 'secret_key');
  customerId = customer.id;
  templateId = template.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('assigns an independent active snapshot and archives it when assigning again', async () => {
  const first = await request(app).post(`/api/customers/${customerId}/workout-plans/assign`).set('Authorization', `Bearer ${token}`).send({ templateId });
  expect(first.status).toBe(201);
  expect(first.body.data).toMatchObject({ title: 'Tăng cơ 7 ngày', lifecycleStatus: 'ACTIVE', sourceTemplateId: templateId });
  expect(first.body.data.scheduledExercises).toHaveLength(1);
  expect(first.body.data.unscheduledExercises).toHaveLength(1);
  expect(first.body.data.sessions).toHaveLength(1);
  expect(first.body.data).toMatchObject({ muscleGroups: ['Chân', 'Lưng'], defaultSets: 4, defaultReps: '8-12', defaultWeight: '60-70% 1RM', defaultTempo: '3-1-1-0', technicalNotes: 'Giữ thân người ổn định.' });

  await WorkoutTemplate.findByIdAndUpdate(templateId, { title: 'Mẫu đã đổi', status: 'ARCHIVED' });
  const second = await request(app).post(`/api/customers/${customerId}/workout-plans/assign`).set('Authorization', `Bearer ${token}`).send({ templateId });
  expect(second.status).toBe(201);

  const listed = await request(app).get(`/api/customers/${customerId}/workout-plans`).set('Authorization', `Bearer ${token}`);
  expect(listed.status).toBe(200);
  expect(listed.body.data.active.title).toBe('Mẫu đã đổi');
  expect(listed.body.data.history).toHaveLength(1);
  expect(listed.body.data.history[0]).toMatchObject({ title: 'Tăng cơ 7 ngày', lifecycleStatus: 'ARCHIVED' });
  expect(await WorkoutPlan.countDocuments({ customerId, lifecycleStatus: 'ACTIVE' })).toBe(1);
});

it('updates only the customer snapshot and rejects archived snapshots', async () => {
  const plans = await WorkoutPlan.find({ customerId }).sort({ createdAt: 1 });
  const archived = plans[0];
  const active = plans[1];
  const rejected = await request(app).patch(`/api/customers/${customerId}/workout-plans/${archived.id}`).set('Authorization', `Bearer ${token}`).send({ title: 'Không được sửa' });
  expect(rejected.status).toBe(409);

  const updated = await request(app).patch(`/api/customers/${customerId}/workout-plans/${active.id}`).set('Authorization', `Bearer ${token}`).send({ title: 'Bản riêng của khách', defaultSets: 5, technicalNotes: 'Ghi chú riêng.' });
  expect(updated.status).toBe(200);
  expect(updated.body.data.title).toBe('Bản riêng của khách');
  expect(updated.body.data).toMatchObject({ defaultSets: 5, technicalNotes: 'Ghi chú riêng.' });
  expect((await WorkoutTemplate.findById(templateId))?.title).toBe('Mẫu đã đổi');
  expect((await WorkoutTemplate.findById(templateId))?.defaultSets).toBe(4);
});
