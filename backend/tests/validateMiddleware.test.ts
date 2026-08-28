import express from 'express';
import Joi from 'joi';
import request from 'supertest';
import { validate } from '../middlewares/validate.js';
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
});
