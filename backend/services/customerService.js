const CustomerProfile = require('../models/CustomerProfile');
const PtPackage = require('../models/PtPackage');
const User = require('../models/User');
const InBodyRecord = require('../models/InBodyRecord');
const Goal = require('../models/Goal');
const WorkoutPlan = require('../models/WorkoutPlan');
const NutritionPlan = require('../models/NutritionPlan');
const TransferRequest = require('../models/TransferRequest');
const userService = require('./userService');
const { AppError } = require('../errors/AppError');
const { ERROR_CODES } = require('../errors/errorCodes');

const CUSTOMER_MUTABLE_FIELDS = [
  'fullName', 'phone', 'email', 'dateOfBirth', 'gender', 'height',
  'initialWeight', 'medicalNotes', 'initialGoal', 'internalNotes', 'status',
];

function customerChanges(payload) {
  return Object.fromEntries(CUSTOMER_MUTABLE_FIELDS
    .filter((key) => Object.prototype.hasOwnProperty.call(payload, key))
    .map((key) => {
      const value = payload[key];
      if (['email', 'dateOfBirth', 'height', 'initialWeight'].includes(key) && value === '') return [key, null];
      return [key, typeof value === 'string' ? value.trim() : value];
    }));
}

function notFound() {
  return new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' });
}

function scopedFilter(user, extra = {}) {
  return user.role === 'ADMIN' ? extra : { ...extra, assignedPtId: user.id };
}

async function listCustomers(user, query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const filter = scopedFilter(user);
  if (user.role === 'ADMIN' && query.ptId) filter.assignedPtId = query.ptId;
  if (query.status) filter.status = query.status;
  if (query.keyword) {
    const escaped = query.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { fullName: { $regex: escaped, $options: 'i' } },
      { phone: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }
  const sortField = ['fullName', 'createdAt', 'status'].includes(query.sort) ? query.sort : 'createdAt';
  const sortDirection = query.order === 'asc' ? 1 : -1;
  const [customers, total] = await Promise.all([
    CustomerProfile.find(filter).sort({ [sortField]: sortDirection }).skip((page - 1) * limit).limit(limit).lean(),
    CustomerProfile.countDocuments(filter),
  ]);
  return { customers, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getCustomer(user, id) {
  const customer = await CustomerProfile.findOne(scopedFilter(user, { _id: id })).lean();
  if (!customer) throw notFound();
  return customer;
}

async function createCustomer(user, payload) {
  return CustomerProfile.create({ ...customerChanges(payload), assignedPtId: user.role === 'ADMIN' ? payload.assignedPtId : user.id });
}

async function updateCustomer(user, id, payload) {
  const changes = customerChanges(payload);
  const customer = await CustomerProfile.findOneAndUpdate(scopedFilter(user, { _id: id }), changes, { returnDocument: 'after', runValidators: true }).lean();
  if (!customer) throw notFound();
  return customer;
}

async function createPackage(user, customerId, payload) {
  await getCustomer(user, customerId);
  return PtPackage.create({ ...payload, customerId, usedSessions: 0, remainingSessions: payload.totalSessions });
}

async function updatePackage(user, customerId, packageId, payload) {
  await getCustomer(user, customerId);
  const item = await PtPackage.findOne({ _id: packageId, customerId });
  if (!item) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy gói PT.' });
  for (const field of ['name', 'totalSessions', 'startDate', 'endDate', 'status']) if (payload[field] !== undefined) item[field] = payload[field];
  if (item.usedSessions > item.totalSessions) throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Tổng số buổi không được nhỏ hơn số buổi đã sử dụng.' });
  item.remainingSessions = item.totalSessions - item.usedSessions;
  return item.save();
}

async function deletePackage(user, customerId, packageId) {
  await getCustomer(user, customerId);
  const item = await PtPackage.findOneAndDelete({ _id: packageId, customerId });
  if (!item) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy gói PT.' });
}

async function deleteCustomer(user, customerId) {
  const customer = await CustomerProfile.findOne(scopedFilter(user, { _id: customerId }));
  if (!customer) throw notFound();
  await CustomerProfile.db.transaction(async (session) => {
    const options = { session };
    await PtPackage.deleteMany({ customerId }, options);
    await InBodyRecord.deleteMany({ customerId }, options);
    await Goal.deleteMany({ customerId }, options);
    await WorkoutPlan.deleteMany({ customerId }, options);
    await NutritionPlan.deleteMany({ customerId }, options);
    await TransferRequest.deleteMany({ customerId }, options);
    await CustomerProfile.deleteOne({ _id: customerId }, options);
    if (customer.userId) await User.deleteOne({ _id: customer.userId, role: 'CUSTOMER' }, options);
  });
}

async function listPackages(user, customerId, query) {
  await getCustomer(user, customerId);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const filter = { customerId };
  if (query.status) filter.status = query.status;
  const [packages, total] = await Promise.all([
    PtPackage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    PtPackage.countDocuments(filter),
  ]);
  return { packages, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function createCustomerAccount(user, customerId, payload) {
  const customer = await CustomerProfile.findOne(scopedFilter(user, { _id: customerId }));
  if (!customer) throw notFound();
  if (customer.userId) {
    throw new AppError({ status: 409, code: ERROR_CODES.DUPLICATE, message: 'Khách hàng đã có tài khoản đăng nhập.' });
  }
  const account = await userService.createUser({ ...payload, fullName: customer.fullName, role: 'CUSTOMER' });
  try {
    customer.userId = account.id;
    await customer.save();
  } catch (error) {
    await User.deleteOne({ _id: account.id });
    throw error;
  }
  return { customer, user: { id: account.id, username: account.username, fullName: account.fullName, email: account.email, role: account.role, status: account.status } };
}

module.exports = { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, createPackage, updatePackage, deletePackage, listPackages, createCustomerAccount };
