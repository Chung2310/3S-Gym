import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let ownerToken: string; let otherToken: string; let customerId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const owner = await User.create({ username: 'pt-nutrition-log-owner', password, role: 'PT' });
  const other = await User.create({ username: 'pt-nutrition-log-other', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Nutrition Log', phone: '0907000010', assignedPtId: owner.id });
  ownerToken = tokenFor(owner); otherToken = tokenFor(other); customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('records food and activity then summarizes calories for a date range', async () => {
  const food = await request(app).post('/api/nutrition/logs').set('Authorization', `Bearer ${ownerToken}`).send({
    customerId, loggedAt: '2026-09-03T08:00:00.000Z', type: 'FOOD', name: 'Breakfast', calories: 500,
    macros: { protein: 30, carbs: 60, fat: 15 },
  });
  expect(food.status).toBe(201);
  const activity = await request(app).post('/api/nutrition/logs').set('Authorization', `Bearer ${ownerToken}`).send({
    customerId, loggedAt: '2026-09-03T17:00:00.000Z', type: 'ACTIVITY', name: 'Running', calories: 300, durationMinutes: 30,
  });
  expect(activity.status).toBe(201);

  const list = await request(app).get(`/api/nutrition/logs?customerId=${customerId}&from=2026-09-03&to=2026-09-03&page=1&limit=20`).set('Authorization', `Bearer ${ownerToken}`);
  expect(list.status).toBe(200);
  expect(list.body.data).toHaveLength(2);
  expect(list.body.summary).toMatchObject({ consumedCalories: 500, burnedCalories: 300, netCalories: 200, protein: 30, carbs: 60, fat: 15 });
});

it('blocks a PT from reading or writing another PT customer nutrition log', async () => {
  const payload = { customerId, loggedAt: '2026-09-04', type: 'FOOD', name: 'Lunch', calories: 600 };
  expect((await request(app).post('/api/nutrition/logs').set('Authorization', `Bearer ${otherToken}`).send(payload)).status).toBe(403);
  expect((await request(app).get(`/api/nutrition/logs?customerId=${customerId}`).set('Authorization', `Bearer ${otherToken}`)).status).toBe(403);
});

it('allows the owner PT to correct and delete a nutrition log', async () => {
  const created = await request(app).post('/api/nutrition/logs').set('Authorization', `Bearer ${ownerToken}`).send({
    customerId, loggedAt: '2026-09-05', type: 'FOOD', name: 'Dinner', calories: 700,
  });
  const id = created.body.data._id;
  expect((await request(app).patch(`/api/nutrition/logs/${id}`).set('Authorization', `Bearer ${otherToken}`).send({ calories: 650 })).status).toBe(403);
  const updated = await request(app).patch(`/api/nutrition/logs/${id}`).set('Authorization', `Bearer ${ownerToken}`).send({ calories: 650, notes: 'Corrected portion' });
  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ calories: 650, notes: 'Corrected portion' });
  expect((await request(app).delete(`/api/nutrition/logs/${id}`).set('Authorization', `Bearer ${ownerToken}`)).status).toBe(200);
});
