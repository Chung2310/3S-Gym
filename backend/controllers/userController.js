const { success } = require('../middlewares/response');
const { asyncHandler } = require('../middlewares/asyncHandler');
const userService = require('../services/userService');
const publicUser = (user) => user.toObject({ versionKey: false, transform: (_doc, value) => { delete value.password; return value; } });
const create = asyncHandler(async (req, res) => success(res, { status: 201, message: 'Tạo tài khoản thành công.', data: publicUser(await userService.createUser(req.body)) }));
const list = asyncHandler(async (req, res) => { const { users, meta } = await userService.listUsers(req.query); return success(res, { message: 'Lấy danh sách tài khoản thành công.', data: users, meta }); });
const update = asyncHandler(async (req, res) => success(res, { message: 'Cập nhật hồ sơ PT thành công.', data: publicUser(await userService.updatePt(req.params.id, req.body)) }));
const remove = asyncHandler(async (req, res) => { await userService.deletePt(req.params.id); return success(res, { message: 'Xóa PT thành công.', data: null }); });
module.exports = { create, list, update, remove };
