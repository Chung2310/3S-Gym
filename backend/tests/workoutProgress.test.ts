import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import PtPackage from '../models/PtPackage.js';
import FeatureFlag from '../models/FeatureFlag.js';

let mongo: MongoMemoryReplSet; let token: string; let customerId: string;
const strengthTracking = { trackingType: 'STRENGTH', prescription: { sets: 3, reps: '10' } } as const;
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri());
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
    title: 'Full body A', goal: 'FAT_LOSS', level: 'BEGINNER', sessions: [{ name: 'Buổi 1', exercises: [{ name: 'Squat', sets: 3, reps: '10', restSeconds: 60, ...strengthTracking }] }],
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

it('normalizes nested and legacy circumference measurements without dropping existing values', async () => {
  const nested = await request(app).post('/api/body-measurements').set('Authorization', `Bearer ${token}`).send({
    customerId,
    measuredAt: '2026-09-03',
    measurements: { chest: 100, waist: 82, calf: 38 },
  });
  expect(nested.status).toBe(201);
  expect(nested.body.data.measurements).toEqual({ chest: 100, waist: 82, calf: 38 });

  const legacy = await request(app).post('/api/body-measurements').set('Authorization', `Bearer ${token}`).send({
    customerId,
    measuredAt: '2026-09-04',
    chest: 99,
    waist: 81,
    calf: 37.5,
  });
  expect(legacy.status).toBe(201);
  expect(legacy.body.data.measurements).toEqual({ chest: 99, waist: 81, calf: 37.5 });

  const updated = await request(app).patch(`/api/body-measurements/${nested.body.data._id}`).set('Authorization', `Bearer ${token}`).send({
    measurements: { waist: 80 },
  });
  expect(updated.status).toBe(200);
  expect(updated.body.data.measurements).toEqual({ chest: 100, waist: 80, calf: 38 });
});

it('lists templates with pagination and creates a new version when updated', async () => {
  const created = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({
    title: 'Strength Base', goal: 'STRENGTH', level: 'BEGINNER', sessions: [{ name: 'Day 1', exercises: [{ name: 'Deadlift', ...strengthTracking }] }],
  });
  const updated = await request(app).patch(`/api/workout-templates/${created.body.data._id}`).set('Authorization', `Bearer ${token}`).send({
    title: 'Strength Base V2', sessions: [{ name: 'Day 1', exercises: [{ name: 'Deadlift', ...strengthTracking }, { name: 'Row', ...strengthTracking }] }],
  });
  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ title: 'Strength Base V2', version: 2 });
  const list = await request(app).get('/api/workout-templates?page=1&limit=10&status=ACTIVE').set('Authorization', `Bearer ${token}`);
  expect(list.status).toBe(200);
  expect(list.body.meta).toMatchObject({ page: 1, limit: 10 });
  expect(list.body.data.some((item: { _id: string; version: number }) => item._id === created.body.data._id && item.version === 2)).toBe(true);
});

it('supports template detail, archive and deletion of an unused template', async () => {
  const created = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({ title: 'Temporary Template', goal: 'MOBILITY', level: 'BEGINNER', sessions: [{ name: 'Day 1', exercises: [{ name: 'Mobility', trackingType: 'MOBILITY', prescription: { durationMinutes: 10 } }] }] });
  const id = created.body.data._id;
  expect((await request(app).get(`/api/workout-templates/${id}`).set('Authorization', `Bearer ${token}`)).body.data._id).toBe(id);
  const archived = await request(app).patch(`/api/workout-templates/${id}/archive`).set('Authorization', `Bearer ${token}`);
  expect(archived.body.data.status).toBe('ARCHIVED');
  const edited = await request(app).patch(`/api/workout-templates/${id}`).set('Authorization', `Bearer ${token}`).send({ title: 'Temporary Template Updated' });
  expect(edited.status).toBe(200);
  expect(edited.body.data).toMatchObject({ title: 'Temporary Template Updated', status: 'ARCHIVED' });
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

it('stores a studio schedule and rejects overlapping exercises', async () => {
  const scheduledExercises = [
    { dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat', sets: 3, reps: '10', restSeconds: 60, ...strengthTracking },
    { dayNumber: 1, startMinute: 540, durationMinutes: 30, name: 'Row', sets: 3, reps: '12', restSeconds: 45, ...strengthTracking },
  ];
  const created = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({
    title: 'Studio Plan', goal: 'STRENGTH', level: 'BEGINNER', durationDays: 7, scheduledExercises,
    muscleGroups: ['Chân', 'Lưng'], defaultSets: 4, defaultReps: '8-12', defaultWeight: '60-70% 1RM', defaultTempo: '3-1-1-0', technicalNotes: 'Giữ thân người ổn định.',
  });
  expect(created.status).toBe(201);
  expect(created.body.data).toMatchObject({ durationDays: 7, scheduledExercises, muscleGroups: ['Chân', 'Lưng'], defaultSets: 4, defaultReps: '8-12', defaultWeight: '60-70% 1RM', defaultTempo: '3-1-1-0', technicalNotes: 'Giữ thân người ổn định.' });
  expect(created.body.data.sessions).toEqual([{ name: 'Ngày 1', exercises: [expect.objectContaining({ name: 'Squat' }), expect.objectContaining({ name: 'Row' })] }]);

  const overlap = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({
    title: 'Overlap Plan', goal: 'STRENGTH', level: 'BEGINNER', durationDays: 7,
    scheduledExercises: [scheduledExercises[0], { ...scheduledExercises[1], startMinute: 525 }],
  });
  expect(overlap.status).toBe(400);
});

it('stores unscheduled studio exercises without adding them to compatible sessions', async () => {
  const scheduled = { dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat', sets: 3, reps: '10', restSeconds: 60, ...strengthTracking };
  const unscheduled = { name: 'Legacy Row', durationMinutes: 45, sets: 4, reps: '8', weight: '40kg', rpe: 8, rir: 2, tempo: '3-1-1', restSeconds: 90, notes: 'Giữ lưng thẳng', trackingType: 'STRENGTH', prescription: { sets: 4, reps: '8' } };
  const created = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({
    title: 'Studio Draft', goal: 'STRENGTH', level: 'INTERMEDIATE', durationDays: 7,
    scheduledExercises: [scheduled], unscheduledExercises: [unscheduled],
  });
  expect(created.status).toBe(201);
  expect(created.body.data.unscheduledExercises).toEqual([expect.objectContaining(unscheduled)]);
  expect(created.body.data.sessions).toEqual([{ name: 'Ngày 1', exercises: [expect.objectContaining({ name: 'Squat' })] }]);
});

it.each([
  ['off the 15 minute grid', { dayNumber: 1, startMinute: 481, durationMinutes: 60 }],
  ['past durationDays', { dayNumber: 8, startMinute: 480, durationMinutes: 60 }],
  ['past the 24 hour boundary', { dayNumber: 1, startMinute: 1425, durationMinutes: 30 }],
])('rejects a studio exercise %s', async (_caseName, schedule) => {
  const response = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${token}`).send({
    title: 'Invalid Studio', goal: 'STRENGTH', level: 'BEGINNER', durationDays: 7,
    scheduledExercises: [{ ...schedule, name: 'Invalid exercise', sets: 3, reps: '10', ...strengthTracking }],
  });
  expect(response.status).toBe(400);
});
