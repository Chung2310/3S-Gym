import { asyncHandler } from '../middlewares/asyncHandler.js';
import { success } from '../middlewares/response.js';
import { createOcrDraft, confirmOcrDraft } from '../services/inbodyOcrService.js';

const create = asyncHandler(async (req, res) => success(res, {
  status: 201, message: 'Đã quét phiếu InBody. PT cần kiểm tra dữ liệu trước khi xác nhận.',
  data: await createOcrDraft(req.user!, req.body.customerId, req.body.measurementDate, req.file!),
}));

const confirm = asyncHandler(async (req, res) => success(res, {
  message: 'Đã xác nhận dữ liệu OCR InBody.',
  data: await confirmOcrDraft(req.user!, String(req.params.id), req.body),
}));

export { create, confirm };
