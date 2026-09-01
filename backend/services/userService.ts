import bcrypt from 'bcryptjs';
import type { Model, QueryFilter, Types } from 'mongoose';
import User, { type IUser, type UserDocument, type UserRole, type UserStatus } from '../models/User.js';
import CustomerProfile, { type CustomerProfileDocument, type ICustomerProfile } from '../models/CustomerProfile.js';
import InBodyRecord from '../models/InBodyRecord.js';
import Goal from '../models/Goal.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import NutritionPlan from '../models/NutritionPlan.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { ensureWallet } from './creditWalletService.js';
import { withTransaction } from './transactionService.js';

export interface UserPayload {
  username: string;
  password: string;
  role: UserRole;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  dateOfBirth?: string | Date | null;
  gender?: IUser['gender'];
  phone?: string;
  address?: string;
  specialization?: string;
  yearsOfExperience?: number;
  certificates?: string[];
  bio?: string;
  status?: UserStatus;
}

export type UpdateUserPayload = Partial<Omit<UserPayload, 'username' | 'role'>>;
export type UpdatePtPayload = UpdateUserPayload;
export interface UserListQuery {
  page?: unknown;
  limit?: unknown;
  role?: unknown;
  status?: unknown;
  keyword?: unknown;
}
interface OwnedContent {
  customerId: Types.ObjectId;
  ptId: Types.ObjectId;
}

async function createUser(payload: UserPayload) {
  const existing = await User.exists({ username: payload.username.trim() });
  if (existing) {
    throw new AppError({
      status: 409,
      code: ERROR_CODES.DUPLICATE,
      message: 'Tên đăng nhập đã tồn tại.',
    });
  }
  const password = await bcrypt.hash(payload.password, 10);
  return withTransaction(async (session) => {
    const [user] = await User.create(
      [
        {
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
        },
      ],
      { session },
    );
    await ensureWallet(user.id, session);

    // If role is CUSTOMER, ensure a linked CustomerProfile exists
    if (payload.role === 'CUSTOMER') {
      const filterConditions: Array<QueryFilter<ICustomerProfile>> = [{ userId: user._id }];
      if (payload.phone && payload.phone.trim()) {
        filterConditions.push({ phone: payload.phone.trim() });
      }
      if (payload.email && payload.email.trim()) {
        filterConditions.push({ email: payload.email.trim().toLowerCase() });
      }

      const existingProfile = await CustomerProfile.findOne({
        $or: filterConditions,
      } as QueryFilter<ICustomerProfile>).session(session);

      if (existingProfile) {
        if (!existingProfile.userId) {
          existingProfile.userId = user._id;
        }
        if (payload.fullName) existingProfile.fullName = payload.fullName;
        await existingProfile.save({ session });
      } else {
        const defaultPt = await User.findOne({ role: 'PT', status: 'ACTIVE' }).session(session);
        if (defaultPt) {
          await CustomerProfile.create(
            [
              {
                userId: user._id,
                assignedPtId: defaultPt._id,
                fullName: payload.fullName || payload.username,
                phone: payload.phone || '0000000000',
                email: payload.email || null,
                gender: payload.gender || 'OTHER',
                dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
                status: 'ACTIVE',
                initialGoal: 'Cải thiện thể lực và vóc dáng',
                medicalNotes: '',
                internalNotes: '',
              },
            ],
            { session },
          );
        }
      }
    }

    return user;
  });
}

