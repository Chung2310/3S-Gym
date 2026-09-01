import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages } from './commonValidator.js';

export const loginSchema: RequestValidationSchema = { body: Joi.object({
  username: Joi.string().trim().required().messages({ ...commonMessages, 'string.empty': 'Vui lòng nhập tên đăng nhập.' }),
  password: Joi.string().required().messages({ ...commonMessages, 'string.empty': 'Vui lòng nhập mật khẩu.' }),
}).messages(commonMessages) };
