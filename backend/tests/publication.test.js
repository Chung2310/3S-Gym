const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const CustomerProfile = require('../models/CustomerProfile');

let mongo;
let pt;
let customer;
let ptToken;
let customerToken;

const tokenFor = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const customerUser = await User.create({ username: 'khach-content', password, role: 'CUSTOMER' });
  pt = await User.create({ username: 'pt-content', password, role: 'PT' });
  customer = await CustomerProfile.create({
    userId: customerUser.id,
    fullName: 'Khách Nội Dung',
    phone: '0903000001',
    assignedPtId: pt.id,
  });
  ptToken = tokenFor(pt);
  customerToken = tokenFor(customerUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Nội dung nháp và công bố', () => {
  it('khách không xem InBody nháp và xem được sau khi PT công bố', async () => {
    const created = await request(app)
      .post('/api/inbody')
      .set('Authorization', `Bearer ${ptToken}`)
      .send({ customerId: customer.id, measurementDate: '2026-08-24', weight: 62, bodyFatPercentage: 25, muscleMass: 22 });

    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('DRAFT');

    const before = await request(app).get('/api/me/content').set('Authorization', `Bearer ${customerToken}`);
    expect(before.body.data.inbody).toHaveLength(0);

    const published = await request(app)
      .patch(`/api/inbody/${created.body.data._id}/publish`)
      .set('Authorization', `Bearer ${ptToken}`)
      .send({});
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe('PUBLISHED');

    const after = await request(app).get('/api/me/content').set('Authorization', `Bearer ${customerToken}`);
    expect(after.body.data.inbody).toHaveLength(1);
    expect(after.body.data.inbody[0].weight).toBe(62);
  });

  it.each([
    ['goals', { customerId: null, type: 'FAT_LOSS', title: 'Giảm 5kg', deadline: '2026-11-24' }],
    ['workout-plans', { customerId: null, title: 'Giáo án nền tảng', sessions: [{ name: 'Buổi 1', exercises: [] }] }],
    ['nutrition-plans', { customerId: null, title: 'Thực đơn giảm mỡ', targetCalories: 1800, macros: { protein: 120, carbs: 190, fat: 62 } }],
  ])('PT tạo %s ở trạng thái nháp', async (resource, body) => {
    const response = await request(app)
      .post(`/api/${resource}`)
      .set('Authorization', `Bearer ${ptToken}`)
      .send({ ...body, customerId: customer.id });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('DRAFT');
  });

  it('danh sách InBody có phân trang, bộ lọc và validation', async () => {
    const response = await request(app)
      .get(`/api/inbody?page=1&limit=10&customerId=${customer.id}&status=PUBLISHED`)
      .set('Authorization', `Bearer ${ptToken}`);
    expect(response.status).toBe(200);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 10 });

    const invalid = await request(app)
      .get('/api/inbody?page=0')
      .set('Authorization', `Bearer ${ptToken}`);
    expect(invalid.status).toBe(400);

    const invalidStatus = await request(app).get('/api/inbody?status=UNKNOWN').set('Authorization', `Bearer ${ptToken}`);
    expect(invalidStatus.status).toBe(400);
    expect(invalidStatus.body.errors[0].field).toBe('status');
  });

  it('PT sửa nội dung đã công bố thì nội dung trở lại bản nháp và tăng phiên bản', async () => {
    const created = await request(app).post('/api/goals').set('Authorization', `Bearer ${ptToken}`).send({
      customerId: customer.id, type: 'FAT_LOSS', title: 'Giảm 5kg', deadline: '2026-11-24',
    });
    await request(app).patch(`/api/goals/${created.body.data._id}/publish`).set('Authorization', `Bearer ${ptToken}`);

    const updated = await request(app).patch(`/api/goals/${created.body.data._id}`).set('Authorization', `Bearer ${ptToken}`).send({
      customerId: customer.id, type: 'FAT_LOSS', title: 'Giảm 4kg', deadline: '2026-12-24',
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ title: 'Giảm 4kg', status: 'DRAFT', version: 2, publishedAt: null });
  });

  it('PT xóa cứng nội dung mình quản lý', async () => {
    const created = await request(app).post('/api/nutrition-plans').set('Authorization', `Bearer ${ptToken}`).send({
      customerId: customer.id, title: 'Thực đơn cần xóa', targetCalories: 1800,
      macros: { protein: 120, carbs: 190, fat: 62 },
    });

    const removed = await request(app).delete(`/api/nutrition-plans/${created.body.data._id}`).set('Authorization', `Bearer ${ptToken}`);

    expect(removed.status).toBe(200);
    expect(removed.body).toMatchObject({ success: true, data: null, message: 'Xóa thực đơn thành công.' });
  });

  it('từ chối sửa trường hệ thống của nội dung', async () => {
    const created = await request(app).post('/api/inbody').set('Authorization', `Bearer ${ptToken}`).send({
      customerId: customer.id, measurementDate: '2026-08-24', weight: 62,
    });
    const response = await request(app).patch(`/api/inbody/${created.body.data._id}`).set('Authorization', `Bearer ${ptToken}`).send({
      customerId: customer.id, measurementDate: '2026-08-24', weight: 61, status: 'PUBLISHED',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Dữ liệu gửi lên không hợp lệ.');
  });
});
