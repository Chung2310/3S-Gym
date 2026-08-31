import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages, idParams, nonEmptyPatch, objectId, paginationQuery } from './commonValidator.js';
export const searchKnowledgeSchema: RequestValidationSchema = { query: Joi.object({ q: Joi.string().trim().required() }).messages(commonMessages) };
export const listKnowledgeSchema: RequestValidationSchema = { query: Joi.object({ ...paginationQuery, status: Joi.string().valid('DRAFT', 'PUBLISHED'), topic: Joi.string(), keyword: Joi.string().allow('') }).messages(commonMessages) };
const knowledgeFields = { title: Joi.string().trim(), topic: Joi.string().trim(), content: Joi.string().trim(), effectiveAt: Joi.date().iso() };
export const createKnowledgeSchema: RequestValidationSchema = { body: Joi.object({ title: knowledgeFields.title.required(), topic: knowledgeFields.topic.required(), content: knowledgeFields.content.required(), effectiveAt: knowledgeFields.effectiveAt }).messages(commonMessages) };
export const updateKnowledgeSchema: RequestValidationSchema = { params: idParams(), body: nonEmptyPatch({ ...knowledgeFields, status: Joi.forbidden(), version: Joi.forbidden(), publishedAt: Joi.forbidden() }) };
export const knowledgeIdSchema: RequestValidationSchema = { params: idParams() };
export const listConversationsSchema: RequestValidationSchema = { query: Joi.object({ ...paginationQuery, customerId: objectId.allow('', null) }).messages(commonMessages) };
export const createConversationSchema: RequestValidationSchema = { body: Joi.object({ customerId: objectId.allow('', null), title: Joi.string().trim().required() }).messages(commonMessages) };
export const addConversationMessageSchema: RequestValidationSchema = { params: idParams(), body: Joi.object({ content: Joi.string().trim().required(), requestType: Joi.string().trim().required() }).messages(commonMessages) };
export const createSuggestionSchema: RequestValidationSchema = { body: Joi.object({ customerId: objectId.allow('', null), scenario: Joi.string().trim().required(), requestType: Joi.string().trim().required() }).messages(commonMessages) };
export const listSuggestionsSchema: RequestValidationSchema = { query: Joi.object({ ...paginationQuery, customerId: objectId.allow('', null), reviewStatus: Joi.string().valid('PT_REVIEW_REQUIRED', 'APPROVED', 'REJECTED') }).messages(commonMessages) };
export const contentDraftSchema: RequestValidationSchema = { body: Joi.object({ customerId: objectId.required(), request: Joi.string().trim().min(10).required() }).messages(commonMessages) };
export const nutritionAnalysisSchema: RequestValidationSchema = {
  body: Joi.object({
    customerId: objectId.allow('', null),
    weight: Joi.number().min(20).max(300),
    height: Joi.number().min(50).max(250),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
    age: Joi.number().min(10).max(120),
    bodyFat: Joi.number().min(3).max(70),
    bodyType: Joi.string().allow('').max(200),
    dailySchedule: Joi.string().allow('').max(500),
    dietaryPreferences: Joi.string().allow('').max(500),
    medicalNotes: Joi.string().allow('').max(500),
    fitnessGoal: Joi.string().allow('').max(300),
    request: Joi.string().allow('').max(1000),
  }).messages(commonMessages),
};

