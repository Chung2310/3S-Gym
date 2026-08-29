import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../services/aiProvider.js', () => ({
  generateText: vi.fn().mockImplementation(async (prompt: string) => {
    if (prompt.includes('Roadmap') || prompt.includes('Lộ trình')) {
      return JSON.stringify({
        title: 'Lộ trình AI 12 tuần',
        strategy: {
          targetSummary: 'Giảm 5kg mỡ',
          estimatedWeeks: 12,
          sessionsPerWeek: 4,
          trainingMethod: 'Hypertrophy & Overload',
          trainingSplit: 'Upper / Lower',
          cardioProtocol: 'Zone 2 30p',
          nutrition: {
            bmr: 1600,
            tdee: 2200,
            targetCalories: 1800,
            calorieDeficitOrSurplus: -400,
            proteinGrams: 140,
            carbsGrams: 180,
            fatGrams: 50,
            waterLiters: 2.8,
            advice: 'Uống đủ nước',
          },
          checkpoints: [{ week: 4, title: 'Check 1', description: 'Đo lại InBody' }],
        },
        phases: [
          {
            order: 1,
            name: 'Phase 1: Thích nghi',
            durationWeeks: 4,
            goals: ['Chuẩn hóa kỹ thuật'],
            weeks: [{ week: 1, focus: 'Tuần 1', sessionTargets: 4, sessions: [] }],
          },
        ],
      });
    }
    if (prompt.includes('dinh dưỡng')) {
      return JSON.stringify({
        title: 'Thực đơn AI',
        targetCalories: 1800,
        macros: { protein: 120, carbs: 190, fat: 62 },
        menu: [],
      });
    }
    return JSON.stringify({
      title: 'Giáo án AI',
      sessions: [{ name: 'Buổi 1', exercises: [] }],
    });
  }),
}));

import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';

const tokenFor = (user: UserDocument): string =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');

let mongo: MongoMemoryServer;
let token: string;
let customerId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'pt-ai-draft', password, role: 'PT' });
  const customer = await CustomerProfile.create({
    fullName: 'Khách Draft',
    phone: '0907000007',
    assignedPtId: pt.id,
  });
  await FeatureFlag.create({ key: 'NUTRITION_AI', enabled: true, roles: ['PT'] });
  await FeatureFlag.create({ key: 'PT_ASSISTANT', enabled: true, roles: ['PT'] });
  await FeatureFlag.create({ key: 'ROADMAP', enabled: true, roles: ['PT'] });
  token = tokenFor(pt);
  customerId = customer.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it.each([
  ['nutrition', 'NUTRITION_AI'],
  ['workout', 'PT_ASSISTANT'],
])('AI tạo %s ở trạng thái nháp chờ PT duyệt', async (kind) => {
  const response = await request(app)
    .post(`/api/content-drafts/${kind}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ customerId, request: 'Tạo nội dung phù hợp mục tiêu giảm mỡ.' });
  expect(response.status).toBe(201);
  expect(response.body.data).toMatchObject({
    status: 'DRAFT',
    createdByAi: true,
    reviewStatus: 'PT_REVIEW_REQUIRED',
    publishedAt: null,
  });
});

it('AI tạo roadmap trả về đầy đủ strategy và phases cho PT xem trước', async () => {
  const response = await request(app)
    .post('/api/content-drafts/roadmap')
    .set('Authorization', `Bearer ${token}`)
    .send({ customerId, request: 'Tạo lộ trình 12 tuần giảm 5kg mỡ 4 buổi/tuần.' });
  expect(response.status).toBe(201);
  expect(response.body.data).toMatchObject({
    title: 'Lộ trình AI 12 tuần',
    status: 'DRAFT',
    createdByAi: true,
    strategy: expect.objectContaining({
      estimatedWeeks: 12,
      sessionsPerWeek: 4,
    }),
    phases: expect.arrayContaining([
      expect.objectContaining({
        order: 1,
        name: 'Phase 1: Thích nghi',
      }),
    ]),
  });
});
