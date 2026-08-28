import type Joi from 'joi';

export interface ValidationIssue { field: string; message: string }

const MESSAGE_MARKER = '__JOI_DEFAULT__:';

type Translator = (field: string, context: Record<string, unknown>) => string;

const translators: Record<string, Translator> = {
  'any.required': (field) => `Vui lòng nhập ${field}.`,
  'any.only': (field) => `${field} phải là một trong các giá trị được cho phép.`,
  'any.invalid': (field) => `Giá trị của ${field} không hợp lệ.`,
  'any.unknown': (field) => `Trường ${field} không được phép.`,
  'alternatives.match': (field) => `Giá trị của ${field} không hợp lệ.`,
  'alternatives.types': (field) => `Kiểu dữ liệu của ${field} không hợp lệ.`,
  'array.base': (field) => `${field} phải là một danh sách.`,
  'array.length': (field, context) => `${field} phải có đúng ${context.limit} phần tử.`,
  'array.max': (field, context) => `${field} không được có quá ${context.limit} phần tử.`,
  'array.min': (field, context) => `${field} phải có ít nhất ${context.limit} phần tử.`,
  'array.unique': (field) => `${field} không được chứa giá trị trùng lặp.`,
  'boolean.base': (field) => `${field} phải là giá trị đúng hoặc sai.`,
  'date.base': (field) => `${field} phải là ngày hợp lệ.`,
  'date.format': (field) => `${field} không đúng định dạng ngày.`,
  'date.greater': (field) => `${field} phải sau mốc thời gian được yêu cầu.`,
  'date.less': (field) => `${field} phải trước mốc thời gian được yêu cầu.`,
  'date.max': (field) => `${field} không được sau mốc thời gian tối đa.`,
  'date.min': (field) => `${field} không được trước mốc thời gian tối thiểu.`,
  'number.base': (field) => `${field} phải là một số.`,
  'number.greater': (field, context) => `${field} phải lớn hơn ${context.limit}.`,
  'number.integer': (field) => `${field} phải là số nguyên.`,
  'number.less': (field, context) => `${field} phải nhỏ hơn ${context.limit}.`,
  'number.max': (field, context) => `${field} phải nhỏ hơn hoặc bằng ${context.limit}.`,
  'number.min': (field, context) => `${field} phải lớn hơn hoặc bằng ${context.limit}.`,
  'number.positive': (field) => `${field} phải là số dương.`,
  'object.base': (field) => `${field} phải là một đối tượng.`,
  'object.length': (field, context) => `${field} phải có đúng ${context.limit} trường.`,
  'object.max': (field, context) => `${field} không được có quá ${context.limit} trường.`,
  'object.min': (field, context) => `${field} phải có ít nhất ${context.limit} trường.`,
  'object.unknown': (field) => `Trường ${field} không được phép.`,
  'string.alphanum': (field) => `${field} chỉ được chứa chữ và số.`,
  'string.base': (field) => `${field} phải là chuỗi ký tự.`,
  'string.email': (field) => `${field} không đúng định dạng.`,
  'string.empty': (field) => `Vui lòng nhập ${field}.`,
  'string.length': (field, context) => `${field} phải có đúng ${context.limit} ký tự.`,
  'string.max': (field, context) => `${field} không được vượt quá ${context.limit} ký tự.`,
  'string.min': (field, context) => `${field} phải có ít nhất ${context.limit} ký tự.`,
  'string.pattern.base': (field) => `${field} không đúng định dạng.`,
  'string.uri': (field) => `${field} phải là URL hợp lệ.`,
};

const joiMessages = Object.fromEntries(
  Object.keys(translators).map((type) => [type, `${MESSAGE_MARKER}${type}`]),
);

function validationIssue(detail: Joi.ValidationErrorItem, fallbackField: string): ValidationIssue {
  const field = detail.path.length > 0 ? detail.path.join('.') : fallbackField;
  const translator = translators[detail.type];
  if (!translator) return { field, message: `Giá trị của ${field} không hợp lệ.` };
  if (!detail.message.startsWith(MESSAGE_MARKER)) return { field, message: detail.message };
  return { field, message: translator(field, detail.context || {}) };
}

export { joiMessages, validationIssue };
