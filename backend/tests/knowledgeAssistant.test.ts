import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { vi } from 'vitest';
vi.mock('../services/aiProvider.js', () => ({ generateText: vi.fn().mockResolvedValue('Đề xuất tư vấn an toàn dựa trên nguồn 3S.') }));
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import AuditLog from '../models/AuditLog.js';
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryReplSet; let adminToken: string; let ptToken: string; let customerId: string;
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin-kb', password, role: 'ADMIN' }); const pt = await User.create({ username: 'pt-assistant', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách AI', phone: '0907000005', assignedPtId: pt.id });
  await FeatureFlag.create({ key: 'KNOWLEDGE_BASE', enabled: true, roles: ['ADMIN', 'PT'] }); await FeatureFlag.create({ key: 'PT_ASSISTANT', enabled: true, roles: ['PT'] });
  adminToken = tokenFor(admin); ptToken = tokenFor(pt); customerId = customer.id;
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('RAG chỉ tìm thấy tài liệu Knowledge Base đã xuất bản', async () => {
  const created = await request(app).post('/api/knowledge').set('Authorization', `Bearer ${adminToken}`).send({ title: 'Quy trình đau lưng', topic: 'MOBILITY', content: 'Khi khách đau lưng, dừng bài gây đau và chuyển chuyên gia phù hợp.' });
  expect(created.status).toBe(201);
  const before = await request(app).get('/api/knowledge/search?q=đau+lưng').set('Authorization', `Bearer ${ptToken}`);
  expect(before.body.data).toHaveLength(0);
  await request(app).patch(`/api/knowledge/${created.body.data._id}/publish`).set('Authorization', `Bearer ${adminToken}`);
  const after = await request(app).get('/api/knowledge/search?q=đau+lưng').set('Authorization', `Bearer ${ptToken}`);
  expect(after.body.data).toHaveLength(1);
  expect(after.body.data[0].documentId).toBe(created.body.data._id);
});

it('PT Assistant tạo suggestion chờ duyệt, có citation và không tự áp dụng', async () => {
  const response = await request(app).post('/api/assistant/suggestions').set('Authorization', `Bearer ${ptToken}`).send({ customerId, scenario: 'Khách đau lưng khi squat', requestType: 'CONSULTATION' });
  expect(response.status).toBe(201);
  expect(response.body.data).toMatchObject({ reviewStatus: 'PT_REVIEW_REQUIRED', appliedAt: null });
  expect(response.body.data.citations.length).toBeGreaterThan(0);
  const approved = await request(app).patch(`/api/assistant/suggestions/${response.body.data._id}/approve`).set('Authorization', `Bearer ${ptToken}`).send({ editedContent: 'Nội dung PT đã kiểm tra.' });
  expect(approved.status).toBe(200);
  expect(approved.body.data.reviewStatus).toBe('APPROVED');
  expect(await AuditLog.countDocuments({ action: 'ASSISTANT_SUGGESTION_APPROVED', resourceId: response.body.data._id })).toBe(1);
});
