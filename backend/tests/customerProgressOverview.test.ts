import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import WorkoutSession from '../models/WorkoutSession.js';
import BodyMeasurement from '../models/BodyMeasurement.js';

const tokenFor = (user: UserDocument) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let ptToken: string; let foreignToken: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'pt-overview', password, role: 'PT' });
  const foreign = await User.create({ username: 'pt-overview-foreign', password, role: 'PT' });
  ptToken = tokenFor(pt); foreignToken = tokenFor(foreign);
  const customer = await CustomerProfile.create({ assignedPtId: pt.id, fullName: 'Khách của PT', phone: '0908000001' });
  await CustomerProfile.create({ assignedPtId: foreign.id, fullName: 'Khách PT khác', phone: '0908000002' });
  await WorkoutSession.create({ customerId: customer.id, ptId: pt.id, performedAt: '2026-08-10', attendance: 'PRESENT', idempotencyKey: 'overview-1', planSnapshot: { title: 'Strength' }, exerciseLogs: [{ name: 'Squat', sets: [{ reps: 10, weight: 50, rpe: 8, completed: true }] }] });
  await BodyMeasurement.create([{ customerId: customer.id, ptId: pt.id, measuredAt: '2026-08-01', weight: 70, bodyFatPercentage: 22 }, { customerId: customer.id, ptId: pt.id, measuredAt: '2026-08-20', weight: 68.5, bodyFatPercentage: 20.8 }]);
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('returns progress summaries only for customers assigned to the signed-in PT', async () => {
  const response = await request(app).get('/api/customers/progress-overview').set('Authorization', `Bearer ${ptToken}`);
  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1);
  expect(response.body.data[0]).toMatchObject({ customer: { fullName: 'Khách của PT' }, sessionCount: 1, analytics: { totalVolume: 500, averageRpe: 8, bodyDeltas: { weight: -1.5, bodyFatPercentage: -1.2 } } });
  const foreignResponse = await request(app).get('/api/customers/progress-overview').set('Authorization', `Bearer ${foreignToken}`);
  expect(foreignResponse.body.data.map((item: { customer: { fullName: string } }) => item.customer.fullName)).toEqual(['Khách PT khác']);
});
