const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const CustomerProfile = require('../models/CustomerProfile');
const PtPackage = require('../models/PtPackage');
const Goal = require('../models/Goal');

let mongo;
let ptA;
let ptB;
let ptAToken;
let adminToken;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const [admin, createdPtA, createdPtB] = await User.create([
    { username: 'admin-customers', password, role: 'ADMIN' },
    { username: 'pt-a', password, role: 'PT' },
    { username: 'pt-b', password, role: 'PT' },
  ]);
  ptA = createdPtA;
  ptB = createdPtB;
  adminToken = jwt.sign({ id: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET || 'secret_key');
  ptAToken = jwt.sign({ id: ptA.id, role: 'PT' }, process.env.JWT_SECRET || 'secret_key');
  await CustomerProfile.create([
    { fullName: 'Nguyễn Thị Lan', phone: '0901000001', assignedPtId: ptA.id, status: 'ACTIVE' },
    { fullName: 'Trần Văn Nam', phone: '0901000002', assignedPtId: ptB.id, status: 'ACTIVE' },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('CRM khách hàng', () => {
  it('PT chỉ nhận khách của mình cùng meta phân trang và bộ lọc', async () => {
    const response = await request(app)
      .get('/api/customers?page=1&limit=20&keyword=Lan&status=ACTIVE')
      .set('Authorization', `Bearer ${ptAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].assignedPtId).toBe(ptA.id);
  });

  it('route danh sách validate phân trang', async () => {
    const response = await request(app)
      .get('/api/customers?page=0&limit=200')
      .set('Authorization', `Bearer ${ptAToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Dữ liệu gửi lên không hợp lệ.');
  });

  it('PT không xem được hồ sơ do PT khác phụ trách', async () => {
    const foreignCustomer = await CustomerProfile.findOne({ assignedPtId: ptB.id });
    const response = await request(app)
      .get(`/api/customers/${foreignCustomer.id}`)
      .set('Authorization', `Bearer ${ptAToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Không tìm thấy khách hàng.');
  });

  it('PT tạo khách và hệ thống tự gán PT đang đăng nhập', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${ptAToken}`)
      .send({ fullName: 'Lê Minh Anh', phone: '0901000003', gender: 'FEMALE' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ fullName: 'Lê Minh Anh', assignedPtId: ptA.id, status: 'ACTIVE' });
  });

  it('Admin tạo khách và chọn PT phụ trách', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Khách của Admin', phone: '0901000004', assignedPtId: ptB.id });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ fullName: 'Khách của Admin', assignedPtId: ptB.id });
  });

  it('từ chối dữ liệu hồ sơ khách không hợp lệ bằng message tiếng Việt', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${ptAToken}`)
      .send({ fullName: 'A', phone: 'abc', email: 'sai-email', height: -1 });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Dữ liệu gửi lên không hợp lệ.',
    });
    expect(response.body.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['fullName', 'phone', 'email', 'height']),
    );
  });

  it('PT sửa đầy đủ hồ sơ khách mình phụ trách', async () => {
    const customer = await CustomerProfile.findOne({ assignedPtId: ptA.id });
    const response = await request(app)
      .patch(`/api/customers/${customer.id}`)
      .set('Authorization', `Bearer ${ptAToken}`)
      .send({
        fullName: 'Nguyễn Thị Lan mới',
        phone: '0901000099',
        email: 'lan.moi@example.com',
        dateOfBirth: '1995-04-20',
        gender: 'FEMALE',
        height: 162,
        initialWeight: 58.5,
        medicalNotes: 'Đau đầu gối nhẹ',
        initialGoal: 'Giảm 4 kg',
        internalNotes: 'Theo dõi mỗi tuần',
        status: 'ACTIVE',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      fullName: 'Nguyễn Thị Lan mới',
      height: 162,
      initialWeight: 58.5,
      initialGoal: 'Giảm 4 kg',
      status: 'ACTIVE',
    });
  });

  it('không cho sửa PT phụ trách hoặc user liên kết qua API hồ sơ', async () => {
    const customer = await CustomerProfile.findOne({ assignedPtId: ptA.id });
    const response = await request(app)
      .patch(`/api/customers/${customer.id}`)
      .set('Authorization', `Bearer ${ptAToken}`)
      .send({ assignedPtId: ptB.id, userId: ptB.id });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Dữ liệu gửi lên không hợp lệ.');
    expect(response.body.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['assignedPtId', 'userId']),
    );
  });

  it('PT tạo gói tập và nhận số buổi còn lại bằng tổng số buổi', async () => {
    const customer = await CustomerProfile.findOne({ assignedPtId: ptA.id });
    const response = await request(app)
      .post(`/api/customers/${customer.id}/packages`)
      .set('Authorization', `Bearer ${ptAToken}`)
      .send({ name: 'Gói 24 buổi', totalSessions: 24, startDate: '2026-08-24', endDate: '2026-11-24' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ name: 'Gói 24 buổi', totalSessions: 24, usedSessions: 0, remainingSessions: 24 });
  });

  it('PT sửa và xóa gói tập của khách mình phụ trách', async () => {
    const customer = await CustomerProfile.findOne({ assignedPtId: ptA.id });
    const created = await PtPackage.create({ customerId: customer.id, name: 'Gói cũ', totalSessions: 20, usedSessions: 5, remainingSessions: 15, startDate: '2026-08-24', endDate: '2026-11-24' });
    const updated = await request(app).patch(`/api/customers/${customer.id}/packages/${created.id}`).set('Authorization', `Bearer ${ptAToken}`).send({ name: 'Gói mới', totalSessions: 24, startDate: '2026-08-24', endDate: '2026-12-24', status: 'ACTIVE' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ name: 'Gói mới', remainingSessions: 19 });
    const removed = await request(app).delete(`/api/customers/${customer.id}/packages/${created.id}`).set('Authorization', `Bearer ${ptAToken}`);
    expect(removed.status).toBe(200);
    expect(await PtPackage.findById(created.id)).toBeNull();
  });

  it('PT xóa khách cùng dữ liệu và tài khoản liên quan', async () => {
    const password = await bcrypt.hash('MatKhau123!', 10);
    const account = await User.create({ username: 'khach-xoa', password, role: 'CUSTOMER' });
    const customer = await CustomerProfile.create({ userId: account.id, fullName: 'Khách cần xóa', phone: '0901000098', assignedPtId: ptA.id });
    await Goal.create({ customerId: customer.id, ptId: ptA.id, type: 'FAT_LOSS', title: 'Mục tiêu xóa', deadline: '2026-12-24' });
    const removed = await request(app).delete(`/api/customers/${customer.id}`).set('Authorization', `Bearer ${ptAToken}`);
    expect(removed.status).toBe(200);
    expect(await CustomerProfile.findById(customer.id)).toBeNull();
    expect(await User.findById(account.id)).toBeNull();
    expect(await Goal.countDocuments({ customerId: customer.id })).toBe(0);
  });

  it('PT cấp tài khoản CUSTOMER cho khách mình phụ trách', async () => {
    const customer = await CustomerProfile.findOne({ assignedPtId: ptA.id, userId: { $exists: false } });
    const response = await request(app)
      .post(`/api/customers/${customer.id}/account`)
      .set('Authorization', `Bearer ${ptAToken}`)
      .send({ username: 'khach-lan', password: 'MatKhau123!', email: 'lan@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe('CUSTOMER');
    expect((await CustomerProfile.findById(customer.id)).userId.toString()).toBe(response.body.data.user.id);
  });
});
