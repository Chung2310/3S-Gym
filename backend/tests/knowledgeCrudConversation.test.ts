import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { vi } from 'vitest';
vi.mock('../services/aiProvider.js', () => ({ generateText: vi.fn().mockResolvedValue('Safe assistant suggestion.') }));
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import AuditLog from '../models/AuditLog.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let adminToken: string; let ptToken: string; let customerId: string;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin-kb-crud', password, role: 'ADMIN' }); const pt = await User.create({ username: 'pt-conversation', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Conversation Customer', phone: '0907000012', assignedPtId: pt.id });
  await FeatureFlag.create([{ key: 'KNOWLEDGE_BASE', enabled: true, roles: ['ADMIN', 'PT'] }, { key: 'PT_ASSISTANT', enabled: true, roles: ['PT'] }]);
  adminToken = tokenFor(admin); ptToken = tokenFor(pt); customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('supports knowledge CRUD, versioning, explicit indexing and unpublish', async () => {
  const created = await request(app).post('/api/knowledge').set('Authorization', `Bearer ${adminToken}`).send({ title: 'Mobility guide', topic: 'MOBILITY', content: 'Use controlled mobility for back discomfort.' });
  const id = created.body.data._id;
  const updated = await request(app).patch(`/api/knowledge/${id}`).set('Authorization', `Bearer ${adminToken}`).send({ content: 'Use controlled mobility and stop painful movement.' });
  expect(updated.status).toBe(200);
  expect(updated.body.data.version).toBe(2);
  const list = await request(app).get('/api/knowledge?page=1&limit=20&status=DRAFT').set('Authorization', `Bearer ${adminToken}`);
  expect(list.status).toBe(200);
  expect(list.body.data.some((item: { _id: string }) => item._id === id)).toBe(true);
  await request(app).patch(`/api/knowledge/${id}/publish`).set('Authorization', `Bearer ${adminToken}`);
  expect(await AuditLog.countDocuments({ action: 'KNOWLEDGE_PUBLISHED', resourceId: id })).toBe(1);
  const indexed = await request(app).post(`/api/knowledge/${id}/index`).set('Authorization', `Bearer ${adminToken}`);
  expect(indexed.status).toBe(200);
  expect(indexed.body.data.chunkCount).toBeGreaterThan(0);
  expect((await request(app).patch(`/api/knowledge/${id}/unpublish`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
  expect((await request(app).get('/api/knowledge/search?q=mobility').set('Authorization', `Bearer ${ptToken}`)).body.data).toHaveLength(0);
  expect((await request(app).delete(`/api/knowledge/${id}`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
});

it('stores PT Assistant conversation and message history', async () => {
  const created = await request(app).post('/api/assistant/conversations').set('Authorization', `Bearer ${ptToken}`).send({ customerId, title: 'Back discomfort follow-up' });
  expect(created.status).toBe(201);
  const id = created.body.data._id;
  const messaged = await request(app).post(`/api/assistant/conversations/${id}/messages`).set('Authorization', `Bearer ${ptToken}`).send({ content: 'Customer reports back discomfort during squat.', requestType: 'CONSULTATION' });
  expect(messaged.status).toBe(200);
  expect(messaged.body.data.messages).toHaveLength(2);
  expect(messaged.body.data.messages.map((message: { role: string }) => message.role)).toEqual(['USER', 'ASSISTANT']);
  const history = await request(app).get('/api/assistant/conversations?page=1&limit=20').set('Authorization', `Bearer ${ptToken}`);
  expect(history.status).toBe(200);
  expect(history.body.data[0]._id).toBe(id);
});
