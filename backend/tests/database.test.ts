import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  buildMongoConnectionOptions,
  connectDatabase,
  disconnectDatabase,
} from '../config/db.js';

describe('MongoDB configuration', () => {
  afterEach(async () => {
    await disconnectDatabase();
  });

  it('bỏ qua tùy chọn xác thực khi thông tin đăng nhập để trống', () => {
    expect(buildMongoConnectionOptions({
      MONGODB_URI: 'mongodb://localhost:27017/igen-erp',
      MONGODB_USER: '',
      MONGODB_PASSWORD: '',
      MONGODB_AUTH_SOURCE: 'admin',
    })).toEqual({ uri: 'mongodb://localhost:27017/igen-erp', options: {} });
  });

  it('sử dụng đầy đủ thông tin xác thực', () => {
    expect(buildMongoConnectionOptions({
      MONGODB_URI: 'mongodb://localhost:27017/igen-erp',
      MONGODB_USER: 'igen',
      MONGODB_PASSWORD: 'secret',
      MONGODB_AUTH_SOURCE: 'admin',
    })).toEqual({
      uri: 'mongodb://localhost:27017/igen-erp',
      options: { user: 'igen', pass: 'secret', authSource: 'admin' },
    });
  });

  it.each([
    { MONGODB_USER: 'igen', MONGODB_PASSWORD: '' },
    { MONGODB_USER: '', MONGODB_PASSWORD: 'secret' },
  ])('từ chối thông tin xác thực không đầy đủ', (credentials) => {
    expect(() => buildMongoConnectionOptions({
      MONGODB_URI: 'mongodb://localhost:27017/igen-erp',
      MONGODB_AUTH_SOURCE: 'admin',
      ...credentials,
    })).toThrow('MONGODB_USER và MONGODB_PASSWORD phải được cấu hình cùng nhau.');
  });

  it('kết nối và ngắt MongoDB theo URI cấu hình', async () => {
    const mongo = await MongoMemoryServer.create();
    await connectDatabase({ MONGODB_URI: mongo.getUri() });
    expect(mongoose.connection.readyState).toBe(1);
    await disconnectDatabase();
    expect(mongoose.connection.readyState).toBe(0);
    await mongo.stop();
  });
});
