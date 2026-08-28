import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import PackageTemplate from '../models/PackageTemplate.js';

let mongo: MongoMemoryServer;
let adminToken: string;
let ptToken: string;

const tokenFor = (user: UserDocument): string =>
  jwt.sign(
    { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
    process.env.JWT_SECRET || 'secret_key'
  );

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin-pkg', password, role: 'ADMIN', status: 'ACTIVE' });
  const pt = await User.create({ username: 'pt-pkg', password, role: 'PT', status: 'ACTIVE' });
  adminToken = tokenFor(admin);
  ptToken = tokenFor(pt);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await PackageTemplate.deleteMany({});
});

describe('Package Templates API', () => {
  it('Admin tạo được gói tập mẫu mới và PT xem được danh sách', async () => {
    const resCreate = await request(app)
      .post('/api/package-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Gói 12 buổi (1 tháng)',
        totalSessions: 12,
        durationDays: 30,
        price: 3600000,
        description: 'Gói trải nghiệm 1-1',
        status: 'ACTIVE',
      });

    expect(resCreate.status).toBe(201);
    expect(resCreate.body.data).toMatchObject({
      name: 'Gói 12 buổi (1 tháng)',
      totalSessions: 12,
      durationDays: 30,
      price: 3600000,
    });

    // PT reads list
    const resPt = await request(app)
      .get('/api/package-templates')
      .set('Authorization', `Bearer ${ptToken}`);

    expect(resPt.status).toBe(200);
    expect(resPt.body.data).toHaveLength(1);
    expect(resPt.body.data[0].name).toBe('Gói 12 buổi (1 tháng)');
  });

  it('Chặn PT tạo hoặc sửa gói tập mẫu (403)', async () => {
    const resCreate = await request(app)
      .post('/api/package-templates')
      .set('Authorization', `Bearer ${ptToken}`)
      .send({
        name: 'Gói PT tự tạo trái phép',
        totalSessions: 10,
        durationDays: 30,
      });

    expect(resCreate.status).toBe(403);

    const template = await PackageTemplate.create({
      name: 'Gói chuẩn',
      totalSessions: 24,
      durationDays: 60,
    });

    const resPatch = await request(app)
      .patch(`/api/package-templates/${template.id}`)
      .set('Authorization', `Bearer ${ptToken}`)
      .send({ name: 'Đổi tên trái phép' });

    expect(resPatch.status).toBe(403);
  });

  it('Admin sửa và xóa gói tập mẫu thành công', async () => {
    const template = await PackageTemplate.create({
      name: 'Gói cũ',
      totalSessions: 20,
      durationDays: 60,
      price: 5000000,
    });

    const resUpdate = await request(app)
      .patch(`/api/package-templates/${template.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Gói cập nhật 24 buổi',
        totalSessions: 24,
        price: 6000000,
      });

    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.data.name).toBe('Gói cập nhật 24 buổi');
    expect(resUpdate.body.data.totalSessions).toBe(24);

    const resDelete = await request(app)
      .delete(`/api/package-templates/${template.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resDelete.status).toBe(200);
    expect(await PackageTemplate.findById(template.id)).toBeNull();
  });

  it('Từ chối dữ liệu không hợp lệ khi tạo gói mẫu', async () => {
    const resEmptyName = await request(app)
      .post('/api/package-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '', totalSessions: 12, durationDays: 30 });

    expect(resEmptyName.status).toBe(400);

    const resInvalidSessions = await request(app)
      .post('/api/package-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Gói 0 buổi', totalSessions: 0, durationDays: 30 });

    expect(resInvalidSessions.status).toBe(400);
  });
});
