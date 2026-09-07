import { asyncHandler } from '../middlewares/asyncHandler.js';
import { success } from '../middlewares/response.js';
import {
  createNutritionDraft,
  createWorkoutDraft,
  createRoadmapDraft,
  analyzeNutritionByAi,
} from '../services/contentDraftService.js';

const nutrition = asyncHandler(async (req, res) =>
  success(res, {
    status: 201,
    message: 'AI đã tạo thực đơn nháp. PT cần kiểm tra trước khi sử dụng.',
    data: await createNutritionDraft(req.user!, req.body.customerId, req.body.request, req.requestId!, req.body.planId),
  })
);

const workout = asyncHandler(async (req, res) =>
  success(res, {
    status: 201,
    message: 'AI đã tạo giáo án nháp. PT cần kiểm tra trước khi sử dụng.',
    data: await createWorkoutDraft(req.user!, req.body.customerId, req.body.request, req.requestId!),
  })
);

const roadmap = asyncHandler(async (req, res) =>
  success(res, {
    status: 201,
    message: 'AI đã tạo đề xuất lộ trình Roadmap thành công. PT hãy kiểm tra và tinh chỉnh.',
    data: await createRoadmapDraft(req.user!, req.body.customerId, req.body.request, req.requestId!),
  })
);

const nutritionAnalysis = asyncHandler(async (req, res) =>
  success(res, {
    status: 200,
    message: 'AI đã phân tích thể trạng, nhu cầu và tính toán Calo/Macros thành công.',
    data: await analyzeNutritionByAi(req.user!, req.body, req.requestId!),
  })
);

export { nutrition, workout, roadmap, nutritionAnalysis };

