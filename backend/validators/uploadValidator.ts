import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages, objectId } from './commonValidator.js';
const imageFile = Joi.object({ mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required() }).unknown(true).required().messages({ ...commonMessages, 'any.required': 'Vui lòng cung cấp file ảnh.', 'any.only': 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' });
export const imageUploadSchema: RequestValidationSchema = { file: imageFile };
export const inbodyOcrUploadSchema: RequestValidationSchema = { body: Joi.object({ customerId: objectId.required(), measurementDate: Joi.date().iso().required() }).messages(commonMessages), file: imageFile };
