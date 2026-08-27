import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
let mongo: MongoMemoryServer;

const login = async (username: string, password: string): Promise<string> => {
  const response = await request(app).post('/api/auth/login').send({ username, password });
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({ success: true, message: 'Đăng nhập thành công.' });
  return response.body.data.token;
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.create({
    username: 'admin-e2e',
    password: await bcrypt.hash('MatKhau123!', 10),
    fullName: 'Quản trị viên',
    role: 'ADMIN',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Luồng tích hợp Đợt 1', () => {
  it('Admin tạo PT, PT tạo khách, cấp tài khoản, công bố InBody và khách xem được', async () => {
    const adminToken = await login('admin-e2e', 'MatKhau123!');
    const createdPt = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'pt-e2e', password: 'MatKhau123!', fullName: 'PT Đợt 1', phone: '0908000001', role: 'PT' });
    expect(createdPt.status).toBe(201);

    const ptToken = await login('pt-e2e', 'MatKhau123!');
    const createdCustomer = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${ptToken}`)
      .send({ fullName: 'Khách Đợt 1', phone: '0909000001', email: 'khach.dot1@example.com', gender: 'OTHER' });
    expect(createdCustomer.status).toBe(201);
    const customerId = createdCustomer.body.data._id;

    const createdAccount = await request(app)
      .post(`/api/customers/${customerId}/account`)
      .set('Authorization', `Bearer ${ptToken}`)
      .send({ username: 'khach-e2e', password: 'MatKhau123!', email: 'khach.dot1@example.com' });
    expect(createdAccount.status).toBe(201);
    expect(createdAccount.body.data).not.toHaveProperty('password');

    const inbody = await request(app)
      .post('/api/inbody')
      .set('Authorization', `Bearer ${ptToken}`)
      .send({ customerId, measurementDate: '2026-08-24', weight: 61.5, bodyFatPercentage: 24, muscleMass: 23 });
    expect(inbody.body.data.status).toBe('DRAFT');

    const customerToken = await login('khach-e2e', 'MatKhau123!');
    const beforePublish = await request(app).get('/api/me/content').set('Authorization', `Bearer ${customerToken}`);
    expect(beforePublish.body.data.inbody).toHaveLength(0);

    await request(app)
      .patch(`/api/inbody/${inbody.body.data._id}/publish`)
      .set('Authorization', `Bearer ${ptToken}`)
      .send({})
      .expect(200);

    const afterPublish = await request(app).get('/api/me/content').set('Authorization', `Bearer ${customerToken}`);
    expect(afterPublish.body).toMatchObject({ success: true, message: 'Lấy nội dung của khách hàng thành công.' });
    expect(afterPublish.body.data.inbody).toHaveLength(1);
    expect(afterPublish.body.data.inbody[0].weight).toBe(61.5);
  });
});
