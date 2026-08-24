const mongoose = require('mongoose');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

async function connectDatabase(uri) {
  if (!uri) throw new AppError({ status: 503, code: ERROR_CODES.UNAVAILABLE, message: 'Cơ sở dữ liệu chưa được cấu hình.' });
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(uri);
  return mongoose.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
