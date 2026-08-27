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

let mongo: MongoMemoryServer; let ptToken: string; let customerId: string;
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10); const pt = await User.create({ username: 'pt-care', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách cần care', phone: '0907000004', assignedPtId: pt.id, status: 'ACTIVE' });
  await PtPackage.create({ customerId: customer.id, name: 'Sắp hết', totalSessions: 20, usedSessions: 16, remainingSessions: 4, startDate: '2026-01-01', endDate: '2026-12-01', status: 'ACTIVE' });
  await FeatureFlag.create({ key: 'CARE', enabled: true, roles: ['PT'] });
  await FeatureFlag.create({ key: 'DASHBOARD', enabled: true, roles: ['PT'] });
  ptToken = tokenFor(pt); customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('tính cảnh báo lặp an toàn và cho PT xử lý có kết quả', async () => {
  const first = await request(app).post('/api/care/recalculate').set('Authorization', `Bearer ${ptToken}`).send({ asOf: '2026-09-02T08:00:00.000Z' });
  expect(first.status).toBe(200);
  const second = await request(app).post('/api/care/recalculate').set('Authorization', `Bearer ${ptToken}`).send({ asOf: '2026-09-02T08:00:00.000Z' });
  expect(second.status).toBe(200);

  const list = await request(app).get(`/api/care/alerts?page=1&limit=20&customerId=${customerId}&status=OPEN`).set('Authorization', `Bearer ${ptToken}`);
  expect(list.status).toBe(200);
  expect(list.body.data.filter((item: { ruleKey: string }) => item.ruleKey === 'LOW_PACKAGE_SESSIONS')).toHaveLength(1);

  const alertId = list.body.data[0]._id;
  const resolved = await request(app).patch(`/api/care/alerts/${alertId}/resolve`).set('Authorization', `Bearer ${ptToken}`).send({ result: 'Đã liên hệ khách.' });
  expect(resolved.status).toBe(200);
  expect(resolved.body.data).toMatchObject({ status: 'RESOLVED', result: 'Đã liên hệ khách.' });
});

it('dashboard PT có nguồn dữ liệu và không xếp hạng khách thiếu dữ liệu', async () => {
  const response = await request(app).get('/api/dashboard/pt').set('Authorization', `Bearer ${ptToken}`);
  expect(response.status).toBe(200);
  expect(response.body.data.totalCustomers).toBe(1);
  expect(response.body.data.customers[0]).toMatchObject({ customerId, dataStatus: 'INSUFFICIENT_DATA', rank: null, sourcePath: `/api/progress/${customerId}` });
});

it('PT tạo và hoàn tất nhiệm vụ chăm sóc', async () => {
  const created = await request(app).post('/api/care/tasks').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Gọi hỏi thăm', dueAt: '2026-09-03T08:00:00.000Z' });
  expect(created.status).toBe(201);
  const done = await request(app).patch(`/api/care/tasks/${created.body.data._id}/complete`).set('Authorization', `Bearer ${ptToken}`).send({ result: 'Khách xác nhận tập lại.' });
  expect(done.status).toBe(200);
  expect(done.body.data).toMatchObject({ status: 'DONE', result: 'Khách xác nhận tập lại.' });
});
