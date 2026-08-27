import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
async function login({ username, password }: { username: string; password: string }) {
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

export { login };
