const jwt = require('jsonwebtoken');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return next(new AppError({ status: 401, code: ERROR_CODES.AUTHENTICATION, message: 'Bạn chưa đăng nhập.' }));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    return next();
  } catch (error) {
    return next(error);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền thực hiện thao tác này.' }));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
