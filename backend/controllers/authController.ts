import { success } from '../middlewares/response.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import * as authService from '../services/authService.js';
const login = asyncHandler(async (req, res) => success(res, { message: 'Đăng nhập thành công.', data: await authService.login(req.body) }));
export { login };