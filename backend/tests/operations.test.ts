import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import mongoose from 'mongoose'; import { MongoMemoryServer } from 'mongodb-memory-server'; import request from 'supertest';
import app from '../app.js'; import User, { type UserDocument } from '../models/User.js'; import CustomerProfile from '../models/CustomerProfile.js'; import FeatureFlag from '../models/FeatureFlag.js';
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let adminToken: string; let ptToken: string; let customerToken: string; let customerId: string;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin-ops', password, role: 'ADMIN' }); const pt = await User.create({ username: 'pt-ops', password, role: 'PT' }); const customerUser = await User.create({ username: 'customer-ops', password, role: 'CUSTOMER' });
  const customer = await CustomerProfile.create({ userId: customerUser.id, fullName: 'Khách Ops', phone: '0907000006', assignedPtId: pt.id });
  await FeatureFlag.create({ key: 'PROGRESS', enabled: true, roles: ['PT'] }); await FeatureFlag.create({ key: 'DASHBOARD', enabled: true, roles: ['ADMIN', 'PT'] });
  adminToken = tokenFor(admin); ptToken = tokenFor(pt); customerToken = tokenFor(customerUser); customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('PT công bố progress report thì khách xem được và nhận notification', async () => {
  const created = await request(app).post('/api/progress-reports').set('Authorization', `Bearer ${ptToken}`).send({ customerId, periodStart: '2026-08-01', periodEnd: '2026-08-31', summary: 'Tiến độ tốt.', metrics: { weightDelta: -1.5 } });
  expect(created.status).toBe(201);
  expect((await request(app).get('/api/me/content').set('Authorization', `Bearer ${customerToken}`)).body.data.progressReports).toHaveLength(0);
  await request(app).patch(`/api/progress-reports/${created.body.data._id}/publish`).set('Authorization', `Bearer ${ptToken}`);
  expect((await request(app).get('/api/me/content').set('Authorization', `Bearer ${customerToken}`)).body.data.progressReports).toHaveLength(1);
  const notifications = await request(app).get('/api/notifications?page=1&limit=20').set('Authorization', `Bearer ${customerToken}`);
  expect(notifications.body.data[0].type).toBe('PROGRESS_REPORT_PUBLISHED');
  const read = await request(app).patch(`/api/notifications/${notifications.body.data[0]._id}/read`).set('Authorization', `Bearer ${customerToken}`);
  expect(read.status).toBe(200); expect(read.body.data.readAt).not.toBeNull();
});

it('PT quản lý lịch nội bộ và Admin xem dashboard tổng quan', async () => {
  const event = await request(app).post('/api/calendar-events').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Buổi tập sáng', startsAt: '2026-09-03T01:00:00.000Z', endsAt: '2026-09-03T02:00:00.000Z' });
  expect(event.status).toBe(201);
  const completed = await request(app).patch(`/api/calendar-events/${event.body.data._id}`).set('Authorization', `Bearer ${ptToken}`).send({ status: 'COMPLETED', notes: 'Khách hoàn thành.' });
  expect(completed.status).toBe(200); expect(completed.body.data.status).toBe('COMPLETED');
  const events = await request(app).get('/api/calendar-events?page=1&limit=20&fromDate=2026-09-03&toDate=2026-09-04').set('Authorization', `Bearer ${ptToken}`);
  expect(events.body.data).toHaveLength(1);
  const dashboard = await request(app).get('/api/dashboard/admin').set('Authorization', `Bearer ${adminToken}`);
  expect(dashboard.status).toBe(200);
  expect(dashboard.body.data).toMatchObject({ totalPts: 1, totalCustomers: 1 });
});
