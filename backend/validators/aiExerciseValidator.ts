import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages } from './commonValidator.js';

export const exerciseGenerationRequestSchema: RequestValidationSchema = {
  body: Joi.object({
    mode: Joi.string().valid('SINGLE', 'BATCH').required(),
    muscleGroup: Joi.string().trim().required(),
    level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required(),
    defaultTrackingType: Joi.string().valid('STRENGTH', 'BODYWEIGHT', 'CARDIO', 'INTERVAL', 'MOBILITY').required(),
    equipment: Joi.array().items(Joi.string().trim()).max(20).default([]),
    quantity: Joi.number().integer().min(1).max(10).required(),
    additionalRequest: Joi.string().trim().allow('').max(1000).default(''),
  }).custom((value, helpers) => {
    if (value.mode === 'SINGLE' && value.quantity !== 1) return helpers.message({ custom: 'Chế độ tạo một bài chỉ chấp nhận số lượng là 1.' });
    if (value.mode === 'BATCH' && value.quantity < 2) return helpers.message({ custom: 'Chế độ tạo nhiều bài yêu cầu số lượng từ 2 đến 10.' });
    return value;
  }).messages({ ...commonMessages, custom: '{{#message}}' }),
};
