import { asyncHandler } from '../middlewares/asyncHandler.js';
import { success } from '../middlewares/response.js';
import { createDraft } from '../services/contentDraftService.js';

const nutrition = asyncHandler(async (req, res) =>
  success(res, {
    status: 201,
    message: 'AI đã tạo thực đơn nháp. PT cần kiểm tra trước khi sử dụng.',
    data: await createDraft(req.user!, 'nutrition', req.body.customerId, req.body.request),
  })
);

const workout = asyncHandler(async (req, res) =>
  success(res, {
    status: 201,
    message: 'AI đã tạo giáo án nháp. PT cần kiểm tra trước khi sử dụng.',
    data: await createDraft(req.user!, 'workout', req.body.customerId, req.body.request),
  })
);

const roadmap = asyncHandler(async (req, res) =>
  success(res, {
    status: 201,
    message: 'AI đã tạo đề xuất lộ trình Roadmap thành công. PT hãy kiểm tra và tinh chỉnh.',
    data: await createDraft(req.user!, 'roadmap', req.body.customerId, req.body.request),
  })
);

export { nutrition, workout, roadmap };
