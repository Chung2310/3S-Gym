import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../services/ocrProvider.js', () => ({ extractInBody: vi.fn().mockResolvedValue({ weight: 70, bodyFatPercentage: 25, muscleMass: 28, bmr: 1600, confidence: 0.95, warnings: [] }) }));
vi.mock('../services/aiProvider.js', () => ({ generateText: vi.fn().mockResolvedValue('Đề xuất an toàn để PT xem xét.') }));

import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import PtPackage from '../models/PtPackage.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryReplSet; let adminToken: string; let ptToken: string; let customerToken: string; let customerId: string;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin-full-journey', password, role: 'ADMIN' });
  const pt = await User.create({ username: 'pt-full-journey', password, role: 'PT' });
  const customerUser = await User.create({ username: 'customer-full-journey', password, role: 'CUSTOMER' });
  const customer = await CustomerProfile.create({ userId: customerUser.id, assignedPtId: pt.id, fullName: 'Khách Full Journey', phone: '0907000099', initialGoal: 'Giảm mỡ', status: 'ACTIVE' });
  await PtPackage.create({ customerId: customer.id, name: '20 sessions', totalSessions: 20, usedSessions: 0, remainingSessions: 20, startDate: '2026-08-01', endDate: '2026-12-01', status: 'ACTIVE' });
  const keys = ['OCR_INBODY', 'ROADMAP', 'EXERCISE_LIBRARY', 'PROGRESS', 'CARE', 'DASHBOARD', 'KNOWLEDGE_BASE', 'PT_ASSISTANT'];
  await FeatureFlag.insertMany(keys.map((key) => ({ key, enabled: true, roles: ['ADMIN', 'PT'] })));
  adminToken = tokenFor(admin); ptToken = tokenFor(pt); customerToken = tokenFor(customerUser); customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('runs Core through OCR, roadmap, workout, progress, care, knowledge and assistant review gates', async () => {
  const ocr = await request(app).post('/api/inbody/ocr').set('Authorization', `Bearer ${ptToken}`).field('customerId', customerId).field('measurementDate', '2026-09-01').attach('image', Buffer.from('fake-image'), { filename: 'inbody.png', contentType: 'image/png' });
  expect(ocr.status).toBe(201);
  const inbodyId = ocr.body.data._id;
  expect((await request(app).patch(`/api/inbody/${inbodyId}/confirm-ocr`).set('Authorization', `Bearer ${ptToken}`).send({ weight: 69.8 })).body.data.ocrStatus).toBe('CONFIRMED');
  await request(app).patch(`/api/inbody/${inbodyId}/publish`).set('Authorization', `Bearer ${ptToken}`).expect(200);

  const roadmap = await request(app).post('/api/roadmaps').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: '12-week roadmap', phases: [{ order: 1, name: 'Foundation', durationWeeks: 4, goals: ['Technique'], weeks: [] }] });
  expect(roadmap.status).toBe(201);
  await request(app).patch(`/api/roadmaps/${roadmap.body.data._id}/publish`).set('Authorization', `Bearer ${ptToken}`).expect(200);

  const template = await request(app).post('/api/workout-templates').set('Authorization', `Bearer ${ptToken}`).send({ title: 'Full body', goal: 'FAT_LOSS', level: 'BEGINNER', sessions: [{ name: 'Day 1', exercises: [{ name: 'Squat', sets: 3, reps: '10' }] }] });
  expect(template.status).toBe(201);
  await request(app).post('/api/workout-sessions').set('Authorization', `Bearer ${ptToken}`).send({ customerId, templateId: template.body.data._id, sessionIndex: 0, performedAt: '2026-09-02', attendance: 'PRESENT', idempotencyKey: 'full-journey-session-1' }).expect(201);
  await request(app).post('/api/body-measurements').set('Authorization', `Bearer ${ptToken}`).send({ customerId, measuredAt: '2026-08-01', weight: 70, bodyFatPercentage: 25, muscleMass: 28 }).expect(201);
  await request(app).post('/api/body-measurements').set('Authorization', `Bearer ${ptToken}`).send({ customerId, measuredAt: '2026-09-02', weight: 69, bodyFatPercentage: 24, muscleMass: 28.5 }).expect(201);
  expect((await request(app).get(`/api/progress/${customerId}`).set('Authorization', `Bearer ${ptToken}`)).body.data.measurements).toHaveLength(2);

  await request(app).post('/api/care/recalculate').set('Authorization', `Bearer ${ptToken}`).send({ asOf: '2026-09-03T08:00:00.000Z' }).expect(200);
  expect((await request(app).get('/api/dashboard/pt').set('Authorization', `Bearer ${ptToken}`)).body.data.customers[0].dataStatus).toBe('READY');

  const knowledge = await request(app).post('/api/knowledge').set('Authorization', `Bearer ${adminToken}`).send({ title: 'Squat safety', topic: 'TECHNIQUE', content: 'Stop painful movement and review squat technique.' });
  await request(app).patch(`/api/knowledge/${knowledge.body.data._id}/publish`).set('Authorization', `Bearer ${adminToken}`).expect(200);
  const conversation = await request(app).post('/api/assistant/conversations').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Squat review' });
  const message = await request(app).post(`/api/assistant/conversations/${conversation.body.data._id}/messages`).set('Authorization', `Bearer ${ptToken}`).send({ content: 'Customer feels pain during squat', requestType: 'CONSULTATION' });
  expect(message.body.data.messages[1]).toMatchObject({ role: 'ASSISTANT', reviewStatus: 'PT_REVIEW_REQUIRED' });

  const report = await request(app).post('/api/progress-reports').set('Authorization', `Bearer ${ptToken}`).send({ customerId, periodStart: '2026-08-01', periodEnd: '2026-09-02', summary: 'Tiến độ ổn định.', metrics: { weightDelta: -1 } });
  await request(app).patch(`/api/progress-reports/${report.body.data._id}/publish`).set('Authorization', `Bearer ${ptToken}`).expect(200);
  const portal = await request(app).get('/api/me/content').set('Authorization', `Bearer ${customerToken}`);
  expect(portal.body.data).toMatchObject({ inbody: expect.any(Array), progressReports: expect.any(Array) });
  expect(portal.body.data.inbody).toHaveLength(1);
  expect(portal.body.data.progressReports).toHaveLength(1);
}, 20_000);
