const { success } = require('../middlewares/response');
const { asyncHandler } = require('../middlewares/asyncHandler');
const service = require('../services/publicationService');
const labels = { inbody: 'InBody', goals: 'mục tiêu', workoutPlans: 'giáo án', nutritionPlans: 'thực đơn' };
function createController(resource) {
  return {
    create: asyncHandler(async (req, res) => success(res, { status: 201, message: `Tạo ${labels[resource]} thành công.`, data: await service.createContent(resource, req.user, req.body) })),
    update: asyncHandler(async (req, res) => success(res, { message: `Cập nhật ${labels[resource]} thành công.`, data: await service.updateContent(resource, req.user, req.params.id, req.body) })),
    remove: asyncHandler(async (req, res) => { await service.deleteContent(resource, req.user, req.params.id); return success(res, { message: `Xóa ${labels[resource]} thành công.`, data: null }); }),
    list: asyncHandler(async (req, res) => { const result = await service.listContent(resource, req.user, req.query); return success(res, { message: `Lấy danh sách ${labels[resource]} thành công.`, data: result.items, meta: result.meta }); }),
    publish: asyncHandler(async (req, res) => success(res, { message: `Công bố ${labels[resource]} thành công.`, data: await service.setPublication(resource, req.user, req.params.id, true) })),
    unpublish: asyncHandler(async (req, res) => success(res, { message: `Thu hồi ${labels[resource]} thành công.`, data: await service.setPublication(resource, req.user, req.params.id, false) })),
  };
}
const getMyContent = asyncHandler(async (req, res) => success(res, { message: 'Lấy nội dung của khách hàng thành công.', data: await service.getMyContent(req.user) }));
module.exports = { createController, getMyContent };
