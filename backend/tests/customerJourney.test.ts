import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import WorkoutSession from '../models/WorkoutSession.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import CalendarEvent from '../models/CalendarEvent.js';
import ProgressPhoto from '../models/ProgressPhoto.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import ProgressReport from '../models/ProgressReport.js';

const tokenFor = (user: UserDocument) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryReplSet; let ptToken: string; let foreignToken: string; let customerToken: string; let customerId: string;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'pt-journey', password, role: 'PT' });
  const foreign = await User.create({ username: 'pt-journey-foreign', password, role: 'PT' });
  const customerUser = await User.create({ username: 'customer-journey', password, role: 'CUSTOMER' });
  const customer = await CustomerProfile.create({ userId: customerUser.id, assignedPtId: pt.id, fullName: 'Khách Journey', phone: '0909000001', medicalNotes: 'private-medical', internalNotes: 'private-internal' });
  customerId = customer.id; ptToken = tokenFor(pt); foreignToken = tokenFor(foreign); customerToken = tokenFor(customerUser);
  await WorkoutSession.create({ customerId, ptId: pt.id, performedAt: '2026-08-10', attendance: 'PRESENT', idempotencyKey: 'journey-session', planSnapshot: { title: 'Strength', session: { name: 'Day 1' } }, exerciseLogs: [{ name: 'Squat', sets: [{ reps: 10, weight: 50, rpe: 8, completed: true }] }], feeling: 'Tốt', notes: 'Ghi chú cho khách' });
  await BodyMeasurement.create({ customerId, ptId: pt.id, measuredAt: '2026-08-10', weight: 68, measurements: { waist: 82 } });
  await CalendarEvent.create({ customerId, ownerPtId: pt.id, title: 'Buổi tập tiếp theo', startsAt: '2026-09-10', endsAt: '2026-09-10T01:00:00Z' });
  await ProgressPhoto.create({ customerId, ptId: pt.id, photoUrl: 'https://example.com/progress.jpg', takenDate: '2026-08-10', stage: 'PROGRESS', angle: 'FRONT' });
  await WorkoutPlan.create({ customerId, ptId: pt.id, title: 'Giáo án cũ', lifecycleStatus: 'ARCHIVED', archivedAt: '2026-08-01', status: 'PUBLISHED' });
  await WorkoutPlan.create({ customerId, ptId: pt.id, title: 'Giáo án hiện tại', lifecycleStatus: 'ACTIVE', status: 'PUBLISHED' });
  await ProgressReport.create({ customerId, ptId: pt.id, periodStart: '2026-08-01', periodEnd: '2026-08-31', summary: 'Bản nháp', status: 'DRAFT' });
  await ProgressReport.create({ customerId, ptId: pt.id, periodStart: '2026-08-01', periodEnd: '2026-08-31', summary: 'Đã công bố', status: 'PUBLISHED' });
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('returns one aggregated journey to the assigned PT and rejects another PT', async () => {
  const response = await request(app).get(`/api/customers/${customerId}/journey`).set('Authorization', `Bearer ${ptToken}`);
  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ customer: { fullName: 'Khách Journey' }, plans: { active: { title: 'Giáo án hiện tại' } } });
  expect(response.body.data.sessions[0].exerciseLogs[0].sets[0]).toMatchObject({ reps: 10, weight: 50, rpe: 8 });
  expect(response.body.data.plans.history).toHaveLength(1);
  expect((await request(app).get(`/api/customers/${customerId}/journey`).set('Authorization', `Bearer ${foreignToken}`)).status).toBe(403);
});

it('derives customer identity, filters private fields and returns only published reports', async () => {
  const response = await request(app).get('/api/me/journey').set('Authorization', `Bearer ${customerToken}`);
  expect(response.status).toBe(200);
  expect(response.body.data.reports.map((item: { summary: string }) => item.summary)).toEqual(['Đã công bố']);
  expect(response.body.data).toMatchObject({ calendar: [expect.objectContaining({ title: 'Buổi tập tiếp theo' })], photos: [expect.objectContaining({ stage: 'PROGRESS' })] });
  expect(JSON.stringify(response.body.data)).not.toMatch(/private-medical|private-internal|medicalNotes|internalNotes/);
});
