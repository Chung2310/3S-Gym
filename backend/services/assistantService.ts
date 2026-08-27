import { Types } from 'mongoose';
import CustomerProfile from '../models/CustomerProfile.js';
import AssistantSuggestion from '../models/AssistantSuggestion.js';
import AssistantConversation from '../models/AssistantConversation.js';
import { searchPublished } from './knowledgeService.js';
import { generateText } from './aiProvider.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import type { AuthenticatedUser } from '../types/express.js';
import { recordAudit } from './auditService.js';
export async function getConversation(user: AuthenticatedUser, id: string) { const item = await AssistantConversation.findOne({ _id: id, ptId: new Types.ObjectId(user.id) }); if (!item) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy hội thoại.' }); return item; }
export async function listSuggestions(user: AuthenticatedUser, query: Record<string, unknown>) { const page = Number(query.page || 1); const limit = Number(query.limit || 20); const filter: Record<string, unknown> = { ptId: new Types.ObjectId(user.id) }; if (typeof query.customerId === 'string') filter.customerId = new Types.ObjectId(query.customerId); if (['PT_REVIEW_REQUIRED', 'APPROVED', 'REJECTED'].includes(String(query.reviewStatus))) filter.reviewStatus = query.reviewStatus; const [items, total] = await Promise.all([AssistantSuggestion.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), AssistantSuggestion.countDocuments(filter)]); return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function getSuggestion(user: AuthenticatedUser, id: string) { const item = await AssistantSuggestion.findOne({ _id: id, ptId: new Types.ObjectId(user.id) }); if (!item) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy đề xuất.' }); return item; }
export async function applySuggestion(user: AuthenticatedUser, id: string) { const item = await AssistantSuggestion.findOne({ _id: id, ptId: new Types.ObjectId(user.id), reviewStatus: 'APPROVED', appliedAt: null }); if (!item) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy đề xuất đã duyệt và chưa sử dụng.' }); item.appliedAt = new Date(); await item.save(); await recordAudit({ actor: user, action: 'ASSISTANT_SUGGESTION_APPLIED', resourceType: 'assistantSuggestion', resourceId: id, customerId: item.customerId }); return item; }
export async function createSuggestion(user: AuthenticatedUser, payload: { customerId: string; scenario: string; requestType: string }) {
  const customer = await CustomerProfile.findById(payload.customerId).lean();
  if (!customer) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' });
  if (user.role === 'PT' && String(customer.assignedPtId) !== user.id) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền sử dụng dữ liệu khách hàng này.' });
  const sources = await searchPublished(payload.scenario, 5);
  const prompt = `Bạn là trợ lý PT 3S. Không chẩn đoán y khoa. Khách: ${customer.fullName}. Tình huống: ${payload.scenario}. Nguồn đã duyệt: ${sources.map((s) => `${s.title}: ${s.content}`).join('\n')}. Tạo đề xuất để PT kiểm tra.`;
  const content = await generateText(prompt);
  return AssistantSuggestion.create({ customerId: customer._id, ptId: user.id, requestType: payload.requestType, scenario: payload.scenario, content, citations: sources.map((s) => ({ documentId: s.documentId, title: s.title })), customerContextFields: ['fullName', 'initialGoal'], safetyWarnings: ['Nội dung do AI đề xuất, PT phải kiểm tra trước khi sử dụng.'], reviewStatus: 'PT_REVIEW_REQUIRED', appliedAt: null });
}
export async function reviewSuggestion(user: AuthenticatedUser, id: string, approve: boolean, editedContent?: string) {
  const item = await AssistantSuggestion.findOne({ _id: id, ptId: new Types.ObjectId(user.id), reviewStatus: 'PT_REVIEW_REQUIRED' });
  if (!item) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy đề xuất đang chờ duyệt.' });
  item.reviewStatus = approve ? 'APPROVED' : 'REJECTED'; item.reviewedAt = new Date(); if (editedContent) item.editedContent = editedContent;
  const saved = await item.save();
  await recordAudit({ actor: user, action: approve ? 'ASSISTANT_SUGGESTION_APPROVED' : 'ASSISTANT_SUGGESTION_REJECTED', resourceType: 'assistantSuggestion', resourceId: id, customerId: item.customerId });
  return saved;
}
async function assertCustomer(user: AuthenticatedUser, customerId: string) { const customer = await CustomerProfile.findById(customerId).lean(); if (!customer) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy khách hàng.' }); if (user.role === 'PT' && String(customer.assignedPtId) !== user.id) throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý khách hàng này.' }); return customer; }
export async function createConversation(user: AuthenticatedUser, payload: { customerId: string; title: string }) { await assertCustomer(user, payload.customerId); return AssistantConversation.create({ ...payload, ptId: user.id, messages: [] }); }
export async function listConversations(user: AuthenticatedUser, query: Record<string, unknown>) { const page = Number(query.page || 1); const limit = Number(query.limit || 20); const filter: Record<string, unknown> = { ptId: new Types.ObjectId(user.id) }; if (typeof query.customerId === 'string') filter.customerId = new Types.ObjectId(query.customerId); const [items, total] = await Promise.all([AssistantConversation.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), AssistantConversation.countDocuments(filter)]); return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }; }
export async function addConversationMessage(user: AuthenticatedUser, id: string, payload: { content: string; requestType: string }) { const conversation = await AssistantConversation.findOne({ _id: id, ptId: new Types.ObjectId(user.id) }); if (!conversation) throw new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message: 'Không tìm thấy hội thoại.' }); const suggestion = await createSuggestion(user, { customerId: String(conversation.customerId), scenario: payload.content, requestType: payload.requestType }); const now = new Date(); conversation.messages.push({ role: 'USER', content: payload.content, createdAt: now }, { role: 'ASSISTANT', content: suggestion.content, suggestionId: suggestion._id, citations: suggestion.citations, reviewStatus: suggestion.reviewStatus, createdAt: new Date() }); return conversation.save(); }
