import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages, objectId } from './commonValidator.js';
const imageFile = Joi.object({ mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required() }).unknown(true).required().messages({ ...commonMessages, 'any.required': 'Vui lòng cung cấp file ảnh.', 'any.only': 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' });
const videoFile = Joi.object({ mimetype: Joi.string().valid('video/mp4', 'video/webm', 'video/quicktime').required() }).unknown(true).required().messages({ ...commonMessages, 'any.required': 'Vui lòng cung cấp file video.', 'any.only': 'Chỉ hỗ trợ video MP4, WebM hoặc MOV.' });
export const imageUploadSchema: RequestValidationSchema = { file: imageFile };
export const videoUploadSchema: RequestValidationSchema = { file: videoFile, fileField: 'video' };
export const inbodyOcrUploadSchema: RequestValidationSchema = { body: Joi.object({ customerId: objectId.required(), measurementDate: Joi.date().iso().required() }).messages(commonMessages), file: imageFile };
