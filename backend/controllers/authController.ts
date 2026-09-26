import { success } from '../middlewares/response.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as authService from '../services/authService.js';
import User from '../models/User.js';
import DeviceSession from '../models/DeviceSession.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { deleteSelfAccount, updateSelfProfile } from '../services/userService.js';

const login = asyncHandler(async (req, res) => success(res, { message: 'Đăng nhập thành công.', data: await authService.login(req.body) }));

const refresh = asyncHandler(async (req, res) => success(res, { message: 'Làm mới phiên đăng nhập thành công.', data: await authService.refreshSession(req.body) }));

const logout = asyncHandler(async (req, res) => success(res, { message: 'Đăng xuất thành công.', data: await authService.logoutSession(req.body) }));

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id).select('-password').lean();
  if (!user) {
    throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy người dùng.' });
  }
  return success(res, {
    message: 'Lấy thông tin người dùng thành công.',
    data: {
      id: String(user._id),
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl || (user as unknown as Record<string, unknown>).avatar || (user as unknown as Record<string, unknown>).photoUrl || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      specialization: user.specialization,
      yearsOfExperience: user.yearsOfExperience,
      certificates: user.certificates,
      bio: user.bio,
    },
  });
});

const updatePushToken = asyncHandler(async (req, res) => {
  const { pushToken } = req.body as { pushToken?: string };
  if (!pushToken || typeof pushToken !== 'string') {
    throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Thiếu pushToken.' });
  }
  // Cập nhật pushToken cho tất cả device ACTIVE của user
  const result = await DeviceSession.updateMany(
    { userId: req.user!.id, clientType: 'MOBILE', status: 'ACTIVE' },
    { $set: { pushToken: pushToken.trim() } },
  );
  if (result.matchedCount === 0) {
    await DeviceSession.create({
      userId: req.user!.id,
      clientType: 'MOBILE',
      pushToken: pushToken.trim(),
      status: 'ACTIVE',
      lastActiveAt: new Date(),
    });
  }
  return success(res, { message: 'Cập nhật push token thành công.', data: { pushToken: pushToken.trim() } });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await updateSelfProfile(req.user!, req.body);
  return success(res, {
    message: 'Cập nhật thông tin tài khoản thành công.',
    data: {
      id: String(user._id),
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl || (user as unknown as Record<string, unknown>).avatar || (user as unknown as Record<string, unknown>).photoUrl || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      specialization: user.specialization,
      yearsOfExperience: user.yearsOfExperience,
      certificates: user.certificates,
      bio: user.bio,
    },
  });
});

const deleteMe = asyncHandler(async (req, res) => {
  await deleteSelfAccount(req.user!);
  return success(res, { message: 'Xóa tài khoản thành công.', data: null });
});

export { login, refresh, logout, getMe, updateMe, updatePushToken, deleteMe };
