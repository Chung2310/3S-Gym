import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { NextFunction, Request, Response, RequestHandler } from 'express';
import type { AuthenticatedUser } from '../types/express.js';
import { getEnv } from '../config/env.js';
import User from '../models/User.js';
import { hasRequiredRole } from '../services/roles.js';

async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return next(new AppError({ status: 401, code: ERROR_CODES.AUTHENTICATION, message: 'Bạn chưa đăng nhập.' }));
  }

  try {
    const env = getEnv();
    const payload = jwt.verify(token, env.JWT_SECRET, env.NODE_ENV === 'test' ? undefined : {
      algorithms: [env.JWT_ALGORITHM], issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE,
    }) as AuthenticatedUser;
    const user = await User.findById(payload.id).select('username fullName role status').lean();
    if (!user) throw new AppError({ status: 401, code: ERROR_CODES.AUTHENTICATION, message: 'Tài khoản không còn tồn tại.' });
    if (user.status === 'LOCKED') throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Tài khoản đã bị khóa.' });
    req.user = { id: String(user._id), role: user.role, username: user.username, fullName: user.fullName };
    return next();
  } catch (error) {
    return next(error);
  }
}

function authorize(...roles: AuthenticatedUser['role'][]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !hasRequiredRole(req.user.role, roles)) {
      return next(new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền thực hiện thao tác này.' }));
    }
    return next();
  };
}

export { authenticate, authorize };
