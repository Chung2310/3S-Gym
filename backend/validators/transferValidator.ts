import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages, idParams, objectId, paginationQuery } from './commonValidator.js';

const transferBody = { customerId: objectId.required(), toPtId: objectId.required(), reason: Joi.string().trim().required() };
export const listTransfersSchema: RequestValidationSchema = { query: Joi.object({ ...paginationQuery, status: Joi.string().valid('PENDING', 'ACCEPTED', 'REJECTED', 'ADMIN_FORCED'), customerId: objectId }).messages(commonMessages) };
export const createTransferSchema: RequestValidationSchema = { body: Joi.object(transferBody).messages(commonMessages) };
export const updateTransferSchema: RequestValidationSchema = { params: idParams(), body: Joi.object({ toPtId: objectId.required(), reason: Joi.string().trim().required() }).messages(commonMessages) };
export const transferIdSchema: RequestValidationSchema = { params: idParams() };
export const forceTransferSchema: RequestValidationSchema = { params: idParams(), body: Joi.object(transferBody).messages(commonMessages) };
export const directForceTransferSchema: RequestValidationSchema = { body: Joi.object(transferBody).messages(commonMessages) };
export const batchForceTransferSchema: RequestValidationSchema = {
  body: Joi.object({
    customerIds: Joi.array().items(objectId).min(1).required(),
    toPtId: objectId.required(),
    reason: Joi.string().trim().required(),
  }).messages(commonMessages),
};
