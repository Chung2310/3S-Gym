import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages, objectId, paginationQuery } from './commonValidator.js';

export const topupSchema: RequestValidationSchema = {
  body: Joi.object({
    gateway: Joi.string().valid('VNPAY', 'MOMO').required(),
    packageId: objectId,
    customAmountVnd: Joi.number().integer().min(10_000).max(50_000_000).multiple(1_000),
  }).xor('packageId', 'customAmountVnd').messages(commonMessages),
};

export const orderParamsSchema: RequestValidationSchema = {
  params: Joi.object({ id: objectId.required() }).messages(commonMessages),
};

export const ledgerQuerySchema: RequestValidationSchema = {
  query: Joi.object({ ...paginationQuery, type: Joi.string().valid('TOPUP', 'RESERVE', 'SETTLE', 'RELEASE', 'ADJUSTMENT') }).messages(commonMessages),
};
