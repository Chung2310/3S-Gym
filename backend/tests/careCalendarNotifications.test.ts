import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import Notification from '../models/Notification.js';
import User, { type UserDocument } from '../models/User.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let ptToken: string; let customerToken: string; let ptId: string; let customerId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'pt-notifications', password, role: 'PT' });
  const customerUser = await User.create({ username: 'customer-notifications', password, role: 'CUSTOMER' });
  const customer = await CustomerProfile.create({ userId: customerUser.id, fullName: 'Khách Notification', phone: '0907222299', assignedPtId: pt.id, status: 'ACTIVE' });
  await FeatureFlag.create({ key: 'CARE', enabled: true, roles: ['PT'] });
  ptToken = tokenFor(pt); customerToken = tokenFor(customerUser); ptId = pt.id; customerId = customer.id;
});

afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('tạo care task gửi đúng một notification cho PT phụ trách', async () => {
  const created = await request(app).post('/api/care/tasks').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Gọi khách tái tập', dueAt: '2026-09-05T08:00:00.000Z' });
  expect(created.status).toBe(201);
  const notifications = await request(app).get('/api/notifications?page=1&limit=20').set('Authorization', `Bearer ${ptToken}`);
  expect(notifications.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'CARE_TASK_CREATED', resourceId: created.body.data._id })]));
  expect(await Notification.countDocuments({ userId: ptId, type: 'CARE_TASK_CREATED', resourceId: created.body.data._id })).toBe(1);
});

it('tạo calendar event gửi đúng một notification cho tài khoản khách', async () => {
  const created = await request(app).post('/api/calendar-events').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Buổi tập chân', startsAt: '2026-09-06T01:00:00.000Z', endsAt: '2026-09-06T02:00:00.000Z' });
  expect(created.status).toBe(201);
  const notifications = await request(app).get('/api/notifications?page=1&limit=20').set('Authorization', `Bearer ${customerToken}`);
  expect(notifications.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'CALENDAR_EVENT_CREATED', resourceId: created.body.data._id })]));
  expect(await Notification.countDocuments({ type: 'CALENDAR_EVENT_CREATED', resourceId: created.body.data._id })).toBe(1);
});

it('recalculate care alert không gửi trùng notification khi chạy lại', async () => {
  await request(app).post('/api/care/recalculate').set('Authorization', `Bearer ${ptToken}`).send({ asOf: '2026-09-06T08:00:00.000Z' });
  const firstCount = await Notification.countDocuments({ userId: ptId, type: 'CARE_ALERT_CREATED' });
  expect(firstCount).toBeGreaterThan(0);
  await request(app).post('/api/care/recalculate').set('Authorization', `Bearer ${ptToken}`).send({ asOf: '2026-09-06T08:00:00.000Z' });
  expect(await Notification.countDocuments({ userId: ptId, type: 'CARE_ALERT_CREATED' })).toBe(firstCount);
});
