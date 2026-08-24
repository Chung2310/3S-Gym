const bcrypt = require('bcryptjs');
const User = require('../models/User');
const CustomerProfile = require('../models/CustomerProfile');
const InBodyRecord = require('../models/InBodyRecord');
const Goal = require('../models/Goal');
const WorkoutPlan = require('../models/WorkoutPlan');
const NutritionPlan = require('../models/NutritionPlan');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

async function createUser(payload) {
  const existing = await User.exists({ username: payload.username.trim() });
  if (existing) {
    throw new AppError({ status: 409, code: ERROR_CODES.DUPLICATE, message: 'Tên đăng nhập đã tồn tại.' });
  }

  const password = await bcrypt.hash(payload.password, 10);
  return User.create({
    username: payload.username.trim(),
    password,
    role: payload.role,
    fullName: payload.fullName || '',
    email: payload.email || undefined,
    avatarUrl: payload.avatarUrl || '',
    dateOfBirth: payload.dateOfBirth || null,
    gender: payload.gender || 'OTHER',
    phone: payload.phone || undefined,
    address: payload.address || '',
    specialization: payload.specialization || '',
    yearsOfExperience: payload.yearsOfExperience ?? 0,
    certificates: payload.certificates || [],
    bio: payload.bio || '',
    status: payload.status || 'ACTIVE',
  });
}

async function listUsers(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.keyword) {
    const escaped = query.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { username: { $regex: escaped, $options: 'i' } },
      { fullName: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function updatePt(id, payload) {
  const user = await User.findById(id);
  if (!user || user.role !== 'PT') {
    throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài khoản PT.' });
  }
  const fields = ['avatarUrl', 'dateOfBirth', 'gender', 'phone', 'email', 'fullName', 'address', 'specialization', 'yearsOfExperience', 'certificates', 'bio', 'status'];
  fields.forEach((field) => {
    if (payload[field] !== undefined) user[field] = payload[field] === '' && ['email', 'phone'].includes(field) ? undefined : payload[field] === '' && field === 'dateOfBirth' ? null : payload[field];
  });
  if (payload.password) user.password = await bcrypt.hash(payload.password, 10);
  await user.save();
  return user;
}

async function deletePt(id) {
  const pt = await User.findOne({ _id: id, role: 'PT' });
  if (!pt) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy tài khoản PT.' });
  if (await CustomerProfile.exists({ assignedPtId: id })) {
    throw new AppError({ status: 409, code: ERROR_CODES.DUPLICATE, message: 'Vui lòng chuyển hết khách sang PT khác trước khi xóa PT.' });
  }
  await User.db.transaction(async (session) => {
    for (const Model of [InBodyRecord, Goal, WorkoutPlan, NutritionPlan]) {
      const items = await Model.find({ ptId: id }).session(session);
      for (const item of items) {
        const customer = await CustomerProfile.findById(item.customerId).session(session);
        const currentPt = customer && await User.findOne({ _id: customer.assignedPtId, role: 'PT' }).session(session);
        if (!currentPt) throw new AppError({ status: 409, code: ERROR_CODES.DUPLICATE, message: 'Không thể xóa PT vì có nội dung chưa có PT hiện tại tiếp quản.' });
        item.ptId = currentPt.id;
        await item.save({ session });
      }
    }
    await User.deleteOne({ _id: id, role: 'PT' }, { session });
  });
}

async function ensureBootstrapAdmin({ username, password, fullName = 'Quản lý 3S' }) {
  if (!username || !password) return null;
  const existing = await User.findOne({ role: 'ADMIN' });
  if (existing) return existing;
  return createUser({ username, password, fullName, role: 'ADMIN' });
}

module.exports = { createUser, listUsers, updatePt, deletePt, ensureBootstrapAdmin };
