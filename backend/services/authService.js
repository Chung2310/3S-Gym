const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

async function login({ username, password }) {
  const user = await User.findOne({ username: username.trim() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError({ status: 401, code: ERROR_CODES.AUTHENTICATION, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  }
  if (user.status === 'LOCKED') {
    throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Tài khoản đã bị khóa.' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '1d' },
  );

  return {
    token,
    user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, status: user.status },
  };
}

module.exports = { login };
