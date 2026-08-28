import Joi from 'joi';
import mongoose from 'mongoose';

export const commonMessages: Record<string, string> = {
  'any.required': '{{#label}} là trường bắt buộc.',
  'any.only': '{{#label}} không hợp lệ.',
  'any.unknown': '{{#label}} không được phép.',
  'object.unknown': '{{#label}} không được phép.',
  'object.min': 'Vui lòng cung cấp ít nhất một trường cần cập nhật.',
  'string.base': '{{#label}} phải là chuỗi.',
  'string.empty': '{{#label}} không được để trống.',
  'string.email': 'Email không hợp lệ.',
  'string.uri': '{{#label}} không phải URL hợp lệ.',
  'string.objectId': '{{#label}} không hợp lệ.',
  'number.base': '{{#label}} phải là số.',
  'number.integer': '{{#label}} phải là số nguyên.',
  'number.min': '{{#label}} quá nhỏ.',
  'number.max': '{{#label}} quá lớn.',
  'boolean.base': '{{#label}} phải là true hoặc false.',
  'date.base': '{{#label}} không phải ngày hợp lệ.',
  'date.format': '{{#label}} không đúng định dạng ngày.',
  'array.base': '{{#label}} phải là danh sách.',
};

export const objectId = Joi.string().custom((value: string, helpers) => (
  mongoose.isValidObjectId(value) ? value : helpers.error('string.objectId')
)).messages(commonMessages);

export const email = Joi.string().trim().email().messages(commonMessages);
export const isoDate = Joi.date().iso().messages(commonMessages);

export const paginationQuery = {
  page: Joi.number().integer().min(1).default(1).messages(commonMessages),
  limit: Joi.number().integer().min(1).max(100).default(20).messages(commonMessages),
};

export function idParams(field = 'id'): Joi.ObjectSchema {
  return Joi.object({ [field]: objectId.required() }).messages(commonMessages);
}

export function nonEmptyPatch(fields: Joi.SchemaMap): Joi.ObjectSchema {
  return Joi.object(fields).min(1).messages(commonMessages);
}

export function withDateRange(fields: Joi.SchemaMap, fromKey: string, toKey: string): Joi.ObjectSchema {
  return Joi.object(fields).custom((value: Record<string, unknown>, helpers) => {
    const from = value[fromKey];
    const to = value[toKey];
    if (from && to && new Date(String(to)) <= new Date(String(from))) {
      return helpers.message({ custom: `Ngày ${toKey} phải sau ngày ${fromKey}.` });
    }
    return value;
  }).messages(commonMessages);
}
