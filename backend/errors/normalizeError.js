const { AppError } = require('./AppError');
const { ERROR_CODES } = require('./errorCodes');

const fieldLabels = { email: 'Email', phone: 'Số điện thoại', username: 'Tên đăng nhập' };

function normalizeError(error) {
  if (error instanceof AppError) return error;
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
    return new AppError({ status: 409, code: ERROR_CODES.DUPLICATE, message: `${fieldLabels[field] || 'Dữ liệu'} đã được sử dụng.`, details: { field }, cause: error });
  }
  if (error?.name === 'ValidationError') {
    const errors = Object.values(error.errors || {}).map((item) => ({ field: item.path, message: `Giá trị ${item.path} không hợp lệ.` }));
    return new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Dữ liệu gửi lên không hợp lệ.', errors, cause: error });
  }
  if (error?.name === 'CastError') return new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Dữ liệu gửi lên không hợp lệ.', errors: [{ field: error.path, message: 'Giá trị không hợp lệ.' }], cause: error });
  if (['TokenExpiredError', 'JsonWebTokenError'].includes(error?.name)) return new AppError({ status: 401, code: ERROR_CODES.AUTHENTICATION, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', cause: error });
  if (error?.type === 'entity.parse.failed') return new AppError({ status: 400, code: ERROR_CODES.INVALID_JSON, message: 'Dữ liệu JSON không hợp lệ.', cause: error });
  if (error?.type === 'entity.too.large' || error?.code === 'LIMIT_FILE_SIZE') return new AppError({ status: 413, code: ERROR_CODES.PAYLOAD_TOO_LARGE, message: 'Dữ liệu gửi lên vượt quá giới hạn cho phép.', cause: error });
  if (error?.status >= 400 && error?.status < 500) return new AppError({ status: error.status, code: error.code || ERROR_CODES.VALIDATION, message: error.message, errors: error.errors, cause: error });
  return new AppError({ status: 500, code: ERROR_CODES.INTERNAL, message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.', cause: error, isOperational: false });
}

module.exports = { normalizeError };
