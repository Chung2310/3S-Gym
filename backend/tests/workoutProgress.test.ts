import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import PtPackage from '../models/PtPackage.js';
import FeatureFlag from '../models/FeatureFlag.js';

let mongo: MongoMemoryServer; let token: string; let customerId: string;
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10); const pt = await User.create({ username: 'pt-progress', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Progress', phone: '0907000003', assignedPtId: pt.id });
  await PtPackage.create({ customerId: customer.id, name: 'Gói 20 buổi', totalSessions: 20, usedSessions: 0, remainingSessions: 20, startDate: '2026-08-01', endDate: '2026-12-01', status: 'ACTIVE' });
  await FeatureFlag.create({ key: 'EXERCISE_LIBRARY', enabled: true, roles: ['PT'] });
  await FeatureFlag.create({ key: 'PROGRESS', enabled: true, roles: ['PT'] });
  token = tokenFor(pt); customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('tạo template có version và check-in giữ snapshot, trừ đúng một buổi', async () => {
  const template = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({
    title: 'Full body A', goal: 'FAT_LOSS', level: 'BEGINNER', sessions: [{ name: 'Buổi 1', exercises: [{ name: 'Squat', sets: 3, reps: '10', restSeconds: 60 }] }],
  });
  expect(template.status).toBe(201);
  expect(template.body.data.version).toBe(1);

  const payload = { customerId, templateId: template.body.data._id, sessionIndex: 0, performedAt: '2026-09-02', attendance: 'PRESENT', idempotencyKey: 'checkin-001', exerciseLogs: [{ name: 'Squat', sets: [{ reps: 10, weight: 20, rpe: 7 }] }] };
  const first = await request(app).post('/api/workout-sessions').set('Authorization', `Bearer ${token}`).send(payload);
  expect(first.status).toBe(201);
  expect(first.body.data.planSnapshot.title).toBe('Full body A');

  const retry = await request(app).post('/api/workout-sessions').set('Authorization', `Bearer ${token}`).send(payload);
  expect(retry.status).toBe(200);
  expect(retry.body.data._id).toBe(first.body.data._id);

  const pkg = await PtPackage.findOne({ customerId }).lean();
  expect(pkg).toMatchObject({ usedSessions: 1, remainingSessions: 19 });
});

it('lưu số đo và trả chuỗi tiến độ theo thời gian', async () => {
  await request(app).post('/api/body-measurements').set('Authorization', `Bearer ${token}`).send({ customerId, measuredAt: '2026-09-01', weight: 70, bodyFatPercentage: 25, muscleMass: 28 });
  await request(app).post('/api/body-measurements').set('Authorization', `Bearer ${token}`).send({ customerId, measuredAt: '2026-09-02', weight: 69.5, bodyFatPercentage: 24.5, muscleMass: 28.2 });
  const progress = await request(app).get(`/api/progress/${customerId}`).set('Authorization', `Bearer ${token}`);
  expect(progress.status).toBe(200);
  expect(progress.body.data.measurements).toHaveLength(2);
  expect(progress.body.data.measurements[0].weight).toBe(70);
});

it('lists templates with pagination and creates a new version when updated', async () => {
  const created = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({
    title: 'Strength Base', goal: 'STRENGTH', level: 'BEGINNER', sessions: [{ name: 'Day 1', exercises: [{ name: 'Deadlift' }] }],
  });
  const updated = await request(app).patch(`/api/workout-templates/${created.body.data._id}`).set('Authorization', `Bearer ${token}`).send({
    title: 'Strength Base V2', sessions: [{ name: 'Day 1', exercises: [{ name: 'Deadlift' }, { name: 'Row' }] }],
  });
  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ title: 'Strength Base V2', version: 2 });
  const list = await request(app).get('/api/workout-templates?page=1&limit=10&status=ACTIVE').set('Authorization', `Bearer ${token}`);
  expect(list.status).toBe(200);
  expect(list.body.meta).toMatchObject({ page: 1, limit: 10 });
  expect(list.body.data.some((item: { _id: string; version: number }) => item._id === created.body.data._id && item.version === 2)).toBe(true);
});

it('supports template detail, archive and deletion of an unused template', async () => {
  const created = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({ title: 'Temporary Template', goal: 'MOBILITY', level: 'BEGINNER', sessions: [{ name: 'Day 1', exercises: [{ name: 'Mobility' }] }] });
  const id = created.body.data._id;
  expect((await request(app).get(`/api/workout-templates/${id}`).set('Authorization', `Bearer ${token}`)).body.data._id).toBe(id);
  const archived = await request(app).patch(`/api/workout-templates/${id}/archive`).set('Authorization', `Bearer ${token}`);
  expect(archived.body.data.status).toBe('ARCHIVED');
  expect((await request(app).delete(`/api/workout-templates/${id}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
});

it('lists workout sessions and allows correcting or deleting body measurements', async () => {
  const sessions = await request(app).get(`/api/workout-sessions?customerId=${customerId}&page=1&limit=20`).set('Authorization', `Bearer ${token}`);
  expect(sessions.status).toBe(200);
  expect(sessions.body.data.length).toBeGreaterThan(0);
  const created = await request(app).post('/api/body-measurements').set('Authorization', `Bearer ${token}`).send({ customerId, measuredAt: '2026-09-10', weight: 69 });
  const id = created.body.data._id;
  const updated = await request(app).patch(`/api/body-measurements/${id}`).set('Authorization', `Bearer ${token}`).send({ weight: 68.8, notes: 'corrected' });
  expect(updated.status).toBe(200);
  expect(updated.body.data.weight).toBe(68.8);
  expect((await request(app).delete(`/api/body-measurements/${id}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
});
