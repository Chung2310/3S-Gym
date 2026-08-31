import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import FeatureFlag from '../models/FeatureFlag.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

let mongo: MongoMemoryServer;
let ptToken: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const pt = await User.create({ username: 'pt-route-validation', password: await bcrypt.hash('MatKhau123!', 4), role: 'PT' });
  ptToken = jwt.sign({ id: pt.id, role: 'PT' }, process.env.JWT_SECRET || 'secret_key');
  await FeatureFlag.create([
    { key: 'NUTRITION_AI', enabled: true, roles: ['PT'] },
    { key: 'OCR_INBODY', enabled: true, roles: ['PT'] },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
describe('Validation các route công cụ dùng chung', () => {
  it('từ chối dữ liệu tính dinh dưỡng vượt phạm vi', async () => {
    const response = await request(app).post('/api/nutrition/calculate').set('Authorization', `Bearer ${ptToken}`).send({ weight: 0, height: 300, age: 5, mealCount: 20, gender: 'unknown' });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, message: 'Dữ liệu gửi lên không hợp lệ.' });
    expect(response.body.errors.map((error: { field: string }) => error.field)).toEqual(expect.arrayContaining(['weight', 'height', 'age', 'mealCount', 'gender']));
  });

  it('từ chối query tạo ảnh món ăn không hợp lệ', async () => {
    const response = await request(app).get('/api/nutrition/meal-image?seed=-1').set('Authorization', `Bearer ${ptToken}`);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('seed');
  });

  it('từ chối dữ liệu quét InBody và upload thiếu ảnh', async () => {
    const scan = await request(app).post('/api/nutrition/scan-inbody').set('Authorization', `Bearer ${ptToken}`).send({ imageBase64: 'ngan' });
    const upload = await request(app).post('/api/upload/image').set('Authorization', `Bearer ${ptToken}`);
    expect(scan.status).toBe(400);
    expect(scan.body.errors[0].field).toBe('imageBase64');
    expect(upload.status).toBe(400);
    expect(upload.body.errors[0].field).toBe('image');
  });

  it('từ chối upload video khi thiếu file hoặc sai định dạng', async () => {
    const missing = await request(app).post('/api/upload/video').set('Authorization', `Bearer ${ptToken}`);
    expect(missing.status).toBe(400);
    expect(missing.body.errors[0].field).toBe('video');

    const invalid = await request(app).post('/api/upload/video').set('Authorization', `Bearer ${ptToken}`)
      .attach('video', Buffer.from('not-a-video'), { filename: 'guide.txt', contentType: 'text/plain' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.errors[0].field).toBe('video');
  });

  it('từ chối yêu cầu nạp credit thiếu nguồn tiền và amount sai bước', async () => {
    const missing = await request(app).post('/api/credits/topups').set('Authorization', `Bearer ${ptToken}`).send({ gateway: 'VNPAY' });
    const invalidStep = await request(app).post('/api/credits/topups').set('Authorization', `Bearer ${ptToken}`).send({ gateway: 'VNPAY', customAmountVnd: 10_500 });
    expect(missing.status).toBe(400);
    expect(invalidStep.status).toBe(400);
  });
});
