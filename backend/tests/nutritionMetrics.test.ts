import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import mongoose from 'mongoose'; import { MongoMemoryServer } from 'mongodb-memory-server'; import request from 'supertest'; import app from '../app.js'; import User, { type UserDocument } from '../models/User.js';
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let adminToken: string; let ptToken: string;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); const password = await bcrypt.hash('MatKhau123!', 10); const admin = await User.create({ username: 'admin-nutrition-metric', password, role: 'ADMIN' }); const pt = await User.create({ username: 'pt-nutrition-metric', password, role: 'PT' }); adminToken = tokenFor(admin); ptToken = tokenFor(pt); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });
it('tính BMR/TDEE/macro có tên công thức và phiên bản', async () => {
  const response = await request(app).post('/api/nutrition/metrics').set('Authorization', `Bearer ${ptToken}`).send({ sex: 'FEMALE', weightKg: 62, heightCm: 165, age: 32, activityFactor: 1.55, goal: 'FAT_LOSS' });
  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ formula: 'MIFFLIN_ST_JEOR', formulaVersion: 1 });
  expect(response.body.data.bmr).toBeGreaterThan(0); expect(response.body.data.targetCalories).toBeGreaterThan(0);
});
it('Admin quản lý activity và PT ước tính calories tiêu hao', async () => {
  const created = await request(app).post('/api/activities').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Chạy bộ', met: 8.3, category: 'CARDIO' });
  expect(created.status).toBe(201);
  const burned = await request(app).post(`/api/activities/${created.body.data._id}/estimate`).set('Authorization', `Bearer ${ptToken}`).send({ weightKg: 70, durationMinutes: 60 });
  expect(burned.status).toBe(200); expect(burned.body.data.calories).toBeGreaterThan(500);
});

it('Admin lists and updates activities while PT only reads active activities', async () => {
  const created = await request(app).post('/api/activities').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Cycling', met: 7.5, category: 'CARDIO' });
  const updated = await request(app).patch(`/api/activities/${created.body.data._id}`).set('Authorization', `Bearer ${adminToken}`).send({ met: 8, active: false });
  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ met: 8, active: false });
  expect((await request(app).patch(`/api/activities/${created.body.data._id}`).set('Authorization', `Bearer ${ptToken}`).send({ met: 9 })).status).toBe(403);
  const visible = await request(app).get('/api/activities?page=1&limit=20').set('Authorization', `Bearer ${ptToken}`);
  expect(visible.status).toBe(200);
  expect(visible.body.data.some((item: { _id: string }) => item._id === created.body.data._id)).toBe(false);
});

it('Admin creates a formula version and calculations use the active version', async () => {
  const formula = await request(app).post('/api/nutrition/formulas').set('Authorization', `Bearer ${adminToken}`).send({
    name: 'MIFFLIN_ST_JEOR', fatLossFactor: 0.8, muscleGainFactor: 1.12, proteinPerKg: 2.2, fatPerKg: 0.9,
  });
  expect(formula.status).toBe(201);
  expect(formula.body.data).toMatchObject({ version: 1, active: true });
  const metrics = await request(app).post('/api/nutrition/metrics').set('Authorization', `Bearer ${ptToken}`).send({ sex: 'MALE', weightKg: 80, heightCm: 180, age: 30, activityFactor: 1.5, goal: 'FAT_LOSS' });
  expect(metrics.body.data).toMatchObject({ formula: 'MIFFLIN_ST_JEOR', formulaVersion: 1 });
  expect(metrics.body.data.macros.protein).toBe(176);
});
