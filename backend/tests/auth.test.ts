import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import Goal from '../models/Goal.js';
import CreditWallet from '../models/CreditWallet.js';
let mongo: MongoMemoryReplSet;
let adminToken: string;
let ptToken: string;
let ptId: string;
const testSecret = process.env.JWT_SECRET || 'secret_key';
const jwtOptions = { algorithm: 'HS256' as const, issuer: '3s-gym', audience: '3s-gym-api' };

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin', password, role: 'ADMIN' });
  const pt = await User.create({ username: 'pt', password, role: 'PT' });
  ptId = pt.id;
  adminToken = jwt.sign({ id: admin.id, role: admin.role }, testSecret, jwtOptions);
  ptToken = jwt.sign({ id: pt.id, role: pt.role }, testSecret, jwtOptions);
});

describe('PATCH /api/users/:id', () => {
  it('Admin sửa hồ sơ PT nhưng không thể đổi username hoặc role', async () => {
    const response = await request(app)
      .patch(`/api/users/${ptId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'pt-da-doi', role: 'ADMIN', fullName: 'PT Đã cập nhật', phone: '0901000002',
        email: 'pt.capnhat@example.com', gender: 'FEMALE', specialization: 'Tăng cơ',
        yearsOfExperience: 7, certificates: ['ACE'], status: 'LOCKED',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Cập nhật hồ sơ PT thành công.');
    expect(response.body.data).toMatchObject({
      username: 'pt', role: 'PT', fullName: 'PT Đã cập nhật', phone: '0901000002',
      specialization: 'Tăng cơ', yearsOfExperience: 7, certificates: ['ACE'], status: 'LOCKED',
    });
    expect(response.body.data).not.toHaveProperty('password');
    await User.updateOne({ _id: ptId }, { status: 'ACTIVE' });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('POST /api/users', () => {
  it('chỉ Admin tạo được tài khoản PT', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ptToken}`)
      .send({ username: 'pt-moi', password: 'MatKhau123!', role: 'PT' });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này.',
    });
  });

  it('Admin tạo được tài khoản PT và không trả mật khẩu', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'pt-moi', password: 'MatKhau123!', fullName: 'PT Mới', role: 'PT',
        avatarUrl: 'https://example.com/pt-moi.jpg', dateOfBirth: '1995-05-20', gender: 'MALE',
        phone: '0901000001', email: 'pt.moi@example.com', address: 'Quận 1, TP.HCM',
        specialization: 'Giảm mỡ', yearsOfExperience: 5,
        certificates: ['NASM-CPT', 'CPR'], bio: 'Huấn luyện viên cá nhân.', status: 'ACTIVE',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      username: 'pt-moi', fullName: 'PT Mới', role: 'PT', status: 'ACTIVE',
      avatarUrl: 'https://example.com/pt-moi.jpg', gender: 'MALE', phone: '0901000001',
      email: 'pt.moi@example.com', address: 'Quận 1, TP.HCM', specialization: 'Giảm mỡ',
      yearsOfExperience: 5, certificates: ['NASM-CPT', 'CPR'], bio: 'Huấn luyện viên cá nhân.',
    });
    expect(response.body.data).not.toHaveProperty('password');
    expect(await CreditWallet.findOne({ userId: response.body.data._id })).toMatchObject({ availableCredits: 0, reservedCredits: 0 });
  });

  it('validate dữ liệu trước khi tạo tài khoản', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'x', password: '123', role: 'SAI' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Dữ liệu gửi lên không hợp lệ.');
    expect(response.body.errors).toHaveLength(3);
  });
});

describe('POST /api/auth/login', () => {
  it('đăng nhập bằng tài khoản trong MongoDB và trả response chuẩn', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pt', password: 'MatKhau123!' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Đăng nhập thành công.');
    expect(response.body.data.user).toMatchObject({ username: 'pt', role: 'PT' });
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(jwt.verify(response.body.data.token, testSecret, {
      algorithms: ['HS256'], issuer: '3s-gym', audience: '3s-gym-api',
    })).toMatchObject({ id: ptId, role: 'PT' });
  });

  it('rejects an issued token after the account is locked', async () => {
    await User.updateOne({ _id: ptId }, { status: 'LOCKED' });
    const response = await request(app).get('/api/users').set('Authorization', `Bearer ${ptToken}`);
    await User.updateOne({ _id: ptId }, { status: 'ACTIVE' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Tài khoản đã bị khóa.');
  });

  it('từ chối tài khoản bị khóa', async () => {
    await User.updateOne({ username: 'pt' }, { status: 'LOCKED' });
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pt', password: 'MatKhau123!' });
    await User.updateOne({ username: 'pt' }, { status: 'ACTIVE' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Tài khoản đã bị khóa.');
  });
});

describe('GET /api/users', () => {
  it('Admin lấy danh sách người dùng có phân trang và bộ lọc', async () => {
    const response = await request(app)
      .get('/api/users?page=1&limit=10&role=PT&keyword=pt')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 10 });
    expect(response.body.data.every((user: { role: string }) => user.role === 'PT')).toBe(true);
    expect(response.body.data.every((user: object) => !Object.hasOwn(user, 'password'))).toBe(true);
  });
});

describe('DELETE /api/users/:id', () => {
  it('chặn xóa PT vẫn còn khách phụ trách', async () => {
    const pt = await User.findById(ptId);
    if (!pt) throw new Error('Expected PT fixture to exist');
    const customer = await CustomerProfile.create({ fullName: 'Khách còn phụ trách', phone: '0909999901', assignedPtId: pt.id });

    const response = await request(app).delete(`/api/users/${pt.id}`).set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Vui lòng chuyển hết khách sang PT khác trước khi xóa PT.');
    await CustomerProfile.deleteOne({ _id: customer.id });
  });

  it('chuyển quyền nội dung sang PT hiện tại rồi xóa PT cũ', async () => {
    const password = await bcrypt.hash('MatKhau123!', 10);
    const [oldPt, currentPt] = await User.create([
      { username: 'pt-cu-can-xoa', password, role: 'PT' },
      { username: 'pt-moi-quan-ly', password, role: 'PT' },
    ]);
    const customer = await CustomerProfile.create({ fullName: 'Khách đã chuyển', phone: '0909999902', assignedPtId: currentPt.id });
    const goal = await Goal.create({ customerId: customer.id, ptId: oldPt.id, type: 'FAT_LOSS', title: 'Giữ lịch sử', deadline: '2026-12-24' });

    const response = await request(app).delete(`/api/users/${oldPt.id}`).set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(await User.findById(oldPt.id)).toBeNull();
    expect((await Goal.findById(goal.id))!.ptId.toString()).toBe(currentPt.id);
  });
});
