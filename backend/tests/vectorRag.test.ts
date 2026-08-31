import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { vi } from 'vitest';
vi.mock('../services/aiBillingService.js', () => ({ withAiBilling: vi.fn(async (_context: unknown, invoke: () => Promise<{ value: unknown }>) => (await invoke()).value) }));
import app from '../app.js';
import FeatureFlag from '../models/FeatureFlag.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import User, { type UserDocument } from '../models/User.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryReplSet; let adminToken: string; let ptToken: string;
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin-vector-rag', password, role: 'ADMIN' }); const pt = await User.create({ username: 'pt-vector-rag', password, role: 'PT' });
  await FeatureFlag.create({ key: 'KNOWLEDGE_BASE', enabled: true, roles: ['ADMIN', 'PT'] });
  adminToken = tokenFor(admin); ptToken = tokenFor(pt);
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('index lưu embedding và search xếp hạng chunk bằng cosine score', async () => {
  const first = await request(app).post('/api/knowledge').set('Authorization', `Bearer ${adminToken}`).send({ title: 'Hướng dẫn squat', topic: 'STRENGTH', content: 'Squat đúng kỹ thuật cần giữ lưng trung lập và kiểm soát đầu gối.' });
  const second = await request(app).post('/api/knowledge').set('Authorization', `Bearer ${adminToken}`).send({ title: 'Dinh dưỡng', topic: 'NUTRITION', content: 'Bổ sung protein và nước phù hợp sau buổi tập.' });
  await request(app).patch(`/api/knowledge/${first.body.data._id}/publish`).set('Authorization', `Bearer ${adminToken}`);
  await request(app).patch(`/api/knowledge/${second.body.data._id}/publish`).set('Authorization', `Bearer ${adminToken}`);

  const chunks = await KnowledgeChunk.find({ documentId: first.body.data._id }).lean();
  expect(chunks[0].embedding.length).toBeGreaterThan(0);
  const search = await request(app).get('/api/knowledge/search?q=ky+thuat+squat+lung').set('Authorization', `Bearer ${ptToken}`);
  expect(search.status).toBe(200);
  expect(search.body.data[0]).toMatchObject({ documentId: first.body.data._id, title: 'Hướng dẫn squat' });
  expect(search.body.data[0].score).toBeGreaterThan(0);
});
