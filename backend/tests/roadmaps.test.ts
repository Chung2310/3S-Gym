import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';

let mongo: MongoMemoryServer;
let ownerToken: string;
let otherToken: string;
let customerId: string;
let ownerId: string;
let otherId: string;
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const owner = await User.create({ username: 'pt-roadmap-owner', password, role: 'PT' });
  const other = await User.create({ username: 'pt-roadmap-other', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách Roadmap', phone: '0907000002', assignedPtId: owner.id });
  await FeatureFlag.create({ key: 'ROADMAP', enabled: true, roles: ['PT'] });
  ownerToken = tokenFor(owner); otherToken = tokenFor(other); customerId = customer.id; ownerId = owner.id; otherId = other.id;
});

it('roadmap list follows current customer assignment after PT transfer', async () => {
  const created = await request(app).post('/api/roadmaps').set('Authorization', `Bearer ${ownerToken}`).send({
    customerId, title: 'Transferred roadmap', phases: [{ order: 1, name: 'Base', durationWeeks: 2, goals: [], weeks: [] }],
  });
  await CustomerProfile.updateOne({ _id: customerId, assignedPtId: ownerId }, { assignedPtId: otherId });
  try {
    const oldOwner = await request(app).get(`/api/roadmaps?customerId=${customerId}`).set('Authorization', `Bearer ${ownerToken}`);
    const newOwner = await request(app).get(`/api/roadmaps?customerId=${customerId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(oldOwner.body.data).toHaveLength(0);
    expect(newOwner.body.data.some((item: { _id: string }) => item._id === created.body.data._id)).toBe(true);
  } finally {
    await CustomerProfile.updateOne({ _id: customerId }, { assignedPtId: ownerId });
  }
});

afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('PT tạo roadmap nhiều phase và công bố cho khách', async () => {
  const response = await request(app).post('/api/roadmaps').set('Authorization', `Bearer ${ownerToken}`).send({
    customerId, title: 'Lộ trình 12 tuần', baseline: { weight: 70, bodyFatPercentage: 25 },
    phases: [
      { order: 1, name: 'Nền tảng', durationWeeks: 4, goals: ['Học kỹ thuật'], weeks: [{ week: 1, focus: 'Form' }] },
      { order: 2, name: 'Tăng tiến', durationWeeks: 8, goals: ['Tăng sức mạnh'], weeks: [{ week: 5, focus: 'Progressive overload' }] },
    ],
  });
  expect(response.status).toBe(201);
  expect(response.body.data).toMatchObject({ status: 'DRAFT', version: 1 });
  expect(response.body.data.phases).toHaveLength(2);

  const published = await request(app).patch(`/api/roadmaps/${response.body.data._id}/publish`).set('Authorization', `Bearer ${ownerToken}`);
  expect(published.status).toBe(200);
  expect(published.body.data.status).toBe('PUBLISHED');
});

it('chặn PT khác sửa roadmap và validate thứ tự phase trùng', async () => {
  const invalid = await request(app).post('/api/roadmaps').set('Authorization', `Bearer ${ownerToken}`).send({
    customerId, title: 'Sai phase', phases: [
      { order: 1, name: 'A', durationWeeks: 2, goals: [], weeks: [] },
      { order: 1, name: 'B', durationWeeks: 2, goals: [], weeks: [] },
    ],
  });
  expect(invalid.status).toBe(400);
  expect(invalid.body.errors.some((error: { field: string }) => error.field === 'phases')).toBe(true);

  const created = await request(app).post('/api/roadmaps').set('Authorization', `Bearer ${ownerToken}`).send({
    customerId, title: 'Roadmap riêng', phases: [{ order: 1, name: 'A', durationWeeks: 2, goals: [], weeks: [] }],
  });
  const forbidden = await request(app).patch(`/api/roadmaps/${created.body.data._id}`).set('Authorization', `Bearer ${otherToken}`).send({ title: 'Chiếm quyền' });
  expect(forbidden.status).toBe(403);
});

it('danh sách roadmap có pagination và filter', async () => {
  const response = await request(app).get(`/api/roadmaps?page=1&limit=10&customerId=${customerId}&status=DRAFT`).set('Authorization', `Bearer ${ownerToken}`);
  expect(response.status).toBe(200);
  expect(response.body.meta).toMatchObject({ page: 1, limit: 10 });
  expect(response.body.data.every((item: { customerId: string }) => item.customerId === customerId)).toBe(true);
});

it('owner can read and delete a draft roadmap while another PT cannot read it', async () => {
  const created = await request(app).post('/api/roadmaps').set('Authorization', `Bearer ${ownerToken}`).send({
    customerId, title: 'Temporary roadmap', phases: [{ order: 1, name: 'Base', durationWeeks: 2, goals: [], weeks: [] }],
  });
  const id = created.body.data._id;
  expect((await request(app).get(`/api/roadmaps/${id}`).set('Authorization', `Bearer ${otherToken}`)).status).toBe(403);
  const detail = await request(app).get(`/api/roadmaps/${id}`).set('Authorization', `Bearer ${ownerToken}`);
  expect(detail.status).toBe(200);
  expect(detail.body.data._id).toBe(id);
  expect((await request(app).delete(`/api/roadmaps/${id}`).set('Authorization', `Bearer ${ownerToken}`)).status).toBe(200);
  expect((await request(app).get(`/api/roadmaps/${id}`).set('Authorization', `Bearer ${ownerToken}`)).status).toBe(404);
});
