const mongoose = require('mongoose');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

function validate(schema) {
  return (req, res, next) => {
    const errors = schema(req);
    if (errors.length > 0) {
      return next(new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Dữ liệu gửi lên không hợp lệ.', errors }));
    }
    return next();
  };
}

function createUserValidator(req) {
  const { username, password, role } = req.body;
  const errors = [];
  if (typeof username !== 'string' || username.trim().length < 3) errors.push({ field: 'username', message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
  if (typeof password !== 'string' || password.length < 8) errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 8 ký tự.' });
  if (!['ADMIN', 'PT', 'CUSTOMER'].includes(role)) errors.push({ field: 'role', message: 'Vai trò không hợp lệ.' });
  if (role === 'PT' && (typeof req.body.fullName !== 'string' || !req.body.fullName.trim())) errors.push({ field: 'fullName', message: 'Vui lòng nhập họ tên PT.' });
  if (role === 'PT' && (typeof req.body.phone !== 'string' || !req.body.phone.trim())) errors.push({ field: 'phone', message: 'Vui lòng nhập số điện thoại PT.' });
  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) errors.push({ field: 'email', message: 'Email không hợp lệ.' });
  if (req.body.avatarUrl) { try { new URL(req.body.avatarUrl); } catch { errors.push({ field: 'avatarUrl', message: 'URL ảnh đại diện không hợp lệ.' }); } }
  if (req.body.dateOfBirth && new Date(req.body.dateOfBirth) > new Date()) errors.push({ field: 'dateOfBirth', message: 'Ngày sinh không được ở tương lai.' });
  if (req.body.gender && !['MALE', 'FEMALE', 'OTHER'].includes(req.body.gender)) errors.push({ field: 'gender', message: 'Giới tính không hợp lệ.' });
  if (req.body.yearsOfExperience !== undefined && (!Number.isInteger(Number(req.body.yearsOfExperience)) || Number(req.body.yearsOfExperience) < 0 || Number(req.body.yearsOfExperience) > 80)) errors.push({ field: 'yearsOfExperience', message: 'Số năm kinh nghiệm phải là số nguyên từ 0 đến 80.' });
  if (req.body.certificates !== undefined && !Array.isArray(req.body.certificates)) errors.push({ field: 'certificates', message: 'Danh sách chứng chỉ không hợp lệ.' });
  if (typeof req.body.bio === 'string' && req.body.bio.length > 1000) errors.push({ field: 'bio', message: 'Giới thiệu không được vượt quá 1.000 ký tự.' });
  return errors;
}

function loginValidator(req) {
  const errors = [];
  if (typeof req.body.username !== 'string' || !req.body.username.trim()) errors.push({ field: 'username', message: 'Vui lòng nhập tên đăng nhập.' });
  if (typeof req.body.password !== 'string' || !req.body.password) errors.push({ field: 'password', message: 'Vui lòng nhập mật khẩu.' });
  return errors;
}

function updateUserValidator(req) {
  const errors = [];
  if (!mongoose.isValidObjectId(req.params.id)) errors.push({ field: 'id', message: 'Mã PT không hợp lệ.' });
  const body = { ...req.body, username: 'valid-user', role: 'PT', password: req.body.password || 'MatKhauTam' };
  errors.push(...createUserValidator({ body }).filter((error) => !['username', 'role'].includes(error.field)));
  return errors;
}

function listValidator(req) {
  const errors = [];
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  if (!Number.isInteger(page) || page < 1) errors.push({ field: 'page', message: 'Trang phải là số nguyên lớn hơn 0.' });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) errors.push({ field: 'limit', message: 'Số bản ghi mỗi trang phải từ 1 đến 100.' });
  return errors;
}

module.exports = { validate, createUserValidator, updateUserValidator, loginValidator, listValidator };
