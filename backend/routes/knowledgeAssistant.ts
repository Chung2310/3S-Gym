import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate } from '../middlewares/validate.js';
import * as controller from '../controllers/knowledgeAssistantController.js';
import { addConversationMessageSchema, createConversationSchema, createKnowledgeSchema, createSuggestionSchema, knowledgeIdSchema, listConversationsSchema, listKnowledgeSchema, listSuggestionsSchema, searchKnowledgeSchema, updateKnowledgeSchema } from '../validators/knowledgeValidator.js';

const router = express.Router();
const knowledgeBase = [authenticate, authorize('ADMIN'), requireFeature('KNOWLEDGE_BASE')] as const;
const assistantBase = [authenticate, authorize('PT'), requireFeature('PT_ASSISTANT')] as const;
/* legacy manual validators
const idValidator = (req: Request): ValidationIssue[] => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã bản ghi không hợp lệ.' }];
const knowledgeBody = (req: Request): ValidationIssue[] => ['title', 'topic', 'content'].flatMap((field) => typeof req.body[field] === 'string' && req.body[field].trim() ? [] : [{ field, message: `Trường ${field} là bắt buộc.` }]);
const knowledgeUpdate = (req: Request): ValidationIssue[] => { const errors = idValidator(req); for (const field of ['title', 'topic', 'content']) if (req.body[field] !== undefined && (typeof req.body[field] !== 'string' || !req.body[field].trim())) errors.push({ field, message: `${field} không hợp lệ.` }); return errors; };
const suggestionBody = (req: Request): ValidationIssue[] => { const errors: ValidationIssue[] = []; if (!mongoose.isValidObjectId(req.body.customerId)) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' }); if (typeof req.body.scenario !== 'string' || !req.body.scenario.trim()) errors.push({ field: 'scenario', message: 'Vui lòng nhập tình huống.' }); if (typeof req.body.requestType !== 'string' || !req.body.requestType.trim()) errors.push({ field: 'requestType', message: 'Vui lòng chọn loại yêu cầu.' }); return errors; };

*/
router.get('/knowledge/search', authenticate, authorize('ADMIN', 'PT'), requireFeature('KNOWLEDGE_BASE'), validate(searchKnowledgeSchema), controller.searchKnowledge);
router.get('/knowledge', ...knowledgeBase, validate(listKnowledgeSchema), controller.listKnowledge);
router.post('/knowledge', ...knowledgeBase, validate(createKnowledgeSchema), controller.createKnowledge);
router.patch('/knowledge/:id', ...knowledgeBase, validate(updateKnowledgeSchema), controller.updateKnowledge);
router.delete('/knowledge/:id', ...knowledgeBase, validate(knowledgeIdSchema), controller.deleteKnowledge);
router.patch('/knowledge/:id/publish', ...knowledgeBase, validate(knowledgeIdSchema), controller.publishKnowledge);
router.patch('/knowledge/:id/unpublish', ...knowledgeBase, validate(knowledgeIdSchema), controller.unpublishKnowledge);
router.post('/knowledge/:id/index', ...knowledgeBase, validate(knowledgeIdSchema), controller.indexKnowledge);
router.post('/knowledge/seed-standard', ...knowledgeBase, controller.seedStandardKnowledge);

router.get('/assistant/conversations', ...assistantBase, validate(listConversationsSchema), controller.listConversations);
router.post('/assistant/conversations', ...assistantBase, validate(createConversationSchema), controller.createConversation);
router.post('/assistant/conversations/:id/messages', ...assistantBase, validate(addConversationMessageSchema), controller.addConversationMessage);
router.post('/assistant/suggestions', ...assistantBase, validate(createSuggestionSchema), controller.createSuggestion);
router.patch('/assistant/suggestions/:id/approve', ...assistantBase, validate(knowledgeIdSchema), controller.approveSuggestion);
router.patch('/assistant/suggestions/:id/reject', ...assistantBase, validate(knowledgeIdSchema), controller.rejectSuggestion);

router.get('/assistant/conversations/:id', ...assistantBase, validate(knowledgeIdSchema), controller.getConversation);
router.get('/assistant/suggestions', ...assistantBase, validate(listSuggestionsSchema), controller.listSuggestions);
router.get('/assistant/suggestions/:id', ...assistantBase, validate(knowledgeIdSchema), controller.getSuggestion);
router.patch('/assistant/suggestions/:id/apply', ...assistantBase, validate(knowledgeIdSchema), controller.applySuggestion);

export default router;
