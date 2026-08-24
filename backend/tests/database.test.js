const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDatabase, disconnectDatabase } = require('../services/databaseService');

describe('databaseService', () => {
  it('kết nối và ngắt MongoDB theo URI cấu hình', async () => {
    const mongo = await MongoMemoryServer.create();
    await connectDatabase(mongo.getUri());
    expect(mongoose.connection.readyState).toBe(1);
    await disconnectDatabase();
    expect(mongoose.connection.readyState).toBe(0);
    await mongo.stop();
  });
});
