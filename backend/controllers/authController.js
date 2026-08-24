const { success } = require('../middlewares/response');
const { asyncHandler } = require('../middlewares/asyncHandler');
const authService = require('../services/authService');
const login = asyncHandler(async (req, res) => success(res, { message: 'Đăng nhập thành công.', data: await authService.login(req.body) }));
module.exports = { login };
