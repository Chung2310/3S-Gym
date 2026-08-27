import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import User, { type UserDocument } from '../models/User.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer;
let ptToken: string;
let customerId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'pt-remaining-crud', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách CRUD', phone: '0907111199', assignedPtId: pt.id, status: 'ACTIVE' });
  await FeatureFlag.create({ key: 'CARE', enabled: true, roles: ['PT'] });
  await FeatureFlag.create({ key: 'PROGRESS', enabled: true, roles: ['PT'] });
  ptToken = tokenFor(pt);
  customerId = customer.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('PT xem, sửa và xóa nhiệm vụ đang mở của khách phụ trách', async () => {
  const created = await request(app).post('/api/care/tasks').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Nhắc lịch tập', dueAt: '2026-09-04T08:00:00.000Z' });
  const taskId = created.body.data._id;
  const list = await request(app).get(`/api/care/tasks?customerId=${customerId}&status=OPEN&page=1&limit=20`).set('Authorization', `Bearer ${ptToken}`);
  expect(list.status).toBe(200);
  expect(list.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ _id: taskId })]));
  expect((await request(app).get(`/api/care/tasks/${taskId}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(200);
  const updated = await request(app).patch(`/api/care/tasks/${taskId}`).set('Authorization', `Bearer ${ptToken}`).send({ title: 'Nhắc lịch đo InBody' });
  expect(updated.status).toBe(200);
  expect(updated.body.data.title).toBe('Nhắc lịch đo InBody');
  expect((await request(app).delete(`/api/care/tasks/${taskId}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(200);
  expect((await request(app).get(`/api/care/tasks/${taskId}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(404);
});

it('PT lọc được nhật ký chăm sóc của khách phụ trách', async () => {
  const task = await request(app).post('/api/care/tasks').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Gọi khách', dueAt: '2026-09-04T08:00:00.000Z' });
  await request(app).patch(`/api/care/tasks/${task.body.data._id}/complete`).set('Authorization', `Bearer ${ptToken}`).send({ result: 'Đã gọi.' });
  const logs = await request(app).get(`/api/care/logs?customerId=${customerId}&page=1&limit=20`).set('Authorization', `Bearer ${ptToken}`);
  expect(logs.status).toBe(200);
  expect(logs.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ customerId, kind: 'TASK_COMPLETED' })]));
});

it('PT quản lý đầy đủ vòng đời bản nháp progress report', async () => {
  const created = await request(app).post('/api/progress-reports').set('Authorization', `Bearer ${ptToken}`).send({ customerId, periodStart: '2026-09-01', periodEnd: '2026-09-07', summary: 'Bản nháp tuần.', metrics: { weightDelta: -0.5 } });
  const reportId = created.body.data._id;
  const list = await request(app).get(`/api/progress-reports?customerId=${customerId}&status=DRAFT&page=1&limit=20`).set('Authorization', `Bearer ${ptToken}`);
  expect(list.status).toBe(200);
  expect(list.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ _id: reportId })]));
  expect((await request(app).get(`/api/progress-reports/${reportId}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(200);
  const updated = await request(app).patch(`/api/progress-reports/${reportId}`).set('Authorization', `Bearer ${ptToken}`).send({ summary: 'Đã cập nhật.' });
  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ summary: 'Đã cập nhật.', version: 2 });
  await request(app).patch(`/api/progress-reports/${reportId}/publish`).set('Authorization', `Bearer ${ptToken}`);
  const unpublished = await request(app).patch(`/api/progress-reports/${reportId}/unpublish`).set('Authorization', `Bearer ${ptToken}`);
  expect(unpublished.status).toBe(200);
  expect(unpublished.body.data.status).toBe('DRAFT');
  expect((await request(app).delete(`/api/progress-reports/${reportId}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(200);
});

it('PT xem chi tiết và xóa lịch nội bộ của mình', async () => {
  const created = await request(app).post('/api/calendar-events').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Lịch cần xóa', startsAt: '2026-09-05T01:00:00.000Z', endsAt: '2026-09-05T02:00:00.000Z' });
  const eventId = created.body.data._id;
  expect((await request(app).get(`/api/calendar-events/${eventId}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(200);
  expect((await request(app).delete(`/api/calendar-events/${eventId}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(200);
  expect((await request(app).get(`/api/calendar-events/${eventId}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(404);
});
