import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages } from './commonValidator.js';

export const loginSchema: RequestValidationSchema = {
  body: Joi.object({
    username: Joi.string().trim().required().messages({ ...commonMessages, 'string.empty': 'Vui lòng nhập tên đăng nhập.' }),
    password: Joi.string().required().messages({ ...commonMessages, 'string.empty': 'Vui lòng nhập mật khẩu.' }),
    clientType: Joi.string().valid('WEB', 'MOBILE').default('WEB'),
    deviceInfo: Joi.object({
      deviceId: Joi.string().allow('', null).optional(),
      deviceName: Joi.string().allow('', null).optional(),
      platform: Joi.string().allow('', null).optional(),
      osVersion: Joi.string().allow('', null).optional(),
      appVersion: Joi.string().allow('', null).optional(),
    }).optional(),
    pushToken: Joi.string().trim().allow('', null).optional(),
  }).messages(commonMessages),
};

export const refreshSchema: RequestValidationSchema = {
  body: Joi.object({
    refreshToken: Joi.string().trim().required().messages({
      ...commonMessages,
      'string.empty': 'Vui lòng cung cấp mã Refresh Token.',
    }),
  }).messages(commonMessages),
};

export const logoutSchema: RequestValidationSchema = {
  body: Joi.object({
    refreshToken: Joi.string().trim().allow('', null).optional(),
    pushToken: Joi.string().trim().allow('', null).optional(),
  }).messages(commonMessages),
};

