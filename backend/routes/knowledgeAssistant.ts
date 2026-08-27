import express, { type Request } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate, listValidator, type ValidationIssue } from '../middlewares/validate.js';
import * as controller from '../controllers/knowledgeAssistantController.js';

const router = express.Router();
const knowledgeBase = [authenticate, authorize('ADMIN'), requireFeature('KNOWLEDGE_BASE')] as const;
const assistantBase = [authenticate, authorize('PT'), requireFeature('PT_ASSISTANT')] as const;
const idValidator = (req: Request): ValidationIssue[] => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã bản ghi không hợp lệ.' }];
const knowledgeBody = (req: Request): ValidationIssue[] => ['title', 'topic', 'content'].flatMap((field) => typeof req.body[field] === 'string' && req.body[field].trim() ? [] : [{ field, message: `Trường ${field} là bắt buộc.` }]);
const knowledgeUpdate = (req: Request): ValidationIssue[] => { const errors = idValidator(req); for (const field of ['title', 'topic', 'content']) if (req.body[field] !== undefined && (typeof req.body[field] !== 'string' || !req.body[field].trim())) errors.push({ field, message: `${field} không hợp lệ.` }); return errors; };
const suggestionBody = (req: Request): ValidationIssue[] => { const errors: ValidationIssue[] = []; if (!mongoose.isValidObjectId(req.body.customerId)) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' }); if (typeof req.body.scenario !== 'string' || !req.body.scenario.trim()) errors.push({ field: 'scenario', message: 'Vui lòng nhập tình huống.' }); if (typeof req.body.requestType !== 'string' || !req.body.requestType.trim()) errors.push({ field: 'requestType', message: 'Vui lòng chọn loại yêu cầu.' }); return errors; };

router.get('/knowledge/search', authenticate, authorize('ADMIN', 'PT'), requireFeature('KNOWLEDGE_BASE'), validate((req) => typeof req.query.q === 'string' && req.query.q.trim() ? [] : [{ field: 'q', message: 'Vui lòng nhập nội dung tìm kiếm.' }]), controller.searchKnowledge);
router.get('/knowledge', ...knowledgeBase, validate((req) => { const errors = listValidator(req); if (req.query.status && !['DRAFT', 'PUBLISHED'].includes(String(req.query.status))) errors.push({ field: 'status', message: 'Trạng thái không hợp lệ.' }); return errors; }), controller.listKnowledge);
router.post('/knowledge', ...knowledgeBase, validate(knowledgeBody), controller.createKnowledge);
router.patch('/knowledge/:id', ...knowledgeBase, validate(knowledgeUpdate), controller.updateKnowledge);
router.delete('/knowledge/:id', ...knowledgeBase, validate(idValidator), controller.deleteKnowledge);
router.patch('/knowledge/:id/publish', ...knowledgeBase, validate(idValidator), controller.publishKnowledge);
router.patch('/knowledge/:id/unpublish', ...knowledgeBase, validate(idValidator), controller.unpublishKnowledge);
router.post('/knowledge/:id/index', ...knowledgeBase, validate(idValidator), controller.indexKnowledge);

router.get('/assistant/conversations', ...assistantBase, validate((req) => { const errors = listValidator(req); if (req.query.customerId && !mongoose.isValidObjectId(String(req.query.customerId))) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' }); return errors; }), controller.listConversations);
router.post('/assistant/conversations', ...assistantBase, validate((req) => { const errors: ValidationIssue[] = []; if (!mongoose.isValidObjectId(req.body.customerId)) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' }); if (typeof req.body.title !== 'string' || !req.body.title.trim()) errors.push({ field: 'title', message: 'Vui lòng nhập tiêu đề.' }); return errors; }), controller.createConversation);
router.post('/assistant/conversations/:id/messages', ...assistantBase, validate((req) => { const errors = idValidator(req); if (typeof req.body.content !== 'string' || !req.body.content.trim()) errors.push({ field: 'content', message: 'Vui lòng nhập nội dung.' }); if (typeof req.body.requestType !== 'string' || !req.body.requestType.trim()) errors.push({ field: 'requestType', message: 'Vui lòng chọn loại yêu cầu.' }); return errors; }), controller.addConversationMessage);
router.post('/assistant/suggestions', ...assistantBase, validate(suggestionBody), controller.createSuggestion);
router.patch('/assistant/suggestions/:id/approve', ...assistantBase, validate(idValidator), controller.approveSuggestion);
router.patch('/assistant/suggestions/:id/reject', ...assistantBase, validate(idValidator), controller.rejectSuggestion);

router.get('/assistant/conversations/:id', ...assistantBase, validate(idValidator), controller.getConversation);
router.get('/assistant/suggestions', ...assistantBase, validate((req) => { const errors = listValidator(req); if (req.query.customerId && !mongoose.isValidObjectId(String(req.query.customerId))) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' }); if (req.query.reviewStatus && !['PT_REVIEW_REQUIRED', 'APPROVED', 'REJECTED'].includes(String(req.query.reviewStatus))) errors.push({ field: 'reviewStatus', message: 'Trạng thái duyệt không hợp lệ.' }); return errors; }), controller.listSuggestions);
router.get('/assistant/suggestions/:id', ...assistantBase, validate(idValidator), controller.getSuggestion);
router.patch('/assistant/suggestions/:id/apply', ...assistantBase, validate(idValidator), controller.applySuggestion);

export default router;
