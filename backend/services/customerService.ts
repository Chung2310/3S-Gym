import { Types, type QueryFilter } from 'mongoose';
import CustomerProfile, { type ICustomerProfile } from '../models/CustomerProfile.js';
import PtPackage, { type IPtPackage } from '../models/PtPackage.js';
import User from '../models/User.js';
import InBodyRecord from '../models/InBodyRecord.js';
import Goal from '../models/Goal.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import NutritionPlan from '../models/NutritionPlan.js';
import TransferRequest from '../models/TransferRequest.js';
import * as userService from './userService.js';
import type { UserPayload } from './userService.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';

export interface CustomerPayload {
  assignedPtId?: string; fullName?: string; phone?: string; email?: string; dateOfBirth?: string;
  gender?: ICustomerProfile['gender']; height?: number | ''; initialWeight?: number | '';
  medicalNotes?: string; initialGoal?: string; internalNotes?: string; status?: ICustomerProfile['status'];
}
interface CustomerQuery { page?: unknown; limit?: unknown; ptId?: unknown; status?: unknown; keyword?: unknown; sort?: unknown; order?: unknown }
interface PackagePayload { name?: string; totalSessions?: number; startDate?: string | Date; endDate?: string | Date; status?: 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED' }
interface PackageQuery { page?: unknown; limit?: unknown; status?: unknown }

const CUSTOMER_MUTABLE_FIELDS: Array<keyof CustomerPayload> = [
  'fullName', 'phone', 'email', 'dateOfBirth', 'gender', 'height', 'initialWeight',
  'medicalNotes', 'initialGoal', 'internalNotes', 'status',
];

function customerChanges(payload: CustomerPayload): Record<string, unknown> {
  return Object.fromEntries(CUSTOMER_MUTABLE_FIELDS
    .filter((key) => Object.prototype.hasOwnProperty.call(payload, key))
    .map((key) => {
      const value = payload[key];
      if (['email', 'dateOfBirth', 'height', 'initialWeight'].includes(key) && value === '') return [key, null];
      return [key, typeof value === 'string' ? value.trim() : value];
    }));
}

function notFound() { return new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' }); }

function scopedFilter(user: AuthenticatedUser, extra: QueryFilter<ICustomerProfile> = {}): QueryFilter<ICustomerProfile> {
  return user.role === 'ADMIN' ? extra : { ...extra, assignedPtId: new Types.ObjectId(user.id) };
}

async function listCustomers(user: AuthenticatedUser, query: CustomerQuery) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const filter = scopedFilter(user);
  if (user.role === 'ADMIN' && typeof query.ptId === 'string') filter.assignedPtId = new Types.ObjectId(query.ptId);
  if (query.status === 'ACTIVE' || query.status === 'INACTIVE' || query.status === 'LEAD') filter.status = query.status;
  if (typeof query.keyword === 'string' && query.keyword) {
    const escaped = query.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { fullName: { $regex: escaped, $options: 'i' } }, { phone: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }
  const sortField = query.sort === 'fullName' || query.sort === 'status' ? query.sort : 'createdAt';
  const sortDirection = query.order === 'asc' ? 1 : -1;
  const [customers, total] = await Promise.all([
    CustomerProfile.find(filter).sort({ [sortField]: sortDirection }).skip((page - 1) * limit).limit(limit).lean(),
    CustomerProfile.countDocuments(filter),
  ]);
  return { customers, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getCustomer(user: AuthenticatedUser, id: string) {
  const customer = await CustomerProfile.findOne(scopedFilter(user, { _id: id })).lean();
  if (!customer) throw notFound();
  return customer;
}

async function createCustomer(user: AuthenticatedUser, payload: CustomerPayload) {
  const assignedPtId = user.role === 'ADMIN' ? payload.assignedPtId : user.id;
  if (!assignedPtId) throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Vui lòng chọn PT phụ trách.' });
  return CustomerProfile.create({ ...customerChanges(payload), assignedPtId: new Types.ObjectId(assignedPtId) });
}

async function updateCustomer(user: AuthenticatedUser, id: string, payload: CustomerPayload) {
  const customer = await CustomerProfile.findOneAndUpdate(scopedFilter(user, { _id: id }), customerChanges(payload), { returnDocument: 'after', runValidators: true }).lean();
  if (!customer) throw notFound();
  return customer;
}

async function createPackage(user: AuthenticatedUser, customerId: string, payload: PackagePayload) {
  await getCustomer(user, customerId);
  return PtPackage.create({ ...payload, customerId: new Types.ObjectId(customerId), usedSessions: 0, remainingSessions: payload.totalSessions });
}

async function updatePackage(user: AuthenticatedUser, customerId: string, packageId: string, payload: PackagePayload) {
  await getCustomer(user, customerId);
  const item = await PtPackage.findOne({ _id: packageId, customerId });
  if (!item) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy gói PT.' });
  const fields: Array<keyof PackagePayload> = ['name', 'totalSessions', 'startDate', 'endDate', 'status'];
  for (const field of fields) if (payload[field] !== undefined) item.set(field, payload[field]);
  if (item.usedSessions > item.totalSessions) throw new AppError({ status: 409, code: ERROR_CODES.VALIDATION, message: 'Tổng số buổi không được nhỏ hơn số buổi đã sử dụng.' });
  item.remainingSessions = item.totalSessions - item.usedSessions;
  return item.save();
}

async function deletePackage(user: AuthenticatedUser, customerId: string, packageId: string) {
  await getCustomer(user, customerId);
  const item = await PtPackage.findOneAndDelete({ _id: packageId, customerId });
  if (!item) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy gói PT.' });
}

async function deleteCustomer(user: AuthenticatedUser, customerId: string) {
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

async function listPackages(user: AuthenticatedUser, customerId: string, query: PackageQuery) {
  await getCustomer(user, customerId);
  const page = Number(query.page || 1); const limit = Number(query.limit || 20);
  const filter: { customerId: Types.ObjectId; status?: IPtPackage['status'] } = { customerId: new Types.ObjectId(customerId) };
  if (query.status === 'ACTIVE' || query.status === 'EXPIRED' || query.status === 'COMPLETED' || query.status === 'CANCELLED') filter.status = query.status;
  const [packages, total] = await Promise.all([
    PtPackage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), PtPackage.countDocuments(filter),
  ]);
  return { packages, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function createCustomerAccount(user: AuthenticatedUser, customerId: string, payload: UserPayload) {
  const customer = await CustomerProfile.findOne(scopedFilter(user, { _id: customerId }));
  if (!customer) throw notFound();
  if (customer.userId) throw new AppError({ status: 409, code: ERROR_CODES.DUPLICATE, message: 'Khách hàng đã có tài khoản đăng nhập.' });
  const account = await userService.createUser({ ...payload, fullName: customer.fullName, role: 'CUSTOMER' });
  try { customer.userId = account._id; await customer.save(); }
  catch (error) { await User.deleteOne({ _id: account._id }); throw error; }
  return { customer, user: { id: account.id, username: account.username, fullName: account.fullName, email: account.email, role: account.role, status: account.status } };
}

export { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, createPackage, updatePackage, deletePackage, listPackages, createCustomerAccount };
