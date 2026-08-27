import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import CustomerProfile from '../models/CustomerProfile.js';
import type { UserDocument } from '../models/User.js';
import type { CustomerProfileDocument } from '../models/CustomerProfile.js';
import AuditLog from '../models/AuditLog.js';
import CareAlert from '../models/CareAlert.js';
import CareTask from '../models/CareTask.js';
let mongo: MongoMemoryServer;
let admin: UserDocument;
let ptA: UserDocument;
let ptB: UserDocument;
let customer: CustomerProfileDocument;
let adminToken: string;
let ptAToken: string;
let ptBToken: string;

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  [admin, ptA, ptB] = await User.create([
    { username: 'admin-transfer', password, role: 'ADMIN' },
    { username: 'pt-transfer-a', password, role: 'PT' },
    { username: 'pt-transfer-b', password, role: 'PT' },
  ]);
  [adminToken, ptAToken, ptBToken] = [admin, ptA, ptB].map(tokenFor);
  customer = await CustomerProfile.create({ fullName: 'Khách Chuyển Giao', phone: '0902000001', assignedPtId: ptA.id });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Chuyển khách giữa PT', () => {
  it('chỉ đổi PT phụ trách sau khi PT đích xác nhận', async () => {
    const created = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${ptAToken}`)
      .send({ customerId: customer.id, toPtId: ptB.id, reason: 'Điều chỉnh lịch làm việc' });

    expect(created.status).toBe(201);
    expect((await CustomerProfile.findById(customer.id))!.assignedPtId.toString()).toBe(ptA.id);
    const alert = await CareAlert.create({ customerId: customer.id, ptId: ptA.id, ruleKey: 'TRANSFER_TEST', title: 'Open alert', reason: 'Transfer ownership test', status: 'OPEN', dueAt: new Date() });
    const task = await CareTask.create({ customerId: customer.id, assignedPtId: ptA.id, title: 'Open task', dueAt: new Date(), status: 'OPEN' });

    const accepted = await request(app)
      .patch(`/api/transfers/${created.body.data._id}/accept`)
      .set('Authorization', `Bearer ${ptBToken}`)
      .send({});

    expect(accepted.status).toBe(200);
    expect(accepted.body.data.status).toBe('ACCEPTED');
    expect((await CustomerProfile.findById(customer.id))!.assignedPtId.toString()).toBe(ptB.id);
    expect(await AuditLog.countDocuments({ action: 'TRANSFER_ACCEPTED', resourceId: created.body.data._id })).toBe(1);
    expect(String((await CareAlert.findById(alert.id))!.ptId)).toBe(ptB.id);
    expect(String((await CareTask.findById(task.id))!.assignedPtId)).toBe(ptB.id);
  });

  it('Admin ép chuyển phải có lý do và lưu trạng thái', async () => {
    const invalid = await request(app)
      .patch(`/api/transfers/${new mongoose.Types.ObjectId()}/admin-force`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: customer.id, toPtId: ptA.id });
    expect(invalid.status).toBe(400);

    const forced = await request(app)
      .patch(`/api/transfers/${new mongoose.Types.ObjectId()}/admin-force`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: customer.id, toPtId: ptA.id, reason: 'PT nhận nghỉ việc' });

    expect(forced.status).toBe(200);
    expect(forced.body.data.status).toBe('ADMIN_FORCED');
    expect((await CustomerProfile.findById(customer.id))!.assignedPtId.toString()).toBe(ptA.id);
    expect(await AuditLog.countDocuments({ action: 'TRANSFER_ADMIN_FORCED', resourceId: forced.body.data._id })).toBe(1);
  });

  it('danh sách yêu cầu có phân trang', async () => {
    const response = await request(app)
      .get('/api/transfers?page=1&limit=10&status=ACCEPTED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 10 });

    const invalid = await request(app).get('/api/transfers?status=UNKNOWN').set('Authorization', `Bearer ${adminToken}`);
    expect(invalid.status).toBe(400);
  });

  it('PT gửi sửa và xóa yêu cầu đang chờ, đồng thời lưu snapshot tên PT', async () => {
    const ownedCustomer = await CustomerProfile.create({ fullName: 'Khách Pending', phone: '0902000091', assignedPtId: ptA.id });
    const created = await request(app).post('/api/transfers').set('Authorization', `Bearer ${ptAToken}`).send({
      customerId: ownedCustomer.id, toPtId: ptB.id, reason: 'Lý do ban đầu',
    });
    expect(created.body.data).toMatchObject({ fromPtName: ptA.fullName || ptA.username, toPtName: ptB.fullName || ptB.username });

    const updated = await request(app).patch(`/api/transfers/${created.body.data._id}`).set('Authorization', `Bearer ${ptAToken}`).send({
      toPtId: ptB.id, reason: 'Lý do đã sửa',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.reason).toBe('Lý do đã sửa');

    const removed = await request(app).delete(`/api/transfers/${created.body.data._id}`).set('Authorization', `Bearer ${ptAToken}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data).toBeNull();
  });

  it('PT nhận không được sửa hoặc xóa yêu cầu', async () => {
    const ownedCustomer = await CustomerProfile.create({ fullName: 'Khách Bảo Vệ', phone: '0902000092', assignedPtId: ptA.id });
    const created = await request(app).post('/api/transfers').set('Authorization', `Bearer ${ptAToken}`).send({
      customerId: ownedCustomer.id, toPtId: ptB.id, reason: 'Kiểm tra quyền',
    });
    const updated = await request(app).patch(`/api/transfers/${created.body.data._id}`).set('Authorization', `Bearer ${ptBToken}`).send({ toPtId: ptA.id, reason: 'Sai quyền' });
    const removed = await request(app).delete(`/api/transfers/${created.body.data._id}`).set('Authorization', `Bearer ${ptBToken}`);
    expect(updated.status).toBe(404);
    expect(removed.status).toBe(404);
  });
});
