import { success } from '../middlewares/response.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as authService from '../services/authService.js';
const login = asyncHandler(async (req, res) => success(res, { message: 'Đăng nhập thành công.', data: await authService.login(req.body) }));

const refresh = asyncHandler(async (req, res) => success(res, { message: 'Làm mới phiên đăng nhập thành công.', data: await authService.refreshSession(req.body) }));

const logout = asyncHandler(async (req, res) => success(res, { message: 'Đăng xuất thành công.', data: await authService.logoutSession(req.body) }));

export { login, refresh, logout };