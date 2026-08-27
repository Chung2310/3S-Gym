import { asyncHandler } from '../middlewares/asyncHandler.js';
import { success } from '../middlewares/response.js';
import * as service from '../services/exerciseService.js';
const create = asyncHandler(async (req, res) => success(res, { status: 201, message: 'Tạo bài tập thành công.', data: await service.create(req.user!, req.body) }));
const list = asyncHandler(async (req, res) => { const result = await service.list(req.user!, req.query); return success(res, { message: 'Lấy thư viện bài tập thành công.', data: result.items, meta: result.meta }); });
const update = asyncHandler(async (req, res) => success(res, { message: 'Cáº­p nháº­t bÃ i táº­p thÃ nh cÃ´ng.', data: await service.update(req.user!, String(req.params.id), req.body) }));
export { create, list, update };
