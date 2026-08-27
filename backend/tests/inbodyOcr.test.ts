import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { vi } from 'vitest';

vi.mock('../services/ocrProvider.js', () => ({
  extractInBody: vi.fn().mockResolvedValue({
    weight: 62.5, bodyFatPercentage: 24.1, muscleMass: 23.4, bmr: 1320,
    confidence: 0.91, warnings: ['Kiểm tra lại ngày đo.'],
  }),
}));

import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import InBodyRecord from '../models/InBodyRecord.js';
import AuditLog from '../models/AuditLog.js';

let mongo: MongoMemoryServer;
let ptToken: string;
let customerId: string;

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const pt = await User.create({ username: 'pt-ocr', password, role: 'PT' });
  const customer = await CustomerProfile.create({ fullName: 'Khách OCR', phone: '0907000001', assignedPtId: pt.id });
  await FeatureFlag.create({ key: 'OCR_INBODY', enabled: true, roles: ['PT'] });
  ptToken = tokenFor(pt);
  customerId = customer.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('lưu kết quả OCR thành InBody nháp chờ PT kiểm tra', async () => {
  const response = await request(app)
    .post('/api/inbody/ocr')
    .set('Authorization', `Bearer ${ptToken}`)
    .field('customerId', customerId)
    .field('measurementDate', '2026-08-30')
    .attach('image', Buffer.from('fake-image'), { filename: 'inbody.png', contentType: 'image/png' });

  expect(response.status).toBe(201);
  expect(response.body.data).toMatchObject({
    customerId, source: 'AI_SCAN', status: 'DRAFT', ocrStatus: 'REVIEW_REQUIRED',
    weight: 62.5, confidence: 0.91,
  });
  expect(response.body.data.publishedAt).toBeNull();
});

it('chặn OCR khi feature flag tắt', async () => {
  await FeatureFlag.updateOne({ key: 'OCR_INBODY' }, { enabled: false });
  const response = await request(app)
    .post('/api/inbody/ocr')
    .set('Authorization', `Bearer ${ptToken}`)
    .field('customerId', customerId)
    .field('measurementDate', '2026-08-30')
    .attach('image', Buffer.from('fake-image'), { filename: 'inbody.png', contentType: 'image/png' });
  expect(response.status).toBe(403);
  expect(response.body.code).toBe('FEATURE_DISABLED');
});

it('PT confirms OCR data for an assigned customer and writes an audit log', async () => {
  await FeatureFlag.updateOne({ key: 'OCR_INBODY' }, { enabled: true });
  const draft = await InBodyRecord.create({
    customerId, ptId: new mongoose.Types.ObjectId(), measurementDate: new Date('2026-08-30'),
    weight: 62.5, source: 'AI_SCAN', status: 'DRAFT', ocrStatus: 'REVIEW_REQUIRED',
    sourceImage: { fileName: 'private.png', mimeType: 'image/png', data: Buffer.from('private-image') },
  });

  const response = await request(app)
    .patch(`/api/inbody/${draft.id}/confirm-ocr`)
    .set('Authorization', `Bearer ${ptToken}`)
    .send({ weight: 63, bodyFatPercentage: 23.8 });

  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ ocrStatus: 'CONFIRMED', weight: 63, bodyFatPercentage: 23.8 });
  expect(response.body.data.sourceImage).toBeUndefined();
  expect(await AuditLog.countDocuments({ action: 'INBODY_OCR_CONFIRMED', resourceId: draft.id })).toBe(1);
});
