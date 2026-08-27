import { asyncHandler } from '../middlewares/asyncHandler.js'; import { success } from '../middlewares/response.js'; import * as knowledge from '../services/knowledgeService.js'; import * as assistant from '../services/assistantService.js';
const createKnowledge = asyncHandler(async (req, res) => success(res, { status: 201, message: 'Tạo tài liệu thành công.', data: await knowledge.createDocument(req.body) }));
const publishKnowledge = asyncHandler(async (req, res) => success(res, { message: 'Xuất bản tài liệu thành công.', data: await knowledge.publishDocument(req.user!, String(req.params.id)) }));
const searchKnowledge = asyncHandler(async (req, res) => success(res, { message: 'Tìm kiếm tri thức thành công.', data: await knowledge.searchPublished(String(req.query.q || '')) }));
const createSuggestion = asyncHandler(async (req, res) => success(res, { status: 201, message: 'Tạo đề xuất thành công. PT cần kiểm tra trước khi sử dụng.', data: await assistant.createSuggestion(req.user!, req.body) }));
const approveSuggestion = asyncHandler(async (req, res) => success(res, { message: 'Phê duyệt đề xuất thành công.', data: await assistant.reviewSuggestion(req.user!, String(req.params.id), true, req.body.editedContent) }));
const rejectSuggestion = asyncHandler(async (req, res) => success(res, { message: 'Từ chối đề xuất thành công.', data: await assistant.reviewSuggestion(req.user!, String(req.params.id), false) }));
export { createKnowledge, publishKnowledge, searchKnowledge, createSuggestion, approveSuggestion, rejectSuggestion };
