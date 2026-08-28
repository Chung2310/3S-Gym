import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import CustomerProfile from '../models/CustomerProfile.js';
import User from '../models/User.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutTemplate from '../models/WorkoutTemplate.js';

it('assigns and replaces a customer workout plan on standalone MongoDB', async () => {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  try {
    const password = await bcrypt.hash('MatKhau123!', 10);
    const pt = await User.create({ username: 'pt-plan-standalone', password, role: 'PT' });
    const customer = await CustomerProfile.create({ fullName: 'Khách Standalone', phone: '0903999002', assignedPtId: pt.id });
    const firstTemplate = await WorkoutTemplate.create({ ownerPtId: pt.id, title: 'Mẫu đầu', goal: 'Tăng cơ', level: 'BEGINNER', sessions: [{ name: 'Ngày 1', exercises: [{ name: 'Squat' }] }] });
    const secondTemplate = await WorkoutTemplate.create({ ownerPtId: pt.id, title: 'Mẫu thay thế', goal: 'Sức mạnh', level: 'INTERMEDIATE', sessions: [{ name: 'Ngày 1', exercises: [{ name: 'Deadlift' }] }] });
    const token = jwt.sign({ id: pt.id, role: 'PT' }, process.env.JWT_SECRET || 'secret_key');
    const authorization = { Authorization: `Bearer ${token}` };

    const first = await request(app).post(`/api/customers/${customer.id}/workout-plans/assign`).set(authorization).send({ templateId: firstTemplate.id });
    expect(first.status).toBe(201);

    const second = await request(app).post(`/api/customers/${customer.id}/workout-plans/assign`).set(authorization).send({ templateId: secondTemplate.id });
    expect(second.status).toBe(201);
    expect(second.body.data.title).toBe('Mẫu thay thế');
    expect(await WorkoutPlan.countDocuments({ customerId: customer.id, lifecycleStatus: 'ACTIVE' })).toBe(1);
    expect(await WorkoutPlan.countDocuments({ customerId: customer.id, lifecycleStatus: 'ARCHIVED' })).toBe(1);
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
});
