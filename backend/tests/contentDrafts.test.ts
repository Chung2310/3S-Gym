import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import mongoose from 'mongoose'; import { MongoMemoryServer } from 'mongodb-memory-server'; import request from 'supertest'; import { vi } from 'vitest';
vi.mock('../services/aiProvider.js', () => ({ generateText: vi.fn().mockImplementation(async (prompt: string) => prompt.includes('dinh dưỡng') ? JSON.stringify({ title: 'Thực đơn AI', targetCalories: 1800, macros: { protein: 120, carbs: 190, fat: 62 }, menu: [] }) : JSON.stringify({ title: 'Giáo án AI', sessions: [{ name: 'Buổi 1', exercises: [] }] }) ) }));
import app from '../app.js'; import User, { type UserDocument } from '../models/User.js'; import CustomerProfile from '../models/CustomerProfile.js'; import FeatureFlag from '../models/FeatureFlag.js';
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key'); let mongo: MongoMemoryServer; let token: string; let customerId: string;
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); const password = await bcrypt.hash('MatKhau123!', 10); const pt = await User.create({ username: 'pt-ai-draft', password, role: 'PT' }); const customer = await CustomerProfile.create({ fullName: 'Khách Draft', phone: '0907000007', assignedPtId: pt.id }); await FeatureFlag.create({ key: 'NUTRITION_AI', enabled: true, roles: ['PT'] }); await FeatureFlag.create({ key: 'PT_ASSISTANT', enabled: true, roles: ['PT'] }); token = tokenFor(pt); customerId = customer.id; });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });
it.each([['nutrition', 'NUTRITION_AI'], ['workout', 'PT_ASSISTANT']])('AI tạo %s ở trạng thái nháp chờ PT duyệt', async (kind) => {
  const response = await request(app).post(`/api/content-drafts/${kind}`).set('Authorization', `Bearer ${token}`).send({ customerId, request: 'Tạo nội dung phù hợp mục tiêu giảm mỡ.' });
  expect(response.status).toBe(201);
  expect(response.body.data).toMatchObject({ status: 'DRAFT', createdByAi: true, reviewStatus: 'PT_REVIEW_REQUIRED', publishedAt: null });
});
