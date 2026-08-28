import express from 'express';
import Joi from 'joi';
import request from 'supertest';
import { validate, validationIssue } from '../middlewares/validate.js';
import { errorHandler } from '../middlewares/errorHandler.js';

describe('Joi validation middleware', () => {
  it('chuẩn hóa body, params và query trước khi gọi handler', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/items/:id',
      validate({
        params: Joi.object({ id: Joi.string().required().messages({ 'any.required': 'Vui lòng nhập mã.' }) }),
        query: Joi.object({
          page: Joi.number().integer().min(1).required().messages({ 'number.base': 'Trang không hợp lệ.' }),
          active: Joi.boolean().required().messages({ 'boolean.base': 'Trạng thái không hợp lệ.' }),
        }),
        body: Joi.object({
          happenedAt: Joi.date().iso().required().messages({ 'date.format': 'Ngày không hợp lệ.' }),
        }),
      }),
      (req, res) => res.json({ params: req.params, query: req.query, body: req.body }),
    );
    app.use(errorHandler);

    const response = await request(app)
      .post('/items/abc?page=2&active=true')
      .send({ happenedAt: '2026-08-28T00:00:00.000Z' });

    expect(response.status).toBe(200);
    expect(response.body.params).toEqual({ id: 'abc' });
    expect(response.body.query).toEqual({ page: 2, active: true });
    expect(response.body.body.happenedAt).toBe('2026-08-28T00:00:00.000Z');
  });

  it('trả tất cả lỗi, cấm field lạ và dùng dotted path', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/workouts',
      validate({
        body: Joi.object({
          email: Joi.string().email().required().messages({
            'string.email': 'Email không hợp lệ.',
            'any.required': 'Vui lòng nhập email.',
          }),
          sessions: Joi.array().items(Joi.object({
            exercises: Joi.array().items(Joi.object({
              sets: Joi.number().integer().min(1).required().messages({
                'number.min': 'Số hiệp phải lớn hơn 0.',
                'any.required': 'Vui lòng nhập số hiệp.',
              }),
            })),
          })),
        }).messages({ 'object.unknown': 'Trường không được phép.' }),
      }),
      (_req, res) => res.sendStatus(204),
    );
    app.use(errorHandler);

    const response = await request(app).post('/workouts').send({
      email: 'sai',
      extra: true,
      sessions: [{ exercises: [{ sets: 1 }, { sets: 0 }] }],
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu gửi lên không hợp lệ.',
    });
    expect(response.body.errors).toEqual(expect.arrayContaining([
      { field: 'email', message: 'Email không hợp lệ.' },
      { field: 'extra', message: 'Trường không được phép.' },
      { field: 'sessions.0.exercises.1.sets', message: 'Số hiệp phải lớn hơn 0.' },
    ]));
  });

  it('dịch lỗi Joi mặc định sang tiếng Việt và giữ message đặc thù', async () => {
    const app = express();
    app.use(express.json());
    app.post('/localized', validate({
      body: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid('PT', 'ADMIN').required(),
        age: Joi.number().integer().min(18).required(),
        happenedAt: Joi.date().iso().required(),
        custom: Joi.string().min(3).messages({ 'string.min': 'Nội dung tùy chỉnh quá ngắn.' }),
        sessions: Joi.array().items(Joi.object({ sets: Joi.number().min(1) })),
      }),
    }), (_req, res) => res.sendStatus(204));
    app.use(errorHandler);

    const response = await request(app).post('/localized').send({
      name: '', email: 'invalid', role: 'CUSTOMER', age: 17.5,
      happenedAt: 'not-a-date', custom: 'x', sessions: [{ sets: 0 }], extra: true,
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(expect.arrayContaining([
      { field: 'name', message: 'Vui lòng nhập name.' },
      { field: 'email', message: 'email không đúng định dạng.' },
      { field: 'role', message: 'role phải là một trong các giá trị được cho phép.' },
      { field: 'age', message: 'age phải là số nguyên.' },
      { field: 'happenedAt', message: 'happenedAt không đúng định dạng ngày.' },
      { field: 'custom', message: 'Nội dung tùy chỉnh quá ngắn.' },
      { field: 'sessions.0.sets', message: 'sessions.0.sets phải lớn hơn hoặc bằng 1.' },
      { field: 'extra', message: 'Trường extra không được phép.' },
    ]));
    expect(response.body.errors.map((error: { message: string }) => error.message).join(' '))
      .not.toMatch(/is required|must be|not allowed|valid email|valid date/i);
  });

  it('dùng fallback tiếng Việt cho loại lỗi Joi chưa được ánh xạ', () => {
    expect(validationIssue({
      message: 'future Joi message', path: ['profile', 'code'], type: 'custom.future',
      context: { label: 'profile.code', key: 'code' },
    }, 'body')).toEqual({
      field: 'profile.code', message: 'Giá trị của profile.code không hợp lệ.',
    });
  });
});