async function listUsers(query: UserListQuery) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const filter: QueryFilter<IUser> = {};
  if (query.role === 'ADMIN' || query.role === 'PT' || query.role === 'CUSTOMER') {
    filter.role = query.role;
  }
  if (query.status === 'ACTIVE' || query.status === 'LOCKED') filter.status = query.status;
  if (typeof query.keyword === 'string' && query.keyword) {
    const escaped = query.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { username: { $regex: escaped, $options: 'i' } },
      { fullName: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserDocument> {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError({
      status: 404,
      code: ERROR_CODES.NOT_FOUND,
      message: 'Không tìm thấy tài khoản.',
    });
  }

  const fields: Array<keyof UpdateUserPayload> = [
    'avatarUrl',
    'dateOfBirth',
    'gender',
    'phone',
    'email',
    'fullName',
    'address',
    'specialization',
    'yearsOfExperience',
    'certificates',
    'bio',
    'status',
  ];
  for (const field of fields) {
    const value = payload[field];
    if (value !== undefined) {
      user.set(
        field,
        value === '' && ['email', 'phone'].includes(field)
          ? undefined
          : value === '' && field === 'dateOfBirth'
            ? null
            : value,
      );
    }
  }
  if (payload.password && payload.password.trim()) {
    user.password = await bcrypt.hash(payload.password.trim(), 10);
  }
  await user.save();

  // If role is CUSTOMER, synchronize with CustomerProfile
  if (user.role === 'CUSTOMER') {
    let customer = await CustomerProfile.findOne({ userId: user._id });
    if (!customer && (user.phone || user.email)) {
      const matchConditions: Array<QueryFilter<ICustomerProfile>> = [];
      if (user.phone) matchConditions.push({ phone: user.phone });
      if (user.email) matchConditions.push({ email: user.email.toLowerCase() });

      customer = await CustomerProfile.findOne({
        $or: matchConditions,
        userId: { $in: [null, undefined] },
      } as QueryFilter<ICustomerProfile>);
      if (customer) {
        customer.userId = user._id;
      }
    }

    if (!customer) {
      const defaultPt = await User.findOne({ role: 'PT', status: 'ACTIVE' });
      if (defaultPt) {
        customer = new CustomerProfile({
          userId: user._id,
          assignedPtId: defaultPt._id,
          fullName: user.fullName || user.username,
          phone: user.phone || '0000000000',
          email: user.email || null,
          gender: user.gender || 'OTHER',
          dateOfBirth: user.dateOfBirth,
          status: 'ACTIVE',
          initialGoal: 'Cải thiện thể lực và vóc dáng',
          medicalNotes: '',
          internalNotes: '',
        });
      }
    }

    if (customer) {
      if (payload.fullName !== undefined) customer.fullName = user.fullName || customer.fullName;
      if (payload.phone !== undefined && user.phone) customer.phone = user.phone;
      if (payload.email !== undefined) customer.email = user.email || null;
      if (payload.gender !== undefined) customer.gender = user.gender || 'OTHER';
      if (payload.dateOfBirth !== undefined) {
        customer.dateOfBirth = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
      }
      if (payload.status !== undefined) {
        customer.status = user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
      }
      await customer.save();
    }
  }

  return user;
}

const updatePt = updateUser;

async function deleteUser(id: string): Promise<void> {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError({
      status: 404,
      code: ERROR_CODES.NOT_FOUND,
      message: 'Không tìm thấy tài khoản.',
    });
  }

  if (user.role === 'PT') {
    if (await CustomerProfile.exists({ assignedPtId: id })) {
      throw new AppError({
        status: 409,
        code: ERROR_CODES.DUPLICATE,
        message: 'Vui lòng chuyển hết khách sang PT khác trước khi xóa PT.',
      });
    }
    const contentModels: Array<Model<OwnedContent>> = [
      InBodyRecord as unknown as Model<OwnedContent>,
      Goal as unknown as Model<OwnedContent>,
      WorkoutPlan as unknown as Model<OwnedContent>,
      NutritionPlan as unknown as Model<OwnedContent>,
    ];
    await User.db.transaction(async (session) => {
      for (const Model of contentModels) {
        const items = await Model.find({ ptId: id }).session(session);
        for (const item of items) {
          const customer = await CustomerProfile.findById(item.customerId).session(session);
          const currentPt =
            customer && (await User.findOne({ _id: customer.assignedPtId, role: 'PT' }).session(session));
          if (!currentPt) {
            throw new AppError({
              status: 409,
              code: ERROR_CODES.DUPLICATE,
              message: 'Không thể xóa PT vì có nội dung chưa có PT hiện tại tiếp quản.',
            });
          }
          item.ptId = currentPt._id;
          await item.save({ session });
        }
      }
      await User.deleteOne({ _id: id, role: 'PT' }, { session });
    });
    return;
  }

  if (user.role === 'CUSTOMER') {
    await CustomerProfile.updateMany({ userId: id }, { $unset: { userId: 1 } });
    await User.deleteOne({ _id: id });
    return;
  }

  const adminCount = await User.countDocuments({ role: 'ADMIN' });
  if (adminCount <= 1) {
    throw new AppError({
      status: 400,
      code: ERROR_CODES.VALIDATION,
      message: 'Không thể xóa tài khoản Quản trị viên duy nhất.',
    });
  }
  await User.deleteOne({ _id: id });
}

const deletePt = deleteUser;

async function ensureBootstrapAdmin({
  username,
  password,
  fullName = 'Quản lý 3S',
}: {
  username?: string;
  password?: string;
  fullName?: string;
}) {
  if (!username || !password) return null;
  const existing = await User.findOne({ role: 'ADMIN' });
  if (!existing) return createUser({ username, password, fullName, role: 'ADMIN' });
  await ensureWallet(existing.id);
  return existing;
}

export {
  createUser,
  listUsers,
  updateUser,
  updatePt,
  deleteUser,
  deletePt,
  ensureBootstrapAdmin,
};
