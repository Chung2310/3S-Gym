import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import { ensureBootstrapAdmin } from '../services/userService.js';
describe('ensureBootstrapAdmin', () => {
  it('tạo đúng một Admin từ cấu hình môi trường', async () => {
    const mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await ensureBootstrapAdmin({ username: 'admin-3s', password: 'MatKhau123!', fullName: 'Quản lý 3S' });
    await ensureBootstrapAdmin({ username: 'admin-3s', password: 'MatKhau123!', fullName: 'Quản lý 3S' });
    expect(await User.countDocuments({ role: 'ADMIN' })).toBe(1);
    await mongoose.disconnect();
    await mongo.stop();
  });
});
