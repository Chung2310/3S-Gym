const { ERROR_CODES } = require('./errorCodes');

class AppError extends Error {
  constructor({ message, status = 500, code = ERROR_CODES.INTERNAL, errors, details, cause, isOperational = true }) {
    super(message, cause ? { cause } : undefined);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.details = details;
    this.isOperational = isOperational;
  }
}

module.exports = { AppError };
