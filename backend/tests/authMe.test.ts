import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';

describe('Auth Me and Login Profile API', () => {
  let mongo: MongoMemoryReplSet;

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    await mongoose.connection.db?.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('login returns avatarUrl, email, phone and GET /api/auth/me returns current user profile', async () => {
    const hashedPassword = await bcrypt.hash('Secret123!', 10);
    const user = await User.create({
      username: 'pt_test_avatar',
      password: hashedPassword,
      fullName: 'HLV Nguyen Van A',
      email: 'pt.a@3sgym.vn',
      phone: '0912345678',
      avatarUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      role: 'PT',
      status: 'ACTIVE',
    });

    // 1. Test Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pt_test_avatar', password: 'Secret123!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toBeDefined();
    expect(loginRes.body.data.token).toBeDefined();
    expect(loginRes.body.data.user.avatarUrl).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    expect(loginRes.body.data.user.fullName).toBe('HLV Nguyen Van A');
    expect(loginRes.body.data.user.email).toBe('pt.a@3sgym.vn');
    expect(loginRes.body.data.user.phone).toBe('0912345678');

    const token = loginRes.body.data.token;

    // 2. Test GET /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe(String(user._id));
    expect(meRes.body.data.username).toBe('pt_test_avatar');
    expect(meRes.body.data.avatarUrl).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    expect(meRes.body.data.fullName).toBe('HLV Nguyen Van A');
    expect(meRes.body.data.email).toBe('pt.a@3sgym.vn');
    expect(meRes.body.data.phone).toBe('0912345678');
    expect(meRes.body.data.role).toBe('PT');
  });

  it('rejects GET /api/auth/me without authorization token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('allows PT to update self profile and rejects role/status change', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await User.create({
      username: 'pt_update_self',
      password: hashedPassword,
      fullName: 'HLV Cu',
      role: 'PT',
      status: 'ACTIVE',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pt_update_self', password: '123456' });
    const token = loginRes.body.data.token;

    // 1. Update basic info & PT fields
    const patchRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'HLV Tran Van B',
        phone: '0987654321',
        specialization: 'Kickfit & Phuc hoi',
        yearsOfExperience: 5,
        bio: 'HLV 5 nam kinh nghiem tai 3S Gym',
        avatarUrl: 'https://res.cloudinary.com/demo/image/upload/new_pt.jpg',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.fullName).toBe('HLV Tran Van B');
    expect(patchRes.body.data.phone).toBe('0987654321');
    expect(patchRes.body.data.specialization).toBe('Kickfit & Phuc hoi');
    expect(patchRes.body.data.yearsOfExperience).toBe(5);
    expect(patchRes.body.data.avatarUrl).toBe('https://res.cloudinary.com/demo/image/upload/new_pt.jpg');

    // 2. Reject role tampering
    const tamperRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'ADMIN' });
    expect(tamperRes.status).toBe(400);

    // 3. Reject wrong currentPassword when changing password
    const wrongPassRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', password: 'ValidNew@2026' });
    expect(wrongPassRes.status).toBe(400);

    // 4. Successfully change password with correct currentPassword (supports passwords longer than 6 characters)
    const longPassword = 'MyStrongPassword@2026';
    const changePassRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: '123456', password: longPassword });
    expect(changePassRes.status).toBe(200);

    // 5. Verify new long password can login
    const reLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pt_update_self', password: longPassword });
    expect(reLogin.status).toBe(200);
  });
});

