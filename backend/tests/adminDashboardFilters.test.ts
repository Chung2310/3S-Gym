import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import CareAlert from '../models/CareAlert.js';
import CustomerProfile from '../models/CustomerProfile.js';
import FeatureFlag from '../models/FeatureFlag.js';
import PtPackage from '../models/PtPackage.js';
import User, { type UserDocument } from '../models/User.js';

const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
let mongo: MongoMemoryServer; let adminToken: string; let selectedPtId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const [admin, pt1, pt2] = await User.create([{ username: 'admin-dashboard-filter', password, role: 'ADMIN' }, { username: 'pt-dashboard-filter-1', password, role: 'PT' }, { username: 'pt-dashboard-filter-2', password, role: 'PT' }]);
  const [active, inactive, other] = await CustomerProfile.create([
    { fullName: 'Active Selected', phone: '0907333301', assignedPtId: pt1.id, status: 'ACTIVE' },
    { fullName: 'Inactive Selected', phone: '0907333302', assignedPtId: pt1.id, status: 'INACTIVE' },
    { fullName: 'Active Other', phone: '0907333303', assignedPtId: pt2.id, status: 'ACTIVE' },
  ]);
  await PtPackage.create([{ customerId: active.id, name: 'Active package', totalSessions: 10, remainingSessions: 10, startDate: '2026-08-01', endDate: '2026-10-01', status: 'ACTIVE' }, { customerId: other.id, name: 'Other package', totalSessions: 10, remainingSessions: 10, startDate: '2026-08-01', endDate: '2026-10-01', status: 'ACTIVE' }]);
  await CareAlert.create([{ customerId: active.id, ptId: pt1.id, ruleKey: 'FILTER_ALERT_1', title: 'Alert 1', reason: 'Test', dueAt: new Date(), status: 'OPEN' }, { customerId: other.id, ptId: pt2.id, ruleKey: 'FILTER_ALERT_2', title: 'Alert 2', reason: 'Test', dueAt: new Date(), status: 'OPEN' }]);
  await FeatureFlag.create({ key: 'DASHBOARD', enabled: true, roles: ['ADMIN'] });
  adminToken = tokenFor(admin); selectedPtId = pt1.id;
  void inactive;
});

afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('Admin lọc dashboard theo PT, trạng thái và khoảng ngày', async () => {
  const response = await request(app).get(`/api/dashboard/admin?ptId=${selectedPtId}&customerStatus=ACTIVE&fromDate=2026-01-01&toDate=2027-01-01`).set('Authorization', `Bearer ${adminToken}`);
  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ totalPts: 1, totalCustomers: 1, openAlerts: 1, activePackages: 1, filters: { ptId: selectedPtId, customerStatus: 'ACTIVE', fromDate: '2026-01-01', toDate: '2027-01-01' } });
  expect(response.body.data.sourcePaths).toEqual(expect.arrayContaining(['/api/customers', '/api/care/alerts']));
});

it('Admin nhận kết quả rỗng khi khoảng ngày không có khách mới', async () => {
  const response = await request(app).get(`/api/dashboard/admin?ptId=${selectedPtId}&fromDate=2030-01-01&toDate=2030-02-01`).set('Authorization', `Bearer ${adminToken}`);
  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({ totalCustomers: 0, openAlerts: 0, activePackages: 0 });
});
