import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';

let mongo: MongoMemoryServer;
let adminToken: string;
let ptToken: string;

const tokenFor = (user: UserDocument): string => jwt.sign(
  { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
  process.env.JWT_SECRET || 'secret_key',
);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin-feature', password, role: 'ADMIN' });
  const pt = await User.create({ username: 'pt-feature', password, role: 'PT' });
  adminToken = tokenFor(admin);
  ptToken = tokenFor(pt);
});

afterEach(async () => {
  await mongoose.connection.collection('featureflags').deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Feature flags beta', () => {
  it('Admin cấu hình flag và PT chỉ nhận flag được bật cho vai trò của mình', async () => {
    const updated = await request(app)
      .patch('/api/features/ROADMAP')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true, roles: ['PT'] });

    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ key: 'ROADMAP', enabled: true, roles: ['PT'] });

    const mine = await request(app)
      .get('/api/features/me')
      .set('Authorization', `Bearer ${ptToken}`);

    expect(mine.status).toBe(200);
    expect(mine.body.data).toMatchObject({ ROADMAP: true, PT_ASSISTANT: false });
  });

  it('không cho PT thay đổi feature flag', async () => {
    const response = await request(app)
      .patch('/api/features/ROADMAP')
      .set('Authorization', `Bearer ${ptToken}`)
      .send({ enabled: true, roles: ['PT'] });

    expect(response.status).toBe(403);
  });

  it('từ chối key và role không được hỗ trợ', async () => {
    const invalidKey = await request(app)
      .patch('/api/features/UNKNOWN')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true, roles: ['PT'] });
    expect(invalidKey.status).toBe(400);
    expect(invalidKey.body.errors[0].field).toBe('key');

    const invalidRole = await request(app)
      .patch('/api/features/ROADMAP')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true, roles: ['OWNER'] });
    expect(invalidRole.status).toBe(400);
    expect(invalidRole.body.errors[0].field).toBe('roles');
  });
});
