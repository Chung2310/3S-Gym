import { asyncHandler } from '../middlewares/asyncHandler.js';
import { success } from '../middlewares/response.js';
import { createWorkoutProposal } from '../services/aiWorkoutService.js';
import { generateWorkoutDraft } from '../services/aiWorkoutService.js';

export const proposal = asyncHandler(async (req, res) => success(res, { message: 'AI đã tạo đề xuất giáo án. PT hãy kiểm tra trước khi tạo chi tiết.', data: await createWorkoutProposal(req.user!, req.body.customerId, req.requestId!) }));
export const generation = asyncHandler(async (req, res) => success(res, { message: 'AI đã tạo bản nháp giáo án. PT hãy kiểm tra trong Studio.', data: await generateWorkoutDraft(req.user!, req.body, req.requestId!) }));
