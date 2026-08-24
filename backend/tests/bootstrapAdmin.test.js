const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const { ensureBootstrapAdmin } = require('../services/userService');

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
