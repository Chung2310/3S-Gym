import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DeviceSession, { type ClientType } from '../models/DeviceSession.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { getEnv } from '../config/env.js';

interface LoginPayload {
  username: string;
  password: string;
  clientType?: ClientType;
  deviceInfo?: {
    deviceId?: string;
    deviceName?: string;
    platform?: string;
    osVersion?: string;
    appVersion?: string;
  };
  pushToken?: string;
}

async function login({ username, password, clientType = 'WEB', deviceInfo, pushToken }: LoginPayload) {
  const user = await User.findOne({ username: username.trim() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError({ status: 401, code: ERROR_CODES.AUTHENTICATION, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
  }
  if (user.status === 'LOCKED') {
    throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Tài khoản đã bị khóa.' });
  }

  // 1. Phân quyền chặt chẽ: Ứng dụng Mobile chỉ dành riêng cho HLV (PT/ADMIN), tuyệt đối không cho CUSTOMER
  if (clientType === 'MOBILE' && user.role === 'CUSTOMER') {
    throw new AppError({
      status: 403,
      code: ERROR_CODES.AUTHORIZATION,
      message: 'Ứng dụng di động chỉ dành riêng cho Huấn luyện viên (PT). Hội viên vui lòng liên hệ quầy chăm sóc khách hàng.',
    });
  }

  const env = getEnv();

  // 2. Phân biệt theo môi trường Mobile vs Web
  if (clientType === 'MOBILE') {
    // Mobile HLV: Token truy cập 7 ngày + Refresh Token 60 ngày để không bị gián đoạn khi đứng lớp
    const token = jwt.sign(
      { id: user.id, role: user.role, clientType: 'MOBILE' },
      env.JWT_SECRET,
      { expiresIn: '7d', algorithm: env.JWT_ALGORITHM, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE },
    );

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 ngày

    // Lưu hoặc cập nhật phiên thiết bị của HLV
    if (deviceInfo?.deviceId) {
      await DeviceSession.findOneAndUpdate(
        { userId: user._id, clientType: 'MOBILE', deviceId: deviceInfo.deviceId },
        {
          deviceName: deviceInfo.deviceName || '',
          platform: deviceInfo.platform || '',
          osVersion: deviceInfo.osVersion || '',
          appVersion: deviceInfo.appVersion || '',
          pushToken: pushToken || '',
          refreshToken,
          lastActiveAt: new Date(),
          status: 'ACTIVE',
          expiresAt,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await DeviceSession.create({
        userId: user._id,
        clientType: 'MOBILE',
        deviceId: '',
        deviceName: deviceInfo?.deviceName || '',
        platform: deviceInfo?.platform || '',
        osVersion: deviceInfo?.osVersion || '',
        appVersion: deviceInfo?.appVersion || '',
        pushToken: pushToken || '',
        refreshToken,
        lastActiveAt: new Date(),
        status: 'ACTIVE',
        expiresAt,
      });
    }

    return {
      token,
      refreshToken,
      clientType: 'MOBILE',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl || '',
        specialization: user.specialization || '',
        phone: user.phone || '',
      },
    };
  }

  // Web Admin/PT: Token 1 ngày chuẩn mực bảo mật
  const token = jwt.sign(
    { id: user.id, role: user.role, clientType: 'WEB' },
    env.JWT_SECRET,
    { expiresIn: '1d', algorithm: env.JWT_ALGORITHM, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE },
  );

  return {
    token,
    clientType: 'WEB',
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl || (user as unknown as Record<string, unknown>).avatar || (user as unknown as Record<string, unknown>).photoUrl || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
    },
  };
}

async function refreshSession({ refreshToken }: { refreshToken: string }) {
  if (!refreshToken?.trim()) {
    throw new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message: 'Thiếu Refresh Token.' });
  }

  const session = await DeviceSession.findOne({
    refreshToken: refreshToken.trim(),
    status: 'ACTIVE',
  });

  if (!session || (session.expiresAt && session.expiresAt.getTime() < Date.now())) {
    if (session) {
      session.status = 'EXPIRED';
      await session.save();
    }
    throw new AppError({
      status: 401,
      code: ERROR_CODES.AUTHENTICATION,
      message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }

  const user = await User.findById(session.userId);
  if (!user || user.status === 'LOCKED') {
    session.status = 'REVOKED';
    await session.save();
    throw new AppError({
      status: 403,
      code: ERROR_CODES.AUTHORIZATION,
      message: 'Tài khoản không hợp lệ hoặc đã bị khóa.',
    });
  }

  const env = getEnv();
  const token = jwt.sign(
    { id: user.id, role: user.role, clientType: session.clientType },
    env.JWT_SECRET,
    { expiresIn: '7d', algorithm: env.JWT_ALGORITHM, issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE },
  );

  // Xoay vòng (rotate) Refresh Token mới
  const newRefreshToken = crypto.randomBytes(32).toString('hex');
  session.refreshToken = newRefreshToken;
  session.lastActiveAt = new Date();
  session.expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  await session.save();

  return {
    token,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    },
  };
}

async function logoutSession({ refreshToken, pushToken }: { refreshToken?: string; pushToken?: string }) {
  if (refreshToken) {
    await DeviceSession.updateOne(
      { refreshToken: refreshToken.trim() },
      { status: 'REVOKED', pushToken: '' }
    );
  }
  if (pushToken) {
    await DeviceSession.updateMany(
      { pushToken: pushToken.trim() },
      { pushToken: '' }
    );
  }
  return { success: true };
}

export { login, refreshSession, logoutSession };

