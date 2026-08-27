import { AppError } from '../errors/AppError.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { normalizeError } from '../errors/normalizeError.js';
import { errorHandler } from '../middlewares/errorHandler.js';
import type { Request, Response } from 'express';
describe('hạ tầng xử lý lỗi', () => {
  it('AppError giữ contract lỗi nghiệp vụ', () => {
    const error = new AppError({ status: 409, code: 'DUPLICATE_RESOURCE', message: 'Dữ liệu đã tồn tại.', errors: [{ field: 'email', message: 'Email đã tồn tại.' }] });
    expect(error).toMatchObject({ status: 409, code: 'DUPLICATE_RESOURCE', isOperational: true });
    expect(error.errors).toHaveLength(1);
  });

  it('asyncHandler chuyển rejected promise vào next', async () => {
    const error = new Error('fail');
    const next = vi.fn();
    await asyncHandler(async () => { throw error; })({} as unknown as Request, {} as unknown as Response, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('chuẩn hóa lỗi Mongo duplicate mà không lộ giá trị', () => {
    const error = normalizeError({ code: 11000, keyPattern: { email: 1 }, keyValue: { email: 'secret@example.com' } });
    expect(error).toMatchObject({ status: 409, code: 'DUPLICATE_RESOURCE', message: 'Email đã được sử dụng.' });
    expect(JSON.stringify(error)).not.toContain('secret@example.com');
  });

  it('lỗi ngoài dự kiến trả message chung và request ID', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), headersSent: false };
    const req = { requestId: 'req-test', log: { error: vi.fn() } };
    errorHandler(new Error('Mongo network timeout'), req as unknown as Request, res as unknown as Response, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.', code: 'INTERNAL_SERVER_ERROR', requestId: 'req-test' });
    expect(req.log.error).toHaveBeenCalledWith(expect.objectContaining({ context: 'Error Handler', requestId: 'req-test', err: expect.any(Error) }), 'Xử lý request thất bại');
  });

  it('lỗi nghiệp vụ ghi warn với context nhưng không ghi stack', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), headersSent: false };
    const req = { requestId: 'req-operational', log: { warn: vi.fn() } };
    const error = new AppError({ status: 400, code: 'INVALID_INPUT', message: 'Dữ liệu không hợp lệ.' });
    errorHandler(error, req as unknown as Request, res as unknown as Response, vi.fn());
    expect(req.log.warn).toHaveBeenCalledWith({ context: 'Error Handler', errorName: 'AppError', code: 'INVALID_INPUT', requestId: 'req-operational' }, 'Xử lý request thất bại');
  });
});
