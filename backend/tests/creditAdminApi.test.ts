import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../app.js';
import AiBillingPolicy from '../models/AiBillingPolicy.js';
import AuditLog from '../models/AuditLog.js';
import CreditPricing from '../models/CreditPricing.js';
import CreditWallet from '../models/CreditWallet.js';
import User from '../models/User.js';
import { AI_TASK_TYPES } from '../services/creditTypes.js';

let mongo: MongoMemoryReplSet; let adminToken: string; let ptToken: string; let customerId: string;
beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase(); const password = await bcrypt.hash('MatKhau123!', 4);
  const admin = await User.create({ username: 'credit-admin', password, role: 'ADMIN' });
  const pt = await User.create({ username: 'credit-admin-pt', password, role: 'PT' });
  const customer = await User.create({ username: 'credit-admin-customer', password, role: 'CUSTOMER' }); customerId = customer.id;
  adminToken = jwt.sign({ id: admin.id, role: admin.role }, 'secret_key'); ptToken = jwt.sign({ id: pt.id, role: pt.role }, 'secret_key');
  await CreditPricing.create({ key: 'GLOBAL', vndPerCredit: 1_000, usdToVnd: 26_000 });
  await AiBillingPolicy.create(AI_TASK_TYPES.map((taskType) => ({ taskType, enabled: true, maxReservationCredits: 20, fallbackCredits: 1, markupBasisPoints: 12_500, minBillableCredits: 1 })));
  await CreditWallet.create({ userId: customer.id, availableCredits: 5, reservedCredits: 0, version: 0 });
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

const auth = (token = adminToken) => ({ Authorization: `Bearer ${token}` });
const policies = () => AI_TASK_TYPES.map((taskType) => ({ taskType, enabled: true, maxReservationCredits: taskType === 'IMAGE_GENERATION' ? 50 : 20, fallbackCredits: 1, markupBasisPoints: 13_000, minBillableCredits: 1 }));

describe('admin credit API', () => {
  it('rejects non-admin users from all administration endpoints', async () => {
    expect((await request(app).get('/api/admin/credit-pricing').set(auth(ptToken))).status).toBe(403);
    expect((await request(app).get('/api/admin/payment-orders').set(auth(ptToken))).status).toBe(403);
  });

  it('reads and atomically updates global pricing and every task policy with one audit', async () => {
    const current = await request(app).get('/api/admin/credit-pricing').set(auth());
    expect(current.body.data.policies).toHaveLength(AI_TASK_TYPES.length);
    const updated = await request(app).patch('/api/admin/credit-pricing').set(auth()).send({ vndPerCredit: 2_000, usdToVnd: 27_000, policies: policies() });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ vndPerCredit: 2_000, usdToVnd: 27_000 });
    expect(await AuditLog.countDocuments({ action: 'CREDIT_PRICING_UPDATED' })).toBe(1);
  });

  it('creates, updates, lists, and deletes packages while computing base credits server-side', async () => {
    const created = await request(app).post('/api/admin/credit-packages').set(auth()).send({ name: 'Gói 100', description: 'Bonus', amountVnd: 100_000, bonusCredits: 10, active: true, sortOrder: 1 });
    expect(created.status).toBe(201); expect(created.body.data).toMatchObject({ baseCredits: 100, bonusCredits: 10 });
    const id = created.body.data.id;
    expect((await request(app).patch(`/api/admin/credit-packages/${id}`).set(auth()).send({ amountVnd: 120_000, bonusCredits: 12 })).body.data).toMatchObject({ baseCredits: 120 });
    expect((await request(app).get('/api/admin/credit-packages').set(auth())).body.data).toHaveLength(1);
    expect((await request(app).delete(`/api/admin/credit-packages/${id}`).set(auth())).status).toBe(200);
    expect(await AuditLog.countDocuments({ resourceType: 'creditPackage' })).toBe(3);
  });

  it('validates package math and manual adjustments without allowing a negative wallet', async () => {
    expect((await request(app).post('/api/admin/credit-packages').set(auth()).send({ name: 'Bad', amountVnd: 10_500, bonusCredits: 0 })).status).toBe(400);
    expect((await request(app).post('/api/admin/credit-adjustments').set(auth()).send({ userId: customerId, credits: 0, reason: 'No-op' })).status).toBe(400);
    expect((await request(app).post('/api/admin/credit-adjustments').set(auth()).send({ userId: customerId, credits: -6, reason: 'Correction' })).status).toBe(402);
    const adjusted = await request(app).post('/api/admin/credit-adjustments').set(auth()).send({ userId: customerId, credits: 7, reason: 'Support grant' });
    expect(adjusted.status).toBe(201); expect(adjusted.body.data).toMatchObject({ availableCredits: 12 });
    expect(await AuditLog.countDocuments({ action: 'CREDIT_ADJUSTED' })).toBe(1);
  });

  it('exposes paginated reconciliation collections', async () => {
    for (const path of ['payment-orders', 'ai-usage', 'credit-ledger', 'credit-shortfalls']) {
      const response = await request(app).get(`/api/admin/${path}?page=1&limit=10`).set(auth());
      expect(response.status).toBe(200); expect(response.body.data).toEqual([]); expect(response.body.meta).toMatchObject({ page: 1, limit: 10, total: 0 });
    }
  });
});
