import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import PtPackage from '../models/PtPackage.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let token: string; let customerId: string; let ptId: string;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10); const pt = await User.create({ username: 'pt-care-today', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Today', phone: '0907000011', assignedPtId: pt.id, status: 'ACTIVE' });
  await FeatureFlag.create([{ key: 'CARE', enabled: true, roles: ['PT'] }, { key: 'DASHBOARD', enabled: true, roles: ['PT'] }]);
  token = tokenFor(pt); customerId = customer.id; ptId = pt.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('Today groups overdue tasks, tasks due today and open alerts', async () => {
  await PtPackage.create({ customerId, name: 'Expiring package', totalSessions: 20, usedSessions: 5, remainingSessions: 15, startDate: '2026-08-01', endDate: '2026-09-08', status: 'ACTIVE' });
  await request(app).post('/api/care/recalculate').set('Authorization', `Bearer ${token}`).send({ asOf: '2026-09-03T08:00:00.000Z' });
  await request(app).post('/api/care/tasks').set('Authorization', `Bearer ${token}`).send({ customerId, title: 'Overdue follow-up', dueAt: '2026-09-01T08:00:00.000Z' });
  await request(app).post('/api/care/tasks').set('Authorization', `Bearer ${token}`).send({ customerId, title: 'Today follow-up', dueAt: '2026-09-03T09:00:00.000Z' });
  const response = await request(app).get('/api/care/today?date=2026-09-03').set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(response.body.data.overdueTasks.some((task: { title: string }) => task.title === 'Overdue follow-up')).toBe(true);
  expect(response.body.data.dueTodayTasks.some((task: { title: string }) => task.title === 'Today follow-up')).toBe(true);
  expect(response.body.data.openAlerts.length).toBeGreaterThan(0);
  expect(response.body.data.openAlerts.filter((alert: { ruleKey: string }) => alert.ruleKey === 'PACKAGE_EXPIRES_7_DAYS')).toHaveLength(1);
});

it('dashboard returns an explainable score when progress data is sufficient', async () => {
  await BodyMeasurement.create([
    { customerId, ptId, measuredAt: '2026-08-01', weight: 70, bodyFatPercentage: 25, muscleMass: 28 },
    { customerId, ptId, measuredAt: '2026-09-01', weight: 68, bodyFatPercentage: 23, muscleMass: 29 },
  ]);
  const response = await request(app).get('/api/dashboard/pt').set('Authorization', `Bearer ${token}`);
  const summary = response.body.data.customers.find((item: { customerId: string }) => item.customerId === customerId);
  expect(summary).toMatchObject({ dataStatus: 'READY', sourcePath: `/api/progress/${customerId}` });
  expect(summary.score).toBeGreaterThanOrEqual(0);
  expect(summary.score).toBeLessThanOrEqual(100);
  expect(summary.scoreBreakdown).toMatchObject({ measurementTrend: expect.any(Number), careRisk: expect.any(Number) });
});
