import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { NextFunction, Request, Response, RequestHandler } from 'express';
import type { AuthenticatedUser } from '../types/express.js';

function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return next(new AppError({ status: 401, code: ERROR_CODES.AUTHENTICATION, message: 'Bạn chưa đăng nhập.' }));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as AuthenticatedUser;
    return next();
  } catch (error) {
    return next(error);
  }
}

function authorize(...roles: AuthenticatedUser['role'][]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền thực hiện thao tác này.' }));
    }
    return next();
  };
}

export { authenticate, authorize };