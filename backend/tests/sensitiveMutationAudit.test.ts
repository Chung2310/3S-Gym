import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import AuditLog from '../models/AuditLog.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import User, { type UserDocument } from '../models/User.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let token: string; let customerId: string;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'pt-sensitive-audit', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Audit', phone: '0907444499', assignedPtId: pt.id, status: 'ACTIVE' });
  await FeatureFlag.create([{ key: 'CARE', enabled: true, roles: ['PT'] }, { key: 'PROGRESS', enabled: true, roles: ['PT'] }]);
  token = tokenFor(pt); customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('ghi audit đầy đủ cho vòng đời Care Task', async () => {
  const first = await request(app).post('/api/care/tasks').set('Authorization', `Bearer ${token}`).send({ customerId, title: 'Task hoàn tất', dueAt: '2026-09-07T08:00:00.000Z' });
  await request(app).patch(`/api/care/tasks/${first.body.data._id}`).set('Authorization', `Bearer ${token}`).send({ title: 'Task đã sửa' });
  await request(app).patch(`/api/care/tasks/${first.body.data._id}/complete`).set('Authorization', `Bearer ${token}`).send({ result: 'Đã gọi khách.' });
  const second = await request(app).post('/api/care/tasks').set('Authorization', `Bearer ${token}`).send({ customerId, title: 'Task xóa', dueAt: '2026-09-08T08:00:00.000Z' });
  await request(app).delete(`/api/care/tasks/${second.body.data._id}`).set('Authorization', `Bearer ${token}`);
  const actions = await AuditLog.distinct('action', { resourceType: 'careTask' });
  expect(actions).toEqual(expect.arrayContaining(['CARE_TASK_CREATED', 'CARE_TASK_UPDATED', 'CARE_TASK_COMPLETED', 'CARE_TASK_DELETED']));
});

it('ghi audit cho tạo, cập nhật và xóa Progress Report cùng Calendar', async () => {
  const report = await request(app).post('/api/progress-reports').set('Authorization', `Bearer ${token}`).send({ customerId, periodStart: '2026-09-01', periodEnd: '2026-09-07', summary: 'Audit report.' });
  await request(app).patch(`/api/progress-reports/${report.body.data._id}`).set('Authorization', `Bearer ${token}`).send({ summary: 'Audit report updated.' });
  await request(app).delete(`/api/progress-reports/${report.body.data._id}`).set('Authorization', `Bearer ${token}`);
  const event = await request(app).post('/api/calendar-events').set('Authorization', `Bearer ${token}`).send({ customerId, title: 'Audit event', startsAt: '2026-09-09T01:00:00.000Z', endsAt: '2026-09-09T02:00:00.000Z' });
  await request(app).patch(`/api/calendar-events/${event.body.data._id}`).set('Authorization', `Bearer ${token}`).send({ status: 'COMPLETED' });
  await request(app).delete(`/api/calendar-events/${event.body.data._id}`).set('Authorization', `Bearer ${token}`);
  const actions = await AuditLog.distinct('action');
  expect(actions).toEqual(expect.arrayContaining(['PROGRESS_REPORT_CREATED', 'PROGRESS_REPORT_UPDATED', 'PROGRESS_REPORT_DELETED', 'CALENDAR_EVENT_CREATED', 'CALENDAR_EVENT_UPDATED', 'CALENDAR_EVENT_DELETED']));
});
