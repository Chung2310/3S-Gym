// @vitest-environment jsdom
import { ApiError, api } from '../../src/services/api';
import { errorMessage, fieldErrors } from '../../src/types';

beforeEach(() => {
  localStorage.clear();
});

describe('api client', () => {
  it('giữ summary top-level của list response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: [], summary: { netCalories: 420 } }) });
    await expect(api.get('/api/nutrition/logs')).resolves.toMatchObject({ summary: { netCalories: 420 } });
  });

  it('giải mã data và meta từ response chuẩn', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Thành công.', data: [{ id: 1 }], meta: { page: 1 } }),
    });

    await expect(api.get('/api/customers')).resolves.toEqual({ data: [{ id: 1 }], meta: { page: 1 }, message: 'Thành công.' });
  });

  it('giữ status, code, requestId và field errors từ response lỗi', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        code: 'VALIDATION_ERROR',
        requestId: 'req-422',
        errors: [{ field: 'email', message: 'Email không hợp lệ.' }],
      }),
    });

    await expect(api.get('/api/customers')).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      requestId: 'req-422',
      errors: [{ field: 'email', message: 'Email không hợp lệ.' }],
    });
  });

  it('xóa session khi server trả 401', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('user', JSON.stringify({ username: 'pt-a', role: 'PT' }));
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Bạn chưa đăng nhập.', code: 'AUTHENTICATION_ERROR', requestId: 'req-401' }),
    });

    await expect(api.get('/api/private')).rejects.toMatchObject({ status: 401, code: 'AUTHENTICATION_ERROR' });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('hiển thị các field message duy nhất thay cho message tổng quát', () => {
    const error = new ApiError('Dữ liệu gửi lên không hợp lệ.', 400, 'VALIDATION_ERROR', 'req-400', [
      { field: 'email', message: 'Email không đúng định dạng.' },
      { field: 'profile.email', message: 'Email không đúng định dạng.' },
      { field: 'sessions.0.sets', message: 'Số hiệp phải lớn hơn hoặc bằng 1.' },
    ]);

    expect(errorMessage(error)).toBe('Email không đúng định dạng. Số hiệp phải lớn hơn hoặc bằng 1.');
  });

  it('tạo field error map theo dotted path và giữ lỗi đầu tiên', () => {
    const error = new ApiError('Dữ liệu gửi lên không hợp lệ.', 400, 'VALIDATION_ERROR', 'req-400', [
      { field: 'sessions.0.sets', message: 'Số hiệp không hợp lệ.' },
      { field: 'sessions.0.sets', message: 'Số hiệp phải lớn hơn 0.' },
      { field: 'email', message: 'Email không đúng định dạng.' },
    ]);

    expect(fieldErrors(error)).toEqual({
      'sessions.0.sets': 'Số hiệp không hợp lệ.',
      email: 'Email không đúng định dạng.',
    });
  });

  it('giữ fallback cho lỗi không có field errors', () => {
    expect(errorMessage(new Error('Mất kết nối.'))).toBe('Mất kết nối.');
    expect(fieldErrors(new Error('Mất kết nối.'))).toEqual({});
    expect(errorMessage(null)).toBe('Không thể thực hiện yêu cầu.');
  });
});
